import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const agreements = await prisma.supplierAgreement.findMany({
    where:   { supplierId: supplier.id },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ agreements });
}

// POST — supplier accepts the current agreement version
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { agreementId } = await req.json() as { agreementId: string };
  if (!agreementId) return NextResponse.json({ error: "agreementId required" }, { status: 400 });

  const agreement = await prisma.supplierAgreement.findFirst({
    where: { id: agreementId, supplierId: supplier.id },
  });
  if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (agreement.acceptedAt) return NextResponse.json({ error: "Already accepted" }, { status: 409 });

  const req2 = req as Request & { headers: Headers };
  const ip = req2.headers.get("x-forwarded-for") ?? req2.headers.get("x-real-ip") ?? null;

  const [updated] = await prisma.$transaction([
    prisma.supplierAgreement.update({
      where: { id: agreementId },
      data:  { acceptedAt: new Date(), acceptedByIp: ip },
    }),
    prisma.supplier.update({
      where: { id: supplier.id },
      data:  { agreementSignedAt: new Date() },
    }),
    prisma.supplierActivityLog.create({
      data: {
        supplierId: supplier.id,
        action:     "AGREEMENT_ACCEPTED",
        detail:     `Accepted agreement version ${agreement.version}: ${agreement.title}`,
        resourceId: agreementId,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
