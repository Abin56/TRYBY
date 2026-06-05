/**
 * Supplier SKU Mappings — CRUD
 *
 * GET  /api/admin/inventory/sku-mappings?supplierId=&q=&page=
 * POST /api/admin/inventory/sku-mappings   (create or upsert bulk)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN;
}

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId") ?? undefined;
  const q          = searchParams.get("q")?.trim() ?? "";
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  const where = {
    ...(supplierId ? { supplierId } : {}),
    ...(q ? {
      OR: [
        { supplierSku: { contains: q, mode: "insensitive" as const } },
        { variant: { sku: { contains: q, mode: "insensitive" as const } } },
        { variant: { product: { name: { contains: q, mode: "insensitive" as const } } } },
      ],
    } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.supplierSkuMap.count({ where }),
    prisma.supplierSkuMap.findMany({
      where,
      include: {
        variant: {
          select: {
            id: true, sku: true, size: true, color: true, stock: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
        supplier: { select: { id: true, companyName: true } },
      },
      orderBy: [{ supplierId: "asc" }, { supplierSku: "asc" }],
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
    }),
  ]);

  // Count unmapped active variants for this supplier (variants whose product belongs to supplierId but no mapping)
  let unmappedCount = 0;
  if (supplierId) {
    unmappedCount = await prisma.productVariant.count({
      where: {
        isActive: true,
        product: { supplierId },
        supplierSkuMap: null,
      },
    });
  }

  return NextResponse.json({
    rows,
    total,
    pages: Math.ceil(total / PAGE_SIZE),
    page,
    unmappedCount,
  });
}

const createSchema = z.object({
  supplierId:     z.string().cuid(),
  supplierSku:    z.string().min(1).max(100),
  variantId:      z.string().cuid(),
  bufferStock:    z.number().int().min(0).default(0),
  manualOverride: z.boolean().default(false),
  ignoreUpdates:  z.boolean().default(false),
});

const bulkSchema = z.object({
  mappings: z.array(createSchema).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Support both single and bulk
  const isBulk   = Array.isArray(body?.mappings);
  const parsed   = isBulk
    ? bulkSchema.safeParse(body)
    : bulkSchema.safeParse({ mappings: [body] });

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const results = [];
  for (const m of parsed.data.mappings) {
    const row = await prisma.supplierSkuMap.upsert({
      where:  { supplierId_supplierSku: { supplierId: m.supplierId, supplierSku: m.supplierSku } },
      create: m,
      update: {
        variantId:      m.variantId,
        bufferStock:    m.bufferStock,
        manualOverride: m.manualOverride,
        ignoreUpdates:  m.ignoreUpdates,
      },
    });
    results.push(row);
  }

  return NextResponse.json({ ok: true, created: results.length, rows: results });
}
