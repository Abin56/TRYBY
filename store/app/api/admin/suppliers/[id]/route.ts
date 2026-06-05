import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SupplierStatus } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [supplier, products, payouts, revenueStats] = await Promise.all([
    prisma.supplier.findUnique({
      where:   { id },
      include: {
        user:      { select: { name: true, email: true, phone: true } },
        documents: { orderBy: { uploadedAt: "desc" } },
        activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    prisma.product.findMany({
      where:   { supplierId: id },
      select:  { id: true, name: true, slug: true, isActive: true, totalSoldCount: true, avgRating: true, createdAt: true, images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take:    30,
    }),
    prisma.payout.findMany({
      where:   { supplierId: id },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
    prisma.orderItem.aggregate({
      _sum: { total: true, quantity: true },
      where: {
        product: { supplierId: id },
        order:   { status: { in: ["DELIVERED", "CONFIRMED", "PROCESSING", "SHIPPED"] } },
      },
    }),
  ]);

  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    supplier,
    products,
    payouts,
    stats: {
      totalRevenue:   Number(revenueStats._sum.total   ?? 0),
      totalUnitsSold: Number(revenueStats._sum.quantity ?? 0),
      totalProducts:  products.length,
      activeProducts: products.filter(p => p.isActive).length,
    },
  });
}

const updateSchema = z.object({
  status:        z.nativeEnum(SupplierStatus).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  suspendReason:  z.string().optional(),
  docsVerified:   z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { status, commissionRate, suspendReason, docsVerified } = body.data;
  const now = new Date();

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(status        && { status }),
      ...(commissionRate !== undefined && { commissionRate }),
      ...(suspendReason  && { suspendReason }),
      ...(status === SupplierStatus.APPROVED && { onboardedAt: now }),
      ...(docsVerified !== undefined && {
        docsVerified,
        docsVerifiedAt: docsVerified ? now : null,
        docsVerifiedBy: docsVerified ? session.user.id : null,
      }),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  // Notify supplier of status changes
  if (status) {
    const notifMap: Record<string, { title: string; body: string }> = {
      APPROVED:  { title: "Supplier Account Approved", body: "Congratulations! Your TRYBY supplier account has been approved. You can now list products and start selling." },
      SUSPENDED: { title: "Supplier Account Suspended", body: `Your TRYBY supplier account has been suspended.${suspendReason ? ` Reason: ${suspendReason}` : " Contact support for more information."}` },
    };
    const notif = notifMap[status];
    if (notif) {
      await prisma.notification.create({
        data: {
          userId:     supplier.user.id,
          supplierId: id,
          type:       `ACCOUNT_${status}`,
          title:      notif.title,
          body:       notif.body,
        },
      });
    }
  }

  return NextResponse.json(supplier);
}

// PATCH — verify or reject a single document
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { docId, action, rejectReason } = await req.json() as {
    docId: string;
    action: "verify" | "reject";
    rejectReason?: string;
  };

  if (!docId || !action) return NextResponse.json({ error: "docId and action required" }, { status: 400 });

  const doc = await prisma.supplierDocument.findFirst({ where: { id: docId, supplierId: id } });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const updated = await prisma.supplierDocument.update({
    where: { id: docId },
    data: {
      isVerified:   action === "verify",
      verifiedAt:   action === "verify" ? new Date() : null,
      verifiedBy:   action === "verify" ? session.user.id : null,
      rejectReason: action === "reject" ? (rejectReason ?? "Document rejected") : null,
    },
  });

  // Check if all required docs are verified → auto-set docsVerified
  const allDocs = await prisma.supplierDocument.findMany({ where: { supplierId: id } });
  const allVerified = allDocs.length > 0 && allDocs.every(d => d.isVerified);
  if (allVerified) {
    await prisma.supplier.update({
      where: { id },
      data:  { docsVerified: true, docsVerifiedAt: new Date(), docsVerifiedBy: session.user.id },
    });
  }

  return NextResponse.json(updated);
}
