/**
 * Supplier SKU Mapping — single record operations
 *
 * PUT    /api/admin/inventory/sku-mappings/[id]
 * DELETE /api/admin/inventory/sku-mappings/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AdminRole } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN && role !== AdminRole.SUPER_ADMIN;
}

const updateSchema = z.object({
  bufferStock:    z.number().int().min(0).optional(),
  manualOverride: z.boolean().optional(),
  ignoreUpdates:  z.boolean().optional(),
  supplierSku:    z.string().min(1).max(100).optional(),
  variantId:      z.string().cuid().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  try {
    const updated = await prisma.supplierSkuMap.update({
      where: { id },
      data:  body.data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.supplierSkuMap.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
  }
}
