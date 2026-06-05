import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const body = await req.json();
  const {
    companyName, websiteUrl,
    bankAccountNo, bankIfsc, bankAccountName,
    // name update on user
    name,
  } = body;

  const [updatedSupplier] = await Promise.all([
    prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        ...(companyName    !== undefined && { companyName }),
        ...(websiteUrl     !== undefined && { websiteUrl }),
        ...(bankAccountNo  !== undefined && { bankAccountNo }),
        ...(bankIfsc       !== undefined && { bankIfsc }),
        ...(bankAccountName !== undefined && { bankAccountName }),
      },
    }),
    name !== undefined
      ? prisma.user.update({ where: { id: session.user.id }, data: { name } })
      : Promise.resolve(),
  ]);

  await prisma.supplierActivityLog.create({
    data: {
      supplierId: supplier.id,
      action:     "PROFILE_UPDATED",
      detail:     "Profile information updated",
    },
  });

  return NextResponse.json(updatedSupplier);
}
