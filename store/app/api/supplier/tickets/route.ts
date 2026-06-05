import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, TicketCategory, TicketPriority } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  category:    z.nativeEnum(TicketCategory),
  priority:    z.nativeEnum(TicketPriority).optional().default("MEDIUM"),
  subject:     z.string().min(5).max(200),
  body:        z.string().min(10),
  attachments: z.array(z.string().url()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { supplierId: supplier.id };
  if (status) where.status = status;

  const [tickets, total] = await Promise.all([
    prisma.supplierTicket.findMany({
      where,
      include: { replies: { orderBy: { createdAt: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.supplierTicket.count({ where }),
  ]);

  return NextResponse.json({ tickets, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  if (supplier.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved suppliers can raise tickets" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  // Generate ticket number
  const count = await prisma.supplierTicket.count();
  const ticketNumber = `TKT-${String(count + 1).padStart(6, "0")}`;

  const ticket = await prisma.supplierTicket.create({
    data: {
      supplierId:   supplier.id,
      ticketNumber,
      ...body.data,
    },
  });

  await prisma.supplierActivityLog.create({
    data: {
      supplierId: supplier.id,
      action:     "TICKET_CREATED",
      detail:     `Raised support ticket: ${body.data.subject}`,
      resourceId: ticket.id,
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
