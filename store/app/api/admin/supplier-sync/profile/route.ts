import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SyncFrequency } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// PUT /api/admin/supplier-sync/profile — upsert sync profile for a supplier
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    supplierId,
    syncEnabled,
    syncFrequency,
    marginPercent,
    minProfitAmount,
    autoHideOutOfStock,
    autoAdjustPrice,
  } = body;

  if (!supplierId) return NextResponse.json({ error: "supplierId required" }, { status: 400 });

  const validFreqs = Object.values(SyncFrequency);
  if (syncFrequency && !validFreqs.includes(syncFrequency)) {
    return NextResponse.json({ error: "invalid syncFrequency" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (syncEnabled      !== undefined) data.syncEnabled      = syncEnabled;
  if (syncFrequency    !== undefined) data.syncFrequency    = syncFrequency;
  if (marginPercent    !== undefined) data.marginPercent    = marginPercent;
  if (minProfitAmount  !== undefined) data.minProfitAmount  = minProfitAmount;
  if (autoHideOutOfStock !== undefined) data.autoHideOutOfStock = autoHideOutOfStock;
  if (autoAdjustPrice  !== undefined) data.autoAdjustPrice  = autoAdjustPrice;

  const profile = await prisma.supplierSyncProfile.upsert({
    where: { supplierId },
    create: { supplierId, ...data },
    update: data,
  });

  return NextResponse.json(profile);
}
