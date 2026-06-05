import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/crm";
import { CrmTicketStatus, CrmTicketPriority, CrmTicketCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const skip = (page - 1) * limit;
  const status = searchParams.get("status") as CrmTicketStatus | null;
  const priority = searchParams.get("priority") as CrmTicketPriority | null;
  const category = searchParams.get("category") as CrmTicketCategory | null;
  const assignedTo = searchParams.get("assignedTo") ?? "";
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (assignedTo) where.assignedTo = assignedTo;
  if (search) where.subject = { contains: search, mode: "insensitive" };

  const [data, total, byStatus] = await Promise.all([
    prisma.customerTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: { replies: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.customerTicket.count({ where }),
    prisma.customerTicket.groupBy({ by: ["status"], _count: true }),
  ]);

  // Enrich with user info
  const userIds = [...new Set(data.map((t) => t.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const enriched = data.map((t) => ({ ...t, user: userMap[t.userId] ?? null }));

  return NextResponse.json({ data: enriched, total, page, pages: Math.ceil(total / limit), byStatus });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { userId, subject, description, category, priority, orderId, createdBy } = body;
  if (!userId || !subject || !description) {
    return NextResponse.json({ error: "userId, subject, description required" }, { status: 400 });
  }

  const ticket = await prisma.customerTicket.create({
    data: {
      userId,
      subject,
      description,
      category: category as CrmTicketCategory ?? "OTHER",
      priority: priority as CrmTicketPriority ?? "MEDIUM",
      orderId,
    },
  });

  await logActivity({
    userId,
    type: "TICKET_OPENED",
    metadata: { ticketId: ticket.id, subject },
    performedBy: createdBy,
  });

  return NextResponse.json({ ok: true, ticket });
}
