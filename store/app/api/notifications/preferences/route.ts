import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// ─── GET — get notification preferences ──────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prefs = await prisma.notificationPreference.upsert({
    where:  { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  return NextResponse.json(prefs);
}

// ─── PATCH — update preferences ──────────────────────────────────────────────

const updateSchema = z.object({
  inApp:             z.boolean().optional(),
  emailOrders:       z.boolean().optional(),
  emailPayments:     z.boolean().optional(),
  emailShipping:     z.boolean().optional(),
  emailReturns:      z.boolean().optional(),
  emailLoyalty:      z.boolean().optional(),
  emailReferral:     z.boolean().optional(),
  emailPromotions:   z.boolean().optional(),
  emailSystem:       z.boolean().optional(),
  emailWishlist:     z.boolean().optional(),
  emailStock:        z.boolean().optional(),
  waOrders:          z.boolean().optional(),
  waPayments:        z.boolean().optional(),
  waShipping:        z.boolean().optional(),
  waPromotions:      z.boolean().optional(),
  pushEnabled:       z.boolean().optional(),
  pushToken:         z.string().optional(),
  globalUnsubscribe: z.boolean().optional(),
  unsubscribeReason: z.string().max(500).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart:   z.number().int().min(0).max(23).optional(),
  quietHoursEnd:     z.number().int().min(0).max(23).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = { ...body.data };

  // Set unsubscribedAt timestamp when globalUnsubscribe changes to true
  if (body.data.globalUnsubscribe === true) {
    data.unsubscribedAt = new Date();
  } else if (body.data.globalUnsubscribe === false) {
    data.unsubscribedAt = null;
  }

  const prefs = await prisma.notificationPreference.upsert({
    where:  { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json(prefs);
}
