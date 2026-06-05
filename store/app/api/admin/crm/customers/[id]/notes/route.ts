import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/crm";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { note, adminId } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: "note required" }, { status: 400 });

  const created = await prisma.customerNote.create({
    data: { userId: id, adminId: adminId ?? "admin", note },
  });

  await logActivity({
    userId: id,
    type: "NOTE_ADDED",
    metadata: { noteId: created.id, preview: note.slice(0, 80) },
    performedBy: adminId,
  });

  return NextResponse.json({ ok: true, note: created });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { noteId } = await req.json();
  await prisma.customerNote.deleteMany({ where: { id: noteId, userId: id } });
  return NextResponse.json({ ok: true });
}
