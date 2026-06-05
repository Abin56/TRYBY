import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PayoutStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;
  const status = searchParams.get("status") as PayoutStatus | null;
  const q      = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.supplier = {
      OR: [
        { companyName: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const [payouts, total, stats] = await Promise.all([
    prisma.payout.findMany({
      where,
      include: {
        supplier: {
          include: {
            user: { select: { name: true, email: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payout.count({ where }),
    prisma.payout.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  const statusSummary = Object.fromEntries(
    stats.map(s => [s.status, { count: s._count.id, amount: Number(s._sum.amount ?? 0) }])
  );

  return NextResponse.json({ payouts, total, pages: Math.ceil(total / limit), statusSummary });
}
