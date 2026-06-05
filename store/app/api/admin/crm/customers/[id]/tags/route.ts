import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/crm";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const assignments = await prisma.customerTagAssignment.findMany({
    where: { customerId: params.id },
    include: { tag: true },
  });
  return NextResponse.json({ tags: assignments.map((a) => a.tag) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { tagId, adminId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

  await prisma.customerTagAssignment.upsert({
    where: { customerId_tagId: { customerId: params.id, tagId } },
    create: { customerId: params.id, tagId, assignedBy: adminId ?? "admin" },
    update: {},
  });

  const tag = await prisma.customerTag.findUnique({ where: { id: tagId } });
  await logActivity({ userId: params.id, type: "TAG_ADDED", metadata: { tagId, tagName: tag?.name }, performedBy: adminId });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { tagId, adminId } = await req.json();
  await prisma.customerTagAssignment.deleteMany({ where: { customerId: params.id, tagId } });
  await logActivity({ userId: params.id, type: "TAG_REMOVED", metadata: { tagId }, performedBy: adminId });
  return NextResponse.json({ ok: true });
}
