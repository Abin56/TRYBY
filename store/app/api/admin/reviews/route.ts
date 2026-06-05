import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, ReviewStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page      = parseInt(searchParams.get("page") ?? "1");
  const limit     = 20;
  const status    = searchParams.get("status") as ReviewStatus | null;
  const rating    = searchParams.get("rating");
  const q         = searchParams.get("q") ?? "";
  const featured  = searchParams.get("featured");
  const verified  = searchParams.get("verified");

  const where: Record<string, unknown> = {};
  if (status)  where.status     = status;
  if (rating)  where.rating     = parseInt(rating);
  if (featured === "true") where.isFeatured = true;
  if (verified === "true") where.isVerified = true;
  if (q) {
    where.OR = [
      { title:            { contains: q, mode: "insensitive" } },
      { body:             { contains: q, mode: "insensitive" } },
      { user: { name:     { contains: q, mode: "insensitive" } } },
      { user: { email:    { contains: q, mode: "insensitive" } } },
      { product: { name:  { contains: q, mode: "insensitive" } } },
    ];
  }

  const [reviews, total, statusCounts] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user:    { select: { id: true, name: true, email: true, image: true } },
        product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }], // pending first
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const counts = Object.fromEntries(statusCounts.map(s => [s.status, s._count.id]));

  return NextResponse.json({ reviews, total, pages: Math.ceil(total / limit), counts });
}

// Bulk action
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ids, action } = await req.json() as {
    ids: string[];
    action: "approve" | "reject" | "hide" | "feature" | "unfeature";
  };

  if (!ids?.length || !action) return NextResponse.json({ error: "ids and action required" }, { status: 400 });

  const now = new Date();

  if (action === "approve") {
    await prisma.review.updateMany({
      where: { id: { in: ids } },
      data:  { status: ReviewStatus.APPROVED, approvedAt: now, approvedBy: session.user.id },
    });
    // Update product avgRating + reviewCount for affected products
    const affected = await prisma.review.findMany({ where: { id: { in: ids } }, select: { productId: true } });
    const productIds = [...new Set(affected.map(r => r.productId))];
    await updateProductRatings(productIds);
  } else if (action === "reject") {
    await prisma.review.updateMany({
      where: { id: { in: ids } },
      data:  { status: ReviewStatus.REJECTED, rejectedAt: now, rejectedBy: session.user.id },
    });
    const affected = await prisma.review.findMany({ where: { id: { in: ids } }, select: { productId: true } });
    await updateProductRatings([...new Set(affected.map(r => r.productId))]);
  } else if (action === "hide") {
    await prisma.review.updateMany({ where: { id: { in: ids } }, data: { status: ReviewStatus.HIDDEN } });
    const affected = await prisma.review.findMany({ where: { id: { in: ids } }, select: { productId: true } });
    await updateProductRatings([...new Set(affected.map(r => r.productId))]);
  } else if (action === "feature") {
    await prisma.review.updateMany({ where: { id: { in: ids } }, data: { isFeatured: true } });
  } else if (action === "unfeature") {
    await prisma.review.updateMany({ where: { id: { in: ids } }, data: { isFeatured: false } });
  }

  return NextResponse.json({ ok: true, updated: ids.length });
}

async function updateProductRatings(productIds: string[]) {
  for (const productId of productIds) {
    const stats = await prisma.review.aggregate({
      where:  { productId, status: ReviewStatus.APPROVED },
      _avg:   { rating: true },
      _count: { id: true },
    });
    await prisma.product.update({
      where: { id: productId },
      data:  {
        avgRating:   stats._avg.rating ?? 0,
        reviewCount: stats._count.id,
      },
    });
  }
}
