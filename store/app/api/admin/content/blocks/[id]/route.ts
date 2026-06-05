import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, Prisma } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const updateSchema = z.object({
  title:     z.string().optional(),
  isActive:  z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  data:      z.record(z.string(), z.unknown()).optional(),
  status:    z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const block = await prisma.contentBlock.findUnique({ where: { id } });
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(block);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { status, data: jsonData, ...rest } = body.data;
  const block = await prisma.contentBlock.update({
    where: { id },
    data: {
      ...rest,
      ...(jsonData !== undefined && { data: jsonData as Prisma.InputJsonValue }),
      ...(status && { status }),
      ...(status === "PUBLISHED" && { publishedAt: new Date() }),
    },
  });
  return NextResponse.json(block);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.contentBlock.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
