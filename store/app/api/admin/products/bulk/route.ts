import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const bulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate"),     productIds: z.array(z.string()).min(1) }),
  z.object({ action: z.literal("deactivate"),   productIds: z.array(z.string()).min(1) }),
  z.object({ action: z.literal("archive"),      productIds: z.array(z.string()).min(1) }),
  z.object({ action: z.literal("restore"),      productIds: z.array(z.string()).min(1) }),
  z.object({ action: z.literal("set_category"), productIds: z.array(z.string()).min(1), categoryId: z.string() }),
  z.object({ action: z.literal("set_homepage"), productIds: z.array(z.string()).min(1), showOnHomepage: z.boolean() }),
  z.object({ action: z.literal("price_adjust"), productIds: z.array(z.string()).min(1), mode: z.enum(["percent_increase", "percent_decrease", "fixed_set"]), value: z.number() }),
  z.object({ action: z.literal("stock_set"),    productIds: z.array(z.string()).min(1), stock: z.number().int().min(0), note: z.string().optional() }),
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = bulkSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const data    = body.data;
  const adminId = await getAdminProfileId(session.user.id);
  let affected  = 0;

  if (data.action === "activate" || data.action === "deactivate") {
    const isActive = data.action === "activate";
    const result = await prisma.product.updateMany({ where: { id: { in: data.productIds } }, data: { isActive } });
    affected = result.count;
    if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product",
      newValue: { isActive, productIds: data.productIds }, req });
  }

  else if (data.action === "archive") {
    // isArchived field not in schema — use isActive: false as equivalent
    const result = await prisma.product.updateMany({ where: { id: { in: data.productIds }, isActive: true }, data: { isActive: false } });
    affected = result.count;
    if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product",
      newValue: { isActive: false, productIds: data.productIds }, req });
  }

  else if (data.action === "restore") {
    const result = await prisma.product.updateMany({ where: { id: { in: data.productIds }, isActive: false }, data: { isActive: true } });
    affected = result.count;
    if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product",
      newValue: { isActive: true, productIds: data.productIds }, req });
  }

  else if (data.action === "set_category") {
    const result = await prisma.product.updateMany({ where: { id: { in: data.productIds } }, data: { categoryId: data.categoryId } });
    affected = result.count;
    if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product",
      newValue: { categoryId: data.categoryId, productIds: data.productIds }, req });
  }

  else if (data.action === "set_homepage") {
    const result = await prisma.product.updateMany({ where: { id: { in: data.productIds } }, data: { showOnHomepage: data.showOnHomepage } });
    affected = result.count;
  }

  else if (data.action === "price_adjust") {
    const variants = await prisma.productVariant.findMany({
      where: { productId: { in: data.productIds } },
      select: { id: true, price: true, mrp: true },
    });
    const updates = variants.map(v => {
      const cp = Number(v.price); const cm = Number(v.mrp);
      let np = cp; let nm = cm;
      if (data.mode === "percent_increase")  { np = Math.round(cp * (1 + data.value / 100)); nm = Math.round(cm * (1 + data.value / 100)); }
      else if (data.mode === "percent_decrease") { np = Math.round(cp * (1 - data.value / 100)); nm = Math.round(cm * (1 - data.value / 100)); }
      else if (data.mode === "fixed_set")    { np = data.value; }
      return prisma.productVariant.update({ where: { id: v.id }, data: { price: Math.max(1, np), mrp: Math.max(np, nm) } });
    });
    await Promise.all(updates);
    affected = variants.length;
    if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product",
      newValue: { mode: data.mode, value: data.value, productIds: data.productIds }, req });
  }

  else if (data.action === "stock_set") {
    const result = await prisma.productVariant.updateMany({ where: { productId: { in: data.productIds } }, data: { stock: data.stock } });
    affected = result.count;
    if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product",
      newValue: { stock: data.stock, productIds: data.productIds }, req });
  }

  return NextResponse.json({ affected });
}
