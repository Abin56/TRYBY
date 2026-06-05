import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/crm";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const assignments = await prisma.customerTagAssignment.findMany({
    where: { customerId: id },
    include: { tag: true },
  });
  return NextResponse.json({ tags: assignments.map((a) => a.tag) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { tagId, adminId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

  await prisma.customerTagAssignment.upsert({
    where: { customerId_tagId: { customerId: id, tagId } },
    create: { customerId: id, tagId, assignedBy: adminId ?? "admin" },
    update: {},
  });

  const tag = await prisma.customerTag.findUnique({ where: { id: tagId } });
  await logActivity({ userId: id, type: "TAG_ADDED", metadata: { tagId, tagName: tag?.name }, performedBy: adminId });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { tagId, adminId } = await req.json();
  await prisma.customerTagAssignment.deleteMany({ where: { customerId: id, tagId } });
  await logActivity({ userId: id, type: "TAG_REMOVED", metadata: { tagId }, performedBy: adminId });
  return NextResponse.json({ ok: true });
}
