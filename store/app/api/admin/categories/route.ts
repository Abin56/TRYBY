import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, Sport } from "@prisma/client";

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN;
}

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  sport: z.nativeEnum(Sport).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().cuid().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { children: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = categorySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { slug: rawSlug, ...data } = body.data;
  const slug = rawSlug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const category = await prisma.category.create({ data: { ...data, slug } });
  return NextResponse.json(category, { status: 201 });
}
