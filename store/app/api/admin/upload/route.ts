import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AssetType } from "@prisma/client";
import { uploadFromRequest, isConfigured, FOLDERS } from "@/lib/cloudinary";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// Context → Cloudinary folder + AssetType mapping
const CONTEXT_MAP: Record<string, { folder: string; type: AssetType }> = {
  product:          { folder: FOLDERS.products,    type: AssetType.PRODUCT_IMAGE },
  category:         { folder: FOLDERS.categories,  type: AssetType.CATEGORY_IMAGE },
  banner:           { folder: FOLDERS.banners,      type: AssetType.BANNER_IMAGE },
  homepage:         { folder: FOLDERS.homepage,     type: AssetType.HERO_IMAGE },
  brand:            { folder: "tryby/brand",         type: AssetType.BRAND_LOGO },
  media:            { folder: FOLDERS.media,         type: AssetType.MISC },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary not configured. Add CLOUDINARY_* env vars to .env.local." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file      = formData.get("file")      as File | null;
  const context   = (formData.get("context")  as string) ?? "media";
  const productId = formData.get("productId") as string | null;
  const supplierId = formData.get("supplierId") as string | null;
  const orderId   = formData.get("orderId")   as string | null;
  const rawAssetType = formData.get("assetType") as AssetType | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Resolve folder & type from context
  let folder: string;
  let assetType: AssetType;

  if (context === "product" && productId) {
    folder    = FOLDERS.productImages(productId);
    assetType = AssetType.PRODUCT_IMAGE;
  } else if (context === "supplier_doc" && supplierId) {
    folder    = FOLDERS.supplierDocs(supplierId);
    assetType = AssetType.MISC;
  } else if (context === "review" && orderId) {
    folder    = FOLDERS.reviewImages(orderId);
    assetType = AssetType.MISC;
  } else {
    const mapped = CONTEXT_MAP[context] ?? CONTEXT_MAP.media;
    folder    = (formData.get("folder") as string) ?? mapped.folder;
    assetType = rawAssetType ?? mapped.type;
  }

  try {
    const result = await uploadFromRequest(file, {
      folder,
      quality:    "auto",
      fetchFormat: "auto",
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        type:         assetType,
        url:          result.secureUrl,
        publicId:     result.publicId,
        filename:     file.name,
        width:        result.width,
        height:       result.height,
        format:       result.format,
        bytes:        result.bytes,
        folder,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json({
      id:       asset.id,
      url:      asset.url,
      publicId: asset.publicId,
      width:    asset.width,
      height:   asset.height,
      format:   asset.format,
      folder:   asset.folder,
    }, { status: 201 });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
