import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const uploadSchema = z.object({
  type:  z.enum(["GST_CERTIFICATE", "PAN_CARD", "BANK_STATEMENT", "ADDRESS_PROOF", "IDENTITY_PROOF", "AGREEMENT", "OTHER"]),
  label: z.string().optional(),
  url:   z.string().url(),
  publicId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const documents = await prisma.supplierDocument.findMany({
    where:   { supplierId: supplier.id },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const body = uploadSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { type, label, url, publicId } = body.data;

  // If uploading agreement, mark on supplier
  const isAgreement = type === "AGREEMENT";

  const [doc] = await prisma.$transaction([
    prisma.supplierDocument.create({
      data: { supplierId: supplier.id, type, label, url, publicId },
    }),
    ...(isAgreement
      ? [prisma.supplier.update({
          where: { id: supplier.id },
          data: { agreementUrl: url, agreementSignedAt: new Date() },
        })]
      : []),
    prisma.supplierActivityLog.create({
      data: {
        supplierId: supplier.id,
        action:     "DOCUMENT_UPLOADED",
        detail:     `Uploaded ${type.replace(/_/g, " ").toLowerCase()}${label ? `: ${label}` : ""}`,
      },
    }),
  ]);

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doc = await prisma.supplierDocument.findFirst({ where: { id, supplierId: supplier.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.isVerified) return NextResponse.json({ error: "Cannot delete a verified document" }, { status: 403 });

  await prisma.supplierDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
