import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, CampaignStatus, CampaignType, CampaignEventType } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const createSchema = z.object({
  name:             z.string().min(1).max(120),
  description:      z.string().max(1000).optional(),
  type:             z.nativeEnum(CampaignType),
  targetSegments:   z.array(z.string()).default([]),
  targetAll:        z.boolean().default(false),
  subject:          z.string().max(200).optional(),
  body:             z.string().max(5000).optional(),
  ctaText:          z.string().max(80).optional(),
  ctaUrl:           z.string().url().optional().or(z.literal("")),
  imageUrl:         z.string().url().optional().or(z.literal("")),
  couponId:         z.string().optional(),
  couponCode:       z.string().optional(),
  loyaltyPoints:    z.number().int().min(1).optional(),
  loyaltyMessage:   z.string().max(500).optional(),
  scheduledAt:      z.string().datetime().optional(),
  estimatedAudience: z.number().int().min(0).default(0),
});

// ─── GET — list campaigns ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = 20;
  const status   = searchParams.get("status") as CampaignStatus | null;
  const type     = searchParams.get("type") as CampaignType | null;
  const q        = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type)   where.type   = type;
  if (q)      where.name   = { contains: q, mode: "insensitive" };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  // Audience estimates by segment
  const segmentCounts = await prisma.customerSegment.groupBy({
    by: ["tags"],
    _count: { _all: true },
  });

  return NextResponse.json({
    campaigns,
    total,
    pages: Math.ceil(total / limit),
    segmentCounts,
  });
}

// ─── POST — create campaign ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw  = await req.json();
  const body = createSchema.safeParse(raw);
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const data = body.data;

  // Calculate estimated audience from real segment data
  let estimatedAudience = data.estimatedAudience;
  if (data.targetAll) {
    estimatedAudience = await prisma.user.count({ where: { role: "CUSTOMER", isActive: true } });
  } else if (data.targetSegments.length > 0) {
    estimatedAudience = await prisma.customerSegment.count({
      where: { tags: { hasSome: data.targetSegments as import("@prisma/client").SegmentTag[] } },
    });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name:             data.name,
      description:      data.description,
      type:             data.type,
      targetSegments:   data.targetSegments,
      targetAll:        data.targetAll,
      estimatedAudience,
      subject:          data.subject,
      body:             data.body,
      ctaText:          data.ctaText,
      ctaUrl:           data.ctaUrl || undefined,
      imageUrl:         data.imageUrl || undefined,
      couponId:         data.couponId,
      couponCode:       data.couponCode,
      loyaltyPoints:    data.loyaltyPoints,
      loyaltyMessage:   data.loyaltyMessage,
      scheduledAt:      data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      status:           data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
      createdBy:        session.user.id,
    },
  });

  // Audit log
  try {
    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.user.id } });
    if (adminProfile) {
      await prisma.auditLog.create({
        data: {
          adminId:      adminProfile.id,
          action:       "OTHER",
          resourceType: "campaign",
          resourceId:   campaign.id,
          resourceName: campaign.name,
          newValue:     { type: campaign.type, status: campaign.status, estimatedAudience },
        },
      });
    }
  } catch { /* audit failure must not block response */ }

  // Campaign creation event
  await prisma.campaignEvent.create({
    data: {
      campaignId: campaign.id,
      type:       CampaignEventType.CREATED,
      metadata:   { createdBy: session.user.id, estimatedAudience },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
