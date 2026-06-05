import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aggregateServiceability } from "@/lib/shipping";

// Public route — called from checkout to check if pincode is deliverable.
// No auth required (customer-facing).

const DEFAULT_WEIGHT_GRAMS = 500;
const STORE_PINCODE = process.env.STORE_PINCODE ?? "400001";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode    = searchParams.get("pincode")?.trim();
  const weightStr  = searchParams.get("weight");
  const isCODStr   = searchParams.get("cod");
  const valueStr   = searchParams.get("value");

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Valid 6-digit pincode required" }, { status: 400 });
  }

  const weightGrams = weightStr ? parseInt(weightStr) : DEFAULT_WEIGHT_GRAMS;
  const isCOD       = isCODStr === "1" || isCODStr === "true";
  const orderValue  = valueStr ? parseFloat(valueStr) : 499;

  // Load restricted pincodes and settings from DB
  const settingsRow = await prisma.siteSettings.findUnique({ where: { key: "shipping_config" } }).catch(() => null);
  const settings    = (settingsRow?.extraData ?? {}) as Record<string, unknown>;
  const restricted  = (settings.restrictedPincodes as string[] | undefined) ?? [];
  const codEnabled  = (settings.codEnabled as boolean | undefined) ?? true;

  if (!codEnabled && isCOD) {
    return NextResponse.json({
      serviceable:  false,
      codAvailable: false,
      estimatedDays: null,
      quotes: [],
      reason: "Cash on Delivery is not available",
    });
  }

  const result = await aggregateServiceability(
    STORE_PINCODE,
    pincode,
    weightGrams,
    isCOD,
    orderValue,
    restricted,
  );

  // Cache for 1 hour — pincode serviceability doesn't change often
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
  });
}
