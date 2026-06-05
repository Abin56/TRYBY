import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, ReviewStatus } from "@prisma/client";
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
  const review = await prisma.review.findUnique({
    where:   { id },
    include: {
      user:      { select: { id: true, name: true, email: true, image: true } },
      product:   { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
      orderItem: { select: { id: true, orderId: true, order: { select: { orderNumber: true, createdAt: true } } } },
      votes:     { select: { isHelpful: true } },
    },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(review);
}

const actionSchema = z.object({
  action:    z.enum(["approve", "reject", "hide", "feature", "unfeature"]),
  adminNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = actionSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { action, adminNote } = body.data;
  const now = new Date();

  const review = await prisma.review.findUnique({ where: { id }, select: { productId: true } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let data: Record<string, unknown> = {};

  if (action === "approve") {
    data = { status: ReviewStatus.APPROVED, approvedAt: now, approvedBy: session.user.id };
  } else if (action === "reject") {
    data = { status: ReviewStatus.REJECTED, rejectedAt: now, rejectedBy: session.user.id };
  } else if (action === "hide") {
    data = { status: ReviewStatus.HIDDEN };
  } else if (action === "feature") {
    data = { isFeatured: true, status: ReviewStatus.APPROVED };
  } else if (action === "unfeature") {
    data = { isFeatured: false };
  }

  if (adminNote !== undefined) data.adminNote = adminNote;

  const updated = await prisma.review.update({ where: { id }, data });

  // Recompute product rating whenever approval state changes
  if (["approve", "reject", "hide"].includes(action)) {
    const stats = await prisma.review.aggregate({
      where:  { productId: review.productId, status: ReviewStatus.APPROVED },
      _avg:   { rating: true },
      _count: { id: true },
    });
    await prisma.product.update({
      where: { id: review.productId },
      data:  { avgRating: stats._avg.rating ?? 0, reviewCount: stats._count.id },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id }, select: { productId: true } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.review.delete({ where: { id } });

  // Recompute
  const stats = await prisma.review.aggregate({
    where:  { productId: review.productId, status: ReviewStatus.APPROVED },
    _avg:   { rating: true },
    _count: { id: true },
  });
  await prisma.product.update({
    where: { id: review.productId },
    data:  { avgRating: stats._avg.rating ?? 0, reviewCount: stats._count.id },
  });

  return NextResponse.json({ ok: true });
}
