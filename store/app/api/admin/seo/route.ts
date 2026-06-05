import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, Prisma } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const schema = z.object({
  key: z.string().min(1),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImageUrl: z.string().optional(),
  robotsContent: z.string().optional(),
  canonicalUrl: z.string().optional(),
  extraData: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.siteSettings.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { key, extraData, ...rest } = body.data;
  const data = {
    ...rest,
    ...(extraData !== undefined && { extraData: extraData as Prisma.InputJsonValue }),
  };

  const setting = await prisma.siteSettings.upsert({
    where:  { key },
    update: data,
    create: { key, ...data },
  });

  return NextResponse.json(setting);
}
