// Customer-facing: return status timeline (no admin auth — only own returns)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReturnStatus } from "@prisma/client";

const TIMELINE_STEPS: { status: ReturnStatus; label: string; desc: string }[] = [
  { status: ReturnStatus.REQUESTED,        label: "Request Submitted",    desc: "Your return request has been received and is under review." },
  { status: ReturnStatus.APPROVED,         label: "Approved",             desc: "Your return has been approved. We will schedule a pickup." },
  { status: ReturnStatus.PICKUP_SCHEDULED, label: "Pickup Scheduled",     desc: "A pickup has been scheduled. Please keep the item ready." },
  { status: ReturnStatus.RECEIVED,         label: "Item Received",        desc: "We have received your returned item and are processing the refund." },
  { status: ReturnStatus.REFUNDED,         label: "Refund Processed",     desc: "Your refund has been processed and is on its way." },
];

const STATUS_ORDER: ReturnStatus[] = [
  ReturnStatus.REQUESTED,
  ReturnStatus.APPROVED,
  ReturnStatus.PICKUP_SCHEDULED,
  ReturnStatus.RECEIVED,
  ReturnStatus.REFUNDED,
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ret = await prisma.returnRequest.findUnique({
    where: { id },
    select: {
      id: true, returnNumber: true, status: true,
      reason: true, reasonNote: true, adminNote: true,
      refundAmount: true, refundMethod: true,
      refundedAt: true, requestedAt: true, resolvedAt: true,
      pickupDate: true, createdAt: true, updatedAt: true,
      userId: true,
      order: { select: { orderNumber: true } },
      items: {
        select: {
          productName: true, quantity: true, unitPrice: true,
          size: true, color: true, imageUrl: true,
        },
      },
    },
  });

  if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow the owner to view
  if (ret.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isRejected = ret.status === ReturnStatus.REJECTED;
  const currentIdx = isRejected ? -1 : STATUS_ORDER.indexOf(ret.status);

  const timeline = isRejected
    ? [
        {
          step:      1,
          status:    ReturnStatus.REQUESTED,
          label:     "Request Submitted",
          desc:      "Your return request was received.",
          completed: true,
          current:   false,
        },
        {
          step:      2,
          status:    ReturnStatus.REJECTED,
          label:     "Request Rejected",
          desc:      ret.adminNote
            ? `Unfortunately, your return was not approved. Reason: ${ret.adminNote}`
            : "Unfortunately, your return request could not be approved. Please contact support.",
          completed: true,
          current:   true,
          rejected:  true,
        },
      ]
    : TIMELINE_STEPS.map((step, idx) => ({
        step:      idx + 1,
        status:    step.status,
        label:     step.label,
        desc:      step.desc,
        completed: idx < currentIdx,
        current:   idx === currentIdx,
        pending:   idx > currentIdx,
        ...(step.status === ReturnStatus.PICKUP_SCHEDULED && ret.pickupDate
          ? { pickupDate: ret.pickupDate }
          : {}),
        ...(step.status === ReturnStatus.REFUNDED && ret.refundedAt
          ? { refundedAt: ret.refundedAt }
          : {}),
      }));

  return NextResponse.json({
    return: {
      id:           ret.id,
      returnNumber: ret.returnNumber,
      status:       ret.status,
      reason:       ret.reason,
      reasonNote:   ret.reasonNote,
      adminNote:    ret.status === ReturnStatus.REJECTED ? ret.adminNote : null, // only show on rejection
      refundAmount: Number(ret.refundAmount),
      refundMethod: ret.refundMethod,
      orderNumber:  ret.order.orderNumber,
      requestedAt:  ret.requestedAt,
      resolvedAt:   ret.resolvedAt,
      items:        ret.items,
    },
    timeline,
    isResolved: ret.status === ReturnStatus.REFUNDED || ret.status === ReturnStatus.REJECTED,
    isRejected,
  });
}
