import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/crm";
import { CrmTicketStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const ticket = await prisma.customerTicket.findUnique({
    where: { id },
    include: {
      replies: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: ticket.userId },
    select: { id: true, name: true, email: true, phone: true },
  });
  const order = ticket.orderId
    ? await prisma.order.findUnique({ where: { id: ticket.orderId }, select: { id: true, orderNumber: true, total: true, status: true } })
    : null;

  return NextResponse.json({ ticket, user, order });
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await _req.json();
  const { action, message, adminId, assignedTo } = body;

  const ticket = await prisma.customerTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updatedTicket = ticket;

  if (action === "reply") {
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
    await prisma.customerTicketReply.create({
      data: { ticketId: id, authorId: adminId ?? "admin", isAdmin: true, message },
    });
    updatedTicket = await prisma.customerTicket.update({
      where: { id },
      data: { status: "PENDING", updatedAt: new Date() },
    });
  } else if (action === "resolve") {
    updatedTicket = await prisma.customerTicket.update({
      where: { id },
      data: { status: "RESOLVED" as CrmTicketStatus, resolvedAt: new Date() },
    });
    await logActivity({ userId: ticket.userId, type: "TICKET_RESOLVED", metadata: { ticketId: id }, performedBy: adminId });
  } else if (action === "close") {
    updatedTicket = await prisma.customerTicket.update({
      where: { id },
      data: { status: "CLOSED" as CrmTicketStatus, closedAt: new Date() },
    });
  } else if (action === "assign") {
    updatedTicket = await prisma.customerTicket.update({
      where: { id },
      data: { assignedTo, status: "IN_PROGRESS" as CrmTicketStatus },
    });
  } else if (action === "reopen") {
    updatedTicket = await prisma.customerTicket.update({
      where: { id },
      data: { status: "OPEN" as CrmTicketStatus, resolvedAt: null, closedAt: null },
    });
  }

  return NextResponse.json({ ok: true, ticket: updatedTicket });
}
