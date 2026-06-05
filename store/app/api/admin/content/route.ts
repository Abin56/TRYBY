import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, ContentBlockType, Prisma } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const schema = z.object({
  type:      z.nativeEnum(ContentBlockType),
  key:       z.string().min(1),
  title:     z.string().optional(),
  isActive:  z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  data:      z.record(z.string(), z.unknown()),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ContentBlockType | null;

  const blocks = await prisma.contentBlock.findMany({
    where:   type ? { type } : undefined,
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const existing = await prisma.contentBlock.findUnique({ where: { key: body.data.key } });
  if (existing) return NextResponse.json({ error: "Key already exists" }, { status: 409 });

  const { data: jsonData, ...rest } = body.data;
  const block = await prisma.contentBlock.create({
    data: { ...rest, data: jsonData as Prisma.InputJsonValue },
  });
  return NextResponse.json(block, { status: 201 });
}
