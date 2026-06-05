import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrmSegment } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

// GET: list all tags; POST: create tag
export async function GET() {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const tags = await prisma.customerTag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, color, description } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const tag = await prisma.customerTag.upsert({
    where: { name },
    create: { name, color: color ?? "#6B7280", description },
    update: { color: color ?? "#6B7280", description },
  });
  return NextResponse.json({ ok: true, tag });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await prisma.customerTag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
