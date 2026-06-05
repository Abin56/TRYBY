import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, TicketStatus, TicketPriority } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page") ?? "1");
  const limit    = 20;
  const status   = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as TicketPriority | null;
  const category = searchParams.get("category");
  const q        = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status)   where.status   = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { subject:                  { contains: q, mode: "insensitive" } },
      { ticketNumber:             { contains: q, mode: "insensitive" } },
      { supplier: { companyName:  { contains: q, mode: "insensitive" } } },
    ];
  }

  const [tickets, total, statusCounts] = await Promise.all([
    prisma.supplierTicket.findMany({
      where,
      include: {
        supplier: { select: { id: true, companyName: true, tier: true, user: { select: { name: true, email: true } } } },
        replies:  { orderBy: { createdAt: "desc" }, take: 1 },
        _count:   { select: { replies: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.supplierTicket.count({ where }),
    prisma.supplierTicket.groupBy({
      by:    ["status"],
      _count: { id: true },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map(s => [s.status, s._count.id]));

  return NextResponse.json({ tickets, total, pages: Math.ceil(total / limit), counts });
}
