import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { isHelpful } = await req.json() as { isHelpful: boolean };

  const review = await prisma.review.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
  if (!review || review.status !== "APPROVED") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId === session.user.id) return NextResponse.json({ error: "Cannot vote on your own review" }, { status: 403 });

  // Upsert vote
  const existing = await prisma.reviewHelpfulVote.findUnique({
    where: { reviewId_userId: { reviewId: id, userId: session.user.id } },
  });

  if (existing) {
    if (existing.isHelpful === isHelpful) {
      // Withdraw the same vote
      await prisma.reviewHelpfulVote.delete({ where: { id: existing.id } });
      await recount(id);
      return NextResponse.json({ voted: false });
    }
    // Change vote
    await prisma.reviewHelpfulVote.update({ where: { id: existing.id }, data: { isHelpful } });
  } else {
    await prisma.reviewHelpfulVote.create({ data: { reviewId: id, userId: session.user.id, isHelpful } });
  }

  await recount(id);
  return NextResponse.json({ voted: true, isHelpful });
}

async function recount(reviewId: string) {
  const [helpful, notHelpful] = await Promise.all([
    prisma.reviewHelpfulVote.count({ where: { reviewId, isHelpful: true } }),
    prisma.reviewHelpfulVote.count({ where: { reviewId, isHelpful: false } }),
  ]);
  await prisma.review.update({
    where: { id: reviewId },
    data:  { helpfulCount: helpful, notHelpfulCount: notHelpful },
  });
}
