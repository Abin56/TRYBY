import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { AdminRole } from "@prisma/client";
import { canAccess } from "@/lib/rbac";
import { logAudit, getAdminProfileId } from "@/lib/audit";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  name:         z.string().min(1).optional(),
  adminRole:    z.nativeEnum(AdminRole).optional(),
  permissions:  z.array(z.string()).optional(),
  isDisabled:   z.boolean().optional(),
  newPassword:  z.string().min(8).optional(),
  mustResetPwd: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!canAccess(session, "team:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      adminProfile: true,
    },
  });

  if (!user?.adminProfile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch recent audit logs for this user
  const recentActivity = await prisma.auditLog.findMany({
    where:   { adminId: user.adminProfile.id },
    orderBy: { createdAt: "desc" },
    take:    20,
  });

  return NextResponse.json({
    id:          user.id,
    name:        user.name,
    email:       user.email,
    image:       user.image,
    isActive:    user.isActive,
    adminProfile: user.adminProfile,
    recentActivity,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!canAccess(session, "team:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { name, adminRole, permissions, isDisabled, newPassword, mustResetPwd } = body.data;

  // Prevent downgrading own account
  if (id === session!.user.id && isDisabled === true) {
    return NextResponse.json({ error: "Cannot disable your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { adminProfile: { select: { id: true, adminRole: true } } },
  });
  if (!user?.adminProfile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent editing another SUPER_ADMIN (unless you're also SUPER_ADMIN)
  if (
    user.adminProfile.adminRole === AdminRole.SUPER_ADMIN &&
    session!.user.adminRole !== AdminRole.SUPER_ADMIN
  ) {
    return NextResponse.json({ error: "Cannot edit a Super Admin" }, { status: 403 });
  }

  const profileUpdate: Record<string, unknown> = {};
  if (adminRole)    profileUpdate.adminRole    = adminRole;
  if (permissions)  profileUpdate.permissions  = permissions;
  if (mustResetPwd !== undefined) profileUpdate.mustResetPwd = mustResetPwd;

  if (isDisabled !== undefined) {
    profileUpdate.isDisabled = isDisabled;
    profileUpdate.disabledAt = isDisabled ? new Date() : null;
    profileUpdate.disabledBy = isDisabled ? session!.user.id : null;
  }

  if (newPassword) {
    profileUpdate.passwordHash = await bcrypt.hash(newPassword, 12);
    profileUpdate.mustResetPwd = true;
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data:  { ...(name && { name }) },
    }),
    prisma.adminProfile.update({
      where: { userId: id },
      data:  profileUpdate,
    }),
  ]);

  // Audit
  const actorAdminId = await getAdminProfileId(session!.user.id);
  if (actorAdminId) {
    const action = isDisabled === true  ? "ADMIN_DISABLED"
                 : isDisabled === false ? "ADMIN_ENABLED"
                 : "ADMIN_UPDATED";
    await logAudit({
      adminId:      actorAdminId,
      action,
      resourceType: "admin",
      resourceId:   id,
      resourceName: user.name ?? user.email ?? id,
      newValue:     { adminRole, permissions, isDisabled, mustResetPwd: !!newPassword },
      req,
    });
  }

  return NextResponse.json({ id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!canAccess(session, "team:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session!.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { adminProfile: { select: { adminRole: true } } },
  });

  if (!user?.adminProfile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.adminProfile.adminRole === AdminRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Cannot delete a Super Admin" }, { status: 403 });
  }

  // Soft-delete: disable rather than destroy (preserves audit trail)
  await prisma.adminProfile.update({
    where: { userId: id },
    data:  { isDisabled: true, disabledAt: new Date(), disabledBy: session!.user.id },
  });
  await prisma.user.update({ where: { id }, data: { isActive: false } });

  const actorAdminId = await getAdminProfileId(session!.user.id);
  if (actorAdminId) {
    await logAudit({
      adminId:      actorAdminId,
      action:       "ADMIN_DISABLED",
      resourceType: "admin",
      resourceId:   id,
      resourceName: user.name ?? user.email ?? id,
      req,
    });
  }

  return NextResponse.json({ disabled: true });
}
