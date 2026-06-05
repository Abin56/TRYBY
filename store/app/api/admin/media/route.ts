import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AssetType } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as AssetType | null;
  const folder = searchParams.get("folder");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 24;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (folder) where.folder = { contains: folder, mode: "insensitive" };

  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mediaAsset.count({ where }),
  ]);

  return NextResponse.json({ assets, total, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, focalPointX, focalPointY, altText } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(focalPointX !== undefined && { focalPointX }),
      ...(focalPointY !== undefined && { focalPointY }),
      ...(altText !== undefined && { altText }),
    },
  });

  return NextResponse.json(asset);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const { createHmac } = await import("crypto");
    const sig = createHmac("sha256", apiSecret)
      .update(`public_id=${asset.publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: asset.publicId, signature: sig, api_key: apiKey, timestamp }),
    });
  }

  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
