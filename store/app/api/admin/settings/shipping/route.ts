import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const SETTINGS_KEY = "shipping_config";

const shippingSettingsSchema = z.object({
  freeShippingThreshold:  z.number().nonnegative(),    // ₹ above which shipping is free
  standardShippingCost:   z.number().nonnegative(),
  expressShippingCost:    z.number().nonnegative(),
  codEnabled:             z.boolean(),
  codExtraCharge:         z.number().nonnegative(),    // extra ₹ fee for COD
  codMinOrder:            z.number().nonnegative(),    // min order to allow COD
  estimatedDeliveryDays:  z.object({
    standard: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
    express:  z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
  }),
  preferredCouriers:      z.array(z.string()),         // ordered preference list
  restrictedPincodes:     z.array(z.string()),         // pincodes where delivery is unavailable
  internationalEnabled:   z.boolean(),
});

export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  freeShippingThreshold: 499,
  standardShippingCost:  49,
  expressShippingCost:   149,
  codEnabled:            true,
  codExtraCharge:        0,
  codMinOrder:           0,
  estimatedDeliveryDays: {
    standard: { min: 3, max: 5 },
    express:  { min: 1, max: 2 },
  },
  preferredCouriers:    [],
  restrictedPincodes:   [],
  internationalEnabled: false,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await prisma.siteSettings.findUnique({ where: { key: SETTINGS_KEY } });
  const settings = row?.extraData
    ? { ...DEFAULT_SHIPPING_SETTINGS, ...(row.extraData as Record<string, unknown>) }
    : DEFAULT_SHIPPING_SETTINGS;

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = shippingSettingsSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const row = await prisma.siteSettings.upsert({
    where:  { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, extraData: body.data },
    update: { extraData: body.data },
  });

  return NextResponse.json(row.extraData);
}
