import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole, PublishStatus, Prisma } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const updateSchema = z.object({
  title:        z.string().optional(),
  isActive:     z.boolean().optional(),
  sortOrder:    z.number().int().optional(),
  status:       z.nativeEnum(PublishStatus).optional(),
  scheduledFor: z.string().datetime().optional(),
  data:         z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key } = await params;
  const block = await prisma.contentBlock.findUnique({ where: { key } });
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(block);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { data: jsonData, ...rest } = body.data;

  const updateData: Prisma.ContentBlockUpdateInput = {
    ...rest,
    ...(jsonData !== undefined && { data: jsonData as Prisma.InputJsonValue }),
  };

  // Set publishedAt when first published
  if (body.data.status === "PUBLISHED") {
    const existing = await prisma.contentBlock.findUnique({ where: { key }, select: { publishedAt: true } });
    if (!existing?.publishedAt) updateData.publishedAt = new Date();
  }

  const block = await prisma.contentBlock.upsert({
    where:  { key },
    update: updateData,
    create: {
      key,
      type:   "STATIC_PAGE",
      data:   (jsonData ?? {}) as Prisma.InputJsonValue,
      ...rest,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath(`/admin/content`, "page");

  const adminProfileId = await getAdminProfileId(session.user.id);
  if (adminProfileId) {
    logAudit({
      adminId:      adminProfileId,
      action:       body.data.status === "PUBLISHED" ? "CONTENT_PUBLISHED" : "CONTENT_UPDATED",
      resourceType: "content",
      resourceId:   key,
      resourceName: block.title ?? key,
      newValue:     { status: body.data.status, key },
      req,
    });
  }

  return NextResponse.json(block);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key } = await params;
  await prisma.contentBlock.delete({ where: { key } });
  revalidatePath("/", "layout");
  revalidatePath(`/admin/content`, "page");
  return NextResponse.json({ deleted: true });
}
