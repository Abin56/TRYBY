import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, CampaignStatus, CampaignEventType } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ─── GET — single campaign ────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

// ─── PATCH — update / trigger status transitions ───────────────────────────────

const patchSchema = z.object({
  action: z.enum(["schedule", "start", "pause", "resume", "complete", "cancel"]).optional(),
  name:         z.string().min(1).max(120).optional(),
  description:  z.string().optional(),
  subject:      z.string().optional(),
  body:         z.string().optional(),
  ctaText:      z.string().optional(),
  ctaUrl:       z.string().optional(),
  scheduledAt:  z.string().datetime().optional(),
  couponCode:   z.string().optional(),
  loyaltyPoints: z.number().int().optional(),
});

const ACTION_TO_STATUS: Record<string, CampaignStatus> = {
  schedule: CampaignStatus.SCHEDULED,
  start:    CampaignStatus.RUNNING,
  pause:    CampaignStatus.PAUSED,
  resume:   CampaignStatus.RUNNING,
  complete: CampaignStatus.COMPLETED,
  cancel:   CampaignStatus.CANCELLED,
};

const ACTION_TO_EVENT: Record<string, CampaignEventType> = {
  schedule: CampaignEventType.SCHEDULED,
  start:    CampaignEventType.STARTED,
  pause:    CampaignEventType.PAUSED,
  resume:   CampaignEventType.RESUMED,
  complete: CampaignEventType.COMPLETED,
  cancel:   CampaignEventType.CANCELLED,
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const raw  = await req.json();
  const body = patchSchema.safeParse(raw);
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, ...fields } = body.data;

  // Build update payload
  const updateData: Record<string, unknown> = {};
  if (fields.name)          updateData.name          = fields.name;
  if (fields.description)   updateData.description   = fields.description;
  if (fields.subject)       updateData.subject       = fields.subject;
  if (fields.body)          updateData.body          = fields.body;
  if (fields.ctaText)       updateData.ctaText       = fields.ctaText;
  if (fields.ctaUrl)        updateData.ctaUrl        = fields.ctaUrl;
  if (fields.scheduledAt)   updateData.scheduledAt   = new Date(fields.scheduledAt);
  if (fields.couponCode)    updateData.couponCode    = fields.couponCode;
  if (fields.loyaltyPoints) updateData.loyaltyPoints = fields.loyaltyPoints;

  if (action) {
    updateData.status = ACTION_TO_STATUS[action];
    if (action === "start")    updateData.startedAt   = new Date();
    if (action === "complete") updateData.completedAt = new Date();
  }

  const [campaign] = await prisma.$transaction([
    prisma.campaign.update({ where: { id }, data: updateData }),
    ...(action ? [
      prisma.campaignEvent.create({
        data: {
          campaignId: id,
          type:       ACTION_TO_EVENT[action],
          metadata:   { by: session.user.id, prevStatus: existing.status },
        },
      })
    ] : []),
  ]);

  // Audit log for status changes
  if (action) {
    try {
      const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.user.id } });
      if (adminProfile) {
        await prisma.auditLog.create({
          data: {
            adminId:      adminProfile.id,
            action:       "OTHER",
            resourceType: "campaign",
            resourceId:   id,
            resourceName: existing.name,
            oldValue:     { status: existing.status },
            newValue:     { status: ACTION_TO_STATUS[action], action },
          },
        });
      }
    } catch { /* audit failure must not block */ }
  }

  return NextResponse.json(campaign);
}

// ─── DELETE — hard delete draft campaigns only ────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (campaign.status !== "DRAFT" && campaign.status !== "CANCELLED") {
    return NextResponse.json({ error: "Only DRAFT or CANCELLED campaigns can be deleted" }, { status: 400 });
  }

  await prisma.campaign.delete({ where: { id } });

  try {
    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.user.id } });
    if (adminProfile) {
      await prisma.auditLog.create({
        data: {
          adminId:      adminProfile.id,
          action:       "OTHER",
          resourceType: "campaign",
          resourceId:   id,
          resourceName: campaign.name,
          oldValue:     { status: campaign.status, type: campaign.type },
        },
      });
    }
  } catch { /* audit failure must not block */ }

  return NextResponse.json({ ok: true });
}
