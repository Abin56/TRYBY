import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AssetType } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(body.type      !== undefined && { type: body.type as AssetType }),
      ...(body.altText   !== undefined && { altText: body.altText }),
      ...(body.focalPointX !== undefined && { focalPointX: body.focalPointX }),
      ...(body.focalPointY !== undefined && { focalPointY: body.focalPointY }),
    },
  });
  return NextResponse.json(asset);
}
