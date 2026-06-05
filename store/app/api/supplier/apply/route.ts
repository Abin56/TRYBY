import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  companyName:     z.string().min(2).max(100),
  gstin:           z.string().optional(),
  panNumber:       z.string().optional(),
  bankAccountNo:   z.string().optional(),
  bankIfsc:        z.string().optional(),
  bankAccountName: z.string().optional(),
  websiteUrl:      z.string().url().optional().or(z.literal("")),
  businessAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admins must not be able to self-promote to SUPPLIER via this endpoint
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const existing = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (existing) return NextResponse.json({ error: "Application already submitted" }, { status: 409 });

  const { websiteUrl, ...rest } = body.data;

  const supplier = await prisma.supplier.create({
    data: {
      ...rest,
      ...(websiteUrl ? { websiteUrl } : {}),
      userId: session.user.id,
      status: "PENDING",
    },
  });

  // Update user role to SUPPLIER
  await prisma.user.update({
    where: { id: session.user.id },
    data:  { role: "SUPPLIER" },
  });

  return NextResponse.json(supplier, { status: 201 });
}
