import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createNotification, notifyLoyaltyEarned } from "@/lib/notifications";

const MAX_CODE_ATTEMPTS = 10;

function generateCode(name: string): string {
  const base = (name ?? "USER").replace(/\s+/g, "").toUpperCase().slice(0, 5);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${rand}`;
}

async function uniqueReferralCode(name: string): Promise<string> {
  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = generateCode(name);
    const exists = await prisma.customerSegment.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
  }
  // Fallback: use userId-based code which is guaranteed unique
  throw new Error("Could not generate unique referral code");
}

// GET /api/referral — get or create user's referral data
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let segment = await prisma.customerSegment.findUnique({ where: { userId: session.user.id } });

  // Create segment + referral code if not exists
  if (!segment) {
    const code = await uniqueReferralCode(session.user.name ?? "USER");
    segment = await prisma.customerSegment.create({
      data: { userId: session.user.id, referralCode: code, tags: [] },
    });
  } else if (!segment.referralCode) {
    const code = await uniqueReferralCode(session.user.name ?? "USER");
    segment = await prisma.customerSegment.update({
      where: { userId: session.user.id },
      data: { referralCode: code },
    });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      referee: { select: { name: true, email: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    code: segment.referralCode,
    referralCount: segment.referralCount,
    referrals,
    shareUrl: `https://www.tryby.in/?ref=${segment.referralCode}`,
  });
}

// POST /api/referral/apply — apply referral code at signup/first visit
const applySchema = z.object({ code: z.string().min(4).max(16) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = applySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { code } = body.data;

  // Find referrer by code
  const referrerSegment = await prisma.customerSegment.findUnique({ where: { referralCode: code } });
  if (!referrerSegment) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  if (referrerSegment.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
  }

  // Check if user already has a referral
  const existing = await prisma.referral.findFirst({ where: { refereeId: session.user.id } });
  if (existing) return NextResponse.json({ error: "Referral code already applied" }, { status: 400 });

  const referral = await prisma.referral.create({
    data: {
      referrerId: referrerSegment.userId,
      refereeId:  session.user.id,
      code,
      status: "PENDING",
      referrerReward: 100,
      refereeReward: 50,
    },
  });

  // Award 50 welcome points to referee immediately
  const refereeSegment = await prisma.customerSegment.upsert({
    where:  { userId: session.user.id },
    update: { loyaltyPoints: { increment: 50 }, tags: { push: "LOYALTY_MEMBER" } },
    create: { userId: session.user.id, loyaltyPoints: 50, referralCode: generateCode(session.user.name ?? "USER"), tags: ["LOYALTY_MEMBER"] },
  });

  await prisma.loyaltyPoint.create({
    data: {
      userId: session.user.id,
      type: "EARN_REFERRAL",
      points: 50,
      balance: refereeSegment.loyaltyPoints,
      referralId: referral.id,
      description: `Welcome bonus — referred by ${code}`,
    },
  });

  // Notify referee: welcome bonus earned
  notifyLoyaltyEarned(
    session.user.id,
    50,
    `Welcome bonus — you were referred by a friend using code ${code}`
  ).catch(() => {});

  // Notify referrer: someone applied their code
  createNotification({
    userId:      referrerSegment.userId,
    type:        "referral.applied",
    title:       "Someone Used Your Referral Code! 👥",
    body:        `Your referral link was just used. You'll earn 100 bonus points when they place their first order.`,
    actionUrl:   "/account",
    actionLabel: "View Referrals",
    data:        { referralId: referral.id, code },
  }).catch(() => {});

  return NextResponse.json({ ok: true, welcomePoints: 50, referral });
}
