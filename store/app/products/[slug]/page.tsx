import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PDPClient } from "@/components/pdp/pdp-client";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300; // 5-min ISR

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images:   { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { price: "asc" } },
      badges:   true,
      category: true,
    },
  });
}

async function getRelated(product: { id: string; sport: string; categoryId: string | null }) {
  return prisma.product.findMany({
    where: {
      isActive:   true,
      id:         { not: product.id },
      OR: [
        { sport:      product.sport },
        { categoryId: product.categoryId ?? undefined },
      ],
    },
    take: 4,
    orderBy: { totalSoldCount: "desc" },
    select: {
      id: true, name: true, slug: true, sport: true,
      teamName: true, leagueName: true, avgRating: true, reviewCount: true,
      images:   { where: { isPrimary: true }, take: 1 },
      variants: { where: { isActive: true }, select: { price: true, mrp: true }, take: 1, orderBy: { price: "asc" } },
      badges:   { select: { label: true } },
    },
  });
}

export default async function PDPPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelated({ id: product.id, sport: product.sport, categoryId: product.categoryId });

  return <PDPClient product={product} related={related} />;
}
