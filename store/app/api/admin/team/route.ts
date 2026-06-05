import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, AdminRole } from "@prisma/client";
import { canAccess } from "@/lib/rbac";
import { logAudit, getAdminProfileId } from "@/lib/audit";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  name:        z.string().min(1),
  email:       z.string().email(),
  adminRole:   z.nativeEnum(AdminRole),
  permissions: z.array(z.string()).default([]),
  password:    z.string().min(8),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "team:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q") ?? "";
  const role = searchParams.get("role") as AdminRole | null;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = { role: UserRole.ADMIN };
  if (q) {
    where.OR = [
      { name:  { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      adminProfile: {
        select: {
          id: true, adminRole: true, permissions: true,
          isDisabled: true, lastLoginAt: true, mustResetPwd: true,
          invitedBy: true, createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const filtered = role
    ? users.filter((u) => u.adminProfile?.adminRole === role)
    : users;

  const total = await prisma.user.count({ where });

  return NextResponse.json({
    members: filtered.map((u) => ({
      id:          u.id,
      name:        u.name,
      email:       u.email,
      image:       u.image,
      isActive:    u.isActive,
      adminProfile: u.adminProfile,
      createdAt:   u.createdAt,
    })),
    total,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "team:write")) {
    return NextResponse.json({ error: "Forbidden — only Super Admin can create admin users" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { name, email, adminRole, permissions, password } = body.data;

  // Check duplicate
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: UserRole.ADMIN,
      isActive: true,
      adminProfile: {
        create: {
          adminRole,
          permissions,
          passwordHash,
          mustResetPwd: true,
          invitedBy:    session!.user.id,
          isDisabled:   false,
        },
      },
    },
    include: { adminProfile: true },
  });

  // Audit
  const inviterAdminId = await getAdminProfileId(session!.user.id);
  if (inviterAdminId) {
    await logAudit({
      adminId:      inviterAdminId,
      action:       "ADMIN_CREATED",
      resourceType: "admin",
      resourceId:   user.id,
      resourceName: `${name} <${email}>`,
      newValue:     { adminRole, permissions },
      req,
    });
  }

  return NextResponse.json({
    id:    user.id,
    name:  user.name,
    email: user.email,
    adminProfile: user.adminProfile,
  }, { status: 201 });
}
