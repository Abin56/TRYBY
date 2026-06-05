import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { syncSingleSupplier, syncAllSuppliers, SupplierFeedItem } from "@/lib/supplier-sync";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// POST /api/admin/supplier-sync/run
// Body: { supplierId?: string; feed: SupplierFeedItem[] }
// If supplierId omitted: sync all enabled suppliers (feed ignored; uses mock/integration per supplier).
// For manual admin trigger with a CSV feed: provide supplierId + feed.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { supplierId, feed } = body as { supplierId?: string; feed?: SupplierFeedItem[] };

  // Single supplier manual sync
  if (supplierId) {
    if (!feed || !Array.isArray(feed)) {
      return NextResponse.json({ error: "feed array required for single-supplier sync" }, { status: 400 });
    }
    const result = await syncSingleSupplier(supplierId, feed);
    return NextResponse.json({ results: [result] });
  }

  // Sync all — use a stub feed provider (real integration plugs in here)
  const results = await syncAllSuppliers(async (sid) => {
    // Pull the supplier's SKU map so we can build a minimal feed
    // In production, replace this with the actual supplier API / SFTP feed fetcher
    const skuMaps = await prisma.supplierSkuMap.findMany({
      where: { supplierId: sid, ignoreUpdates: false },
      include: { variant: true },
    });
    return skuMaps.map((m): SupplierFeedItem => ({
      supplierSku: m.supplierSku,
      stock: m.variant.stock, // mirror current stock — no-op unless real feed overrides
      costPrice: m.variant.costPrice ? Number(m.variant.costPrice) : undefined,
    }));
  });

  return NextResponse.json({ results });
}
