import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

// Returns the current admin's session data — used by the admin app topbar.
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.adminProfile.findUnique({
    where: { userId: session.user.id },
    select: { adminRole: true, permissions: true, isDisabled: true, lastLoginAt: true },
  });

  return NextResponse.json({
    id:          session.user.id,
    name:        session.user.name,
    email:       session.user.email,
    image:       session.user.image,
    role:        session.user.role,
    adminRole:   profile?.adminRole ?? session.user.adminRole,
    permissions: profile?.permissions ?? session.user.permissions ?? [],
  });
}
