import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, subtotal } = await req.json().catch(() => ({}));
  if (!code || typeof subtotal !== "number") {
    return NextResponse.json({ error: "code and subtotal required" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findFirst({
    where: {
      code:      code.toString().toUpperCase().trim(),
      isActive:  true,
      validFrom: { lte: new Date() },
      OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
    },
  });

  if (!coupon) {
    return NextResponse.json({ valid: false, error: "Invalid or expired coupon code" });
  }

  // Check global usage limit
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
  }

  // Check per-user usage limit
  const userUsageCount = await prisma.order.count({
    where: { userId: session.user.id, couponId: coupon.id },
  });
  if (userUsageCount >= coupon.perUserLimit) {
    return NextResponse.json({
      valid: false,
      error: coupon.perUserLimit === 1
        ? "You have already used this coupon"
        : `You can only use this coupon ${coupon.perUserLimit} times`,
    });
  }

  // Check minimum order value
  if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order value of ₹${Number(coupon.minOrderValue).toLocaleString("en-IN")} required`,
    });
  }

  // Compute discount
  const shippingCharge = subtotal >= 499 ? 0 : 49;
  let discount = 0;
  if (coupon.type === "PERCENTAGE") discount = subtotal * Number(coupon.value);
  else if (coupon.type === "FLAT")   discount = Number(coupon.value);
  else if (coupon.type === "FREE_SHIPPING") discount = shippingCharge;
  if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  discount = Math.min(discount, subtotal); // never exceed subtotal

  return NextResponse.json({ valid: true, discount: Math.round(discount), code: coupon.code });
}
