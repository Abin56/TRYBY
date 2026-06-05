import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, TicketStatus, Prisma } from "@prisma/client";
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
  const ticket = await prisma.supplierTicket.findUnique({
    where:   { id },
    include: {
      supplier: {
        include: { user: { select: { name: true, email: true } } },
      },
      replies: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ticket);
}

const replySchema = z.object({
  action:      z.enum(["reply", "resolve", "escalate", "close", "reopen"]),
  body:        z.string().optional(),
  attachments: z.array(z.string()).optional().default([]),
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
  const body = replySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { action, body: replyBody, attachments } = body.data;
  const now = new Date();

  const ticket = await prisma.supplierTicket.findUnique({
    where:   { id },
    include: { supplier: { include: { user: { select: { id: true } } } } },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const statusMap: Record<string, TicketStatus> = {
    reply:     "IN_PROGRESS",
    resolve:   "RESOLVED",
    escalate:  "ESCALATED",
    close:     "CLOSED",
    reopen:    "OPEN",
  };

  const newStatus = statusMap[action];

  const updates: Record<string, unknown> = { status: newStatus };
  if (action === "resolve")  { updates.resolvedAt = now; updates.resolvedBy = session.user.id; }
  if (action === "escalate") { updates.escalatedAt = now; updates.escalatedBy = session.user.id; }
  if (action === "close")    { updates.closedAt = now; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [
    prisma.supplierTicket.update({ where: { id }, data: updates }),
  ];

  // Add admin reply if body provided
  if (replyBody?.trim()) {
    ops.push(prisma.supplierTicketReply.create({
      data: {
        ticketId:   id,
        authorId:   session.user.id,
        isAdmin:    true,
        body:       replyBody,
        attachments: attachments ?? [],
      },
    }));
  }

  // Notify supplier
  const notifMessages: Record<string, { title: string; body: string }> = {
    reply:    { title: `Reply on ${ticket.ticketNumber}`, body: `Admin replied to your support ticket: ${ticket.subject}` },
    resolve:  { title: `Ticket Resolved — ${ticket.ticketNumber}`, body: `Your support ticket "${ticket.subject}" has been resolved.` },
    escalate: { title: `Ticket Escalated — ${ticket.ticketNumber}`, body: `Your ticket "${ticket.subject}" has been escalated for priority review.` },
    close:    { title: `Ticket Closed — ${ticket.ticketNumber}`, body: `Your support ticket "${ticket.subject}" has been closed.` },
  };

  const notif = notifMessages[action];
  if (notif) {
    ops.push(prisma.notification.create({
      data: {
        userId:     ticket.supplier.user.id,
        supplierId: ticket.supplierId,
        type:       `TICKET_${action.toUpperCase()}`,
        title:      notif.title,
        body:       notif.body,
        data:       { ticketId: id, ticketNumber: ticket.ticketNumber } as Prisma.InputJsonValue,
      },
    }));
  }

  const results = await prisma.$transaction(ops);
  return NextResponse.json(results[0]);
}
