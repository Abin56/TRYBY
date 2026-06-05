import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, ReturnStatus, LedgerEntryType } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

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
  const ret = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      user:  { select: { id: true, name: true, email: true, phone: true, image: true } },
      order: {
        select: {
          id: true, orderNumber: true, total: true, createdAt: true,
          payment: { select: { id: true, method: true, status: true, razorpayPaymentId: true } },
          items: {
            select: {
              productId: true, productName: true, quantity: true,
              unitPrice: true, total: true, imageUrl: true, size: true, color: true, variantSku: true,
              variant: { select: { costPrice: true } },
              product:  { select: { supplierId: true, shippingCost: true, packagingCost: true } },
            },
          },
        },
      },
      items: {
        include: { product: { select: { name: true, slug: true, supplierId: true } } },
      },
    },
  });

  if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ret);
}

const updateSchema = z.object({
  status:      z.nativeEnum(ReturnStatus).optional(),
  adminNote:   z.string().optional(),
  pickupDate:  z.string().datetime().optional(),
  // When marking as REFUNDED, these control payment gateway behaviour
  processGatewayRefund: z.boolean().default(false),
  refundAmount:         z.number().positive().optional(),
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

  const { status, adminNote, pickupDate, processGatewayRefund, refundAmount } = body.data;

  const existing = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      user:  { select: { id: true, name: true, email: true } },
      order: {
        select: {
          orderNumber: true,
          items: {
            select: {
              productId: true, quantity: true,
              variant: { select: { costPrice: true } },
              product:  { select: { supplierId: true, shippingCost: true, packagingCost: true } },
            },
          },
          payment: { select: { id: true, razorpayPaymentId: true, status: true } },
        },
      },
    },
  });

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (adminNote !== undefined) updateData.adminNote = adminNote;
  if (pickupDate)              updateData.pickupDate = new Date(pickupDate);
  if (status)                  updateData.status = status;

  if (status === ReturnStatus.APPROVED) {
    // no extra fields
  } else if (status === ReturnStatus.PICKUP_SCHEDULED) {
    // pickupDate set above
  } else if (status === ReturnStatus.REFUNDED) {
    updateData.refundedAt  = new Date();
    updateData.resolvedAt  = new Date();
  } else if (status === ReturnStatus.REJECTED) {
    updateData.resolvedAt  = new Date();
  }

  // ── 1. Update the return request ─────────────────────────────────────────
  const ret = await prisma.returnRequest.update({
    where: { id },
    data:  updateData,
  });

  // ── 2. Customer notification ──────────────────────────────────────────────
  if (status) {
    const notifConfig: Record<string, { title: string; body: string }> = {
      APPROVED:  {
        title: "Return Approved",
        body:  `Your return request ${existing.returnNumber} has been approved. We will arrange pickup shortly.`,
      },
      PICKUP_SCHEDULED: {
        title: "Pickup Scheduled",
        body:  `Pickup for return ${existing.returnNumber} has been scheduled.${pickupDate ? ` Date: ${new Date(pickupDate).toLocaleDateString("en-IN")}` : ""}`,
      },
      RECEIVED: {
        title: "Return Received",
        body:  `We have received your returned items for ${existing.returnNumber}. Your refund is being processed.`,
      },
      REFUNDED: {
        title: "Refund Processed ✓",
        body:  `Your refund of ₹${Number(existing.refundAmount).toLocaleString("en-IN")} for return ${existing.returnNumber} has been processed.`,
      },
      REJECTED: {
        title: "Return Request Rejected",
        body:  `Your return request ${existing.returnNumber} could not be approved.${adminNote ? ` Reason: ${adminNote}` : " Contact support for details."}`,
      },
    };

    const notif = notifConfig[status];
    if (notif) {
      prisma.notification.create({
        data: {
          userId:  existing.userId,
          type:    `RETURN_${status}`,
          title:   notif.title,
          body:    notif.body,
          data:    { returnId: id, returnNumber: existing.returnNumber },
        },
      }).catch(() => {});
    }
  }

  // ── 3. Gateway refund ─────────────────────────────────────────────────────
  let gatewayRefundResult: Record<string, unknown> | null = null;
  if (status === ReturnStatus.REFUNDED && processGatewayRefund) {
    const payment = existing.order.payment;
    if (payment?.razorpayPaymentId && (payment.status === "CAPTURED" || payment.status === "PARTIALLY_REFUNDED")) {
      const baseUrl = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";
      try {
        const refundRes = await fetch(`${baseUrl}/api/admin/payments/${payment.id}/refund`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "Cookie": req.headers.get("cookie") ?? "" },
          body:    JSON.stringify({ amount: refundAmount ?? Number(existing.refundAmount) }),
        });
        if (refundRes.ok) gatewayRefundResult = await refundRes.json();
      } catch { /* non-blocking — manual refund still proceeds */ }
    }
  }

  // ── 4. Supplier ledger deduction on REFUNDED ──────────────────────────────
  if (status === ReturnStatus.REFUNDED) {
    const refundAmt = Number(existing.refundAmount);

    // Group order items by supplier
    const supplierDeductions = new Map<string, number>();
    for (const item of existing.order.items) {
      const sid = item.product.supplierId;
      if (!sid) continue;
      const itemRevenue  = Number(item.variant?.costPrice ?? 0) * item.quantity;
      const contribution = itemRevenue > 0 ? itemRevenue : (refundAmt / existing.order.items.length);
      supplierDeductions.set(sid, (supplierDeductions.get(sid) ?? 0) + contribution);
    }

    // Write a RETURN_DEDUCTION ledger entry per supplier and update supplier metrics
    for (const [supplierId, deductionAmount] of supplierDeductions) {
      try {
        await prisma.$transaction([
          prisma.supplierLedger.create({
            data: {
              supplierId,
              type:            LedgerEntryType.RETURN_DEDUCTION,
              amount:          -Math.abs(deductionAmount),
              grossAmount:     0,
              commissionAmt:   0,
              gstOnCommission: 0,
              shippingDeduct:  0,
              netAmount:       -Math.abs(deductionAmount),
              returnRequestId: id,
              orderNumber:     existing.order.orderNumber,
              description:     `Return deduction for ${existing.returnNumber} — ${existing.reason}`,
              balanceAfter:    0, // recalculated by settlement engine
            },
          }),
          prisma.supplier.update({
            where: { id: supplierId },
            data:  { returnRate: { increment: 0.001 } }, // nudge return rate metric
          }),
        ]);
      } catch { /* non-blocking — supplier may not have active settlement */ }
    }

    // Also fire the existing internal finance endpoint
    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";
    fetch(`${baseUrl}/api/internal/finance/return-deduction`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "" },
      body:    JSON.stringify({ returnRequestId: id }),
    }).catch(() => {});
  }

  // ── 5. Audit log ──────────────────────────────────────────────────────────
  const adminProfileId = await getAdminProfileId(session.user.id);
  if (adminProfileId && status) {
    const actionMap: Partial<Record<ReturnStatus, "RETURN_APPROVED" | "RETURN_REJECTED" | "RETURN_REFUNDED">> = {
      [ReturnStatus.APPROVED]: "RETURN_APPROVED",
      [ReturnStatus.REJECTED]: "RETURN_REJECTED",
      [ReturnStatus.REFUNDED]: "RETURN_REFUNDED",
    };
    const auditAction = actionMap[status];
    if (auditAction) {
      logAudit({
        adminId:      adminProfileId,
        action:       auditAction,
        resourceType: "return",
        resourceId:   id,
        resourceName: existing.returnNumber,
        oldValue:     { status: existing.status },
        newValue:     { status, adminNote, processGatewayRefund },
        req,
      });
    }
  }

  return NextResponse.json({ ...ret, gatewayRefund: gatewayRefundResult });
}
