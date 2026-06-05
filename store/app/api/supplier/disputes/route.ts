import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, DisputeStatus } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  settlementId: z.string(),
  reason:       z.string().min(5).max(200),
  description:  z.string().min(20).max(2000),
  attachments:  z.array(z.string().url()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const [disputes, total] = await Promise.all([
    prisma.settlementDispute.findMany({
      where:   { supplierId: supplier.id },
      include: { settlement: { select: { orderNumber: true, netAmount: true, grossAmount: true, status: true } } },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.settlementDispute.count({ where: { supplierId: supplier.id } }),
  ]);

  return NextResponse.json({ disputes, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  // Verify settlement belongs to supplier
  const settlement = await prisma.supplierSettlement.findFirst({
    where: { id: body.data.settlementId, supplierId: supplier.id },
  });
  if (!settlement) return NextResponse.json({ error: "Settlement not found" }, { status: 404 });

  // Check no open dispute already
  const existing = await prisma.settlementDispute.findFirst({
    where: { settlementId: body.data.settlementId, status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } },
  });
  if (existing) return NextResponse.json({ error: "A dispute for this settlement is already open" }, { status: 409 });

  const [dispute] = await prisma.$transaction([
    prisma.settlementDispute.create({
      data: {
        supplierId:   supplier.id,
        settlementId: body.data.settlementId,
        reason:       body.data.reason,
        description:  body.data.description,
        attachments:  body.data.attachments,
        status:       DisputeStatus.OPEN,
      },
    }),
    prisma.supplierSettlement.update({
      where: { id: body.data.settlementId },
      data:  { status: "DISPUTED" },
    }),
    prisma.supplierActivityLog.create({
      data: {
        supplierId: supplier.id,
        action:     "DISPUTE_RAISED",
        detail:     `Raised settlement dispute: ${body.data.reason}`,
        resourceId: body.data.settlementId,
      },
    }),
  ]);

  return NextResponse.json(dispute, { status: 201 });
}
