import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const replySchema = z.object({
  body:        z.string().min(1),
  attachments: z.array(z.string().url()).optional().default([]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ticket = await prisma.supplierTicket.findFirst({
    where:   { id, supplierId: supplier.id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ticket = await prisma.supplierTicket.findFirst({ where: { id, supplierId: supplier.id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.status === "CLOSED") return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });

  const body = replySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [reply] = await prisma.$transaction([
    prisma.supplierTicketReply.create({
      data: {
        ticketId:  id,
        authorId:  session.user.id,
        isAdmin:   false,
        body:      body.data.body,
        attachments: body.data.attachments,
      },
    }),
    prisma.supplierTicket.update({
      where: { id },
      data:  { status: "PENDING_REPLY" },
    }),
  ]);

  return NextResponse.json(reply, { status: 201 });
}
