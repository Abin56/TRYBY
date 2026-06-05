import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/\r?\n/g, " ");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(",")),
  ].join("\n");
}

const EXPORT_CONFIGS: Record<string, {
  label: string;
  permission: "customers:read" | "orders:read" | "products:read" | "suppliers:read" | "products:read";
  fetch: (limit: number) => Promise<Record<string, unknown>[]>;
}> = {
  users: {
    label: "Users",
    permission: "customers:read",
    fetch: async (limit) => {
      const rows = await prisma.user.findMany({
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
    },
  },
  orders: {
    label: "Orders",
    permission: "orders:read",
    fetch: async (limit) => {
      const rows = await prisma.order.findMany({
        select: {
          id: true, orderNumber: true, status: true, total: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
          payment: { select: { status: true, method: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map(r => ({
        id: r.id, orderNumber: r.orderNumber, status: r.status,
        total: Number(r.total),
        customerEmail: r.user?.email, customerName: r.user?.name,
        paymentStatus: r.payment?.status, paymentMethod: r.payment?.method,
        createdAt: r.createdAt.toISOString(),
      }));
    },
  },
  products: {
    label: "Products",
    permission: "products:read",
    fetch: async (limit) => {
      const rows = await prisma.product.findMany({
        select: {
          id: true, name: true, slug: true, sport: true, isActive: true, isFeatured: true,
          avgRating: true, reviewCount: true, totalSoldCount: true, createdAt: true,
          category: { select: { name: true } },
          variants: { select: { sku: true, price: true, mrp: true, stock: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map(r => ({
        id: r.id, name: r.name, slug: r.slug, sport: r.sport,
        isActive: r.isActive, isFeatured: r.isFeatured,
        category: r.category?.name,
        sku: r.variants[0]?.sku,
        price: r.variants[0] ? Number(r.variants[0].price) : null,
        stock: r.variants[0]?.stock,
        avgRating: r.avgRating, reviewCount: r.reviewCount, totalSold: r.totalSoldCount,
        createdAt: r.createdAt.toISOString(),
      }));
    },
  },
  suppliers: {
    label: "Suppliers",
    permission: "suppliers:read",
    fetch: async (limit) => {
      const rows = await prisma.supplier.findMany({
        select: {
          id: true, companyName: true, status: true, tier: true, slaScore: true, totalOrders: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map(r => ({ ...r, slaScore: Number(r.slaScore), createdAt: r.createdAt.toISOString() }));
    },
  },
  reviews: {
    label: "Reviews",
    permission: "products:read",
    fetch: async (limit) => {
      const rows = await prisma.review.findMany({
        select: {
          id: true, rating: true, title: true, status: true, isVerified: true, createdAt: true,
          product: { select: { name: true } },
          user:    { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map(r => ({
        id: r.id, rating: r.rating, title: r.title, status: r.status,
        isVerified: r.isVerified, productName: r.product?.name,
        customerEmail: r.user?.email, createdAt: r.createdAt.toISOString(),
      }));
    },
  },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { dataset = "orders", limit = 10000, format = "csv" } = await req.json().catch(() => ({}));

  const config = EXPORT_CONFIGS[dataset];
  if (!config) return NextResponse.json({ error: "Unknown dataset" }, { status: 400 });

  if (!canAccess(session, config.permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await config.fetch(Math.min(limit, 100_000));
  const csv  = toCsv(rows);

  const adminId = await getAdminProfileId(session.user.id);
  if (adminId) {
    logAudit({ adminId, action: "EXPORT_GENERATED", resourceType: "export",
      resourceName: dataset, newValue: { dataset, rows: rows.length, format }, req });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tryby-${dataset}-${new Date().toISOString().slice(0,10)}.csv"`,
      "X-Row-Count":         String(rows.length),
    },
  });
}

export async function GET() {
  const session = await auth();
  if (!canAccess(session, "settings:read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const summary = await Promise.all(
    Object.entries(EXPORT_CONFIGS).map(async ([key, cfg]) => ({
      key,
      label: cfg.label,
    }))
  );

  return NextResponse.json({ datasets: summary });
}
