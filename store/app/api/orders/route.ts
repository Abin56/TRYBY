import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generateOrderNumber } from "@/lib/utils/order";
import { sendOrderConfirmation } from "@/lib/email";
import { selectWarehouse } from "@/lib/inventory-reservation";
import { aggregateServiceability } from "@/lib/shipping";

const STORE_PINCODE = process.env.STORE_PINCODE ?? "400001";

const checkoutSchema = z.object({
  shippingAddressId: z.string().cuid(),
  billingAddressId: z.string().cuid().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["RAZORPAY_CARD", "RAZORPAY_UPI", "RAZORPAY_NETBANKING", "RAZORPAY_WALLET", "COD"]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      payment: true,
      shipment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only customers may place orders — admins and suppliers must not inherit checkout flows.
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = checkoutSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { variant: true, product: true },
  });

  if (!cartItems.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  // Stock validation
  for (const item of cartItems) {
    if (item.variant.stock < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for ${item.product.name}` }, { status: 409 });
    }
  }

  let coupon = null;
  if (body.data.couponCode) {
    coupon = await prisma.coupon.findFirst({
      where: {
        code: body.data.couponCode.toUpperCase(),
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });
    if (!coupon) return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });

    // Enforce global usage cap
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    // Enforce per-user usage cap
    const userUses = await prisma.order.count({
      where: { userId: session.user.id, couponId: coupon.id },
    });
    if (userUses >= coupon.perUserLimit) {
      return NextResponse.json({ error: "You have already used this coupon the maximum number of times" }, { status: 400 });
    }
  }

  // Serviceability guard — fetch shipping address pincode and verify delivery
  const shippingAddress = await prisma.address.findUnique({
    where: { id: body.data.shippingAddressId },
    select: { pincode: true },
  });
  if (!shippingAddress) return NextResponse.json({ error: "Shipping address not found" }, { status: 404 });

  const settingsRow = await prisma.siteSettings.findUnique({ where: { key: "shipping_config" } }).catch(() => null);
  const settings    = (settingsRow?.extraData ?? {}) as Record<string, unknown>;
  const restricted  = (settings.restrictedPincodes as string[] | undefined) ?? [];

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0
  );

  const svcResult = await aggregateServiceability(
    STORE_PINCODE,
    shippingAddress.pincode,
    500,
    body.data.paymentMethod === "COD",
    subtotal,
    restricted,
  );
  if (!svcResult.serviceable) {
    return NextResponse.json(
      { error: svcResult.reason ?? "Delivery not available to the selected pincode" },
      { status: 422 }
    );
  }

  const shippingCharge = subtotal >= 499 ? 0 : 49;
  let discount = 0;
  if (coupon) {
    if (coupon.type === "PERCENTAGE") discount = subtotal * Number(coupon.value);
    else if (coupon.type === "FLAT") discount = Number(coupon.value);
    else if (coupon.type === "FREE_SHIPPING") discount = shippingCharge;
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  }
  const total = Math.max(0, subtotal + shippingCharge - discount);

  let order;
  try {
  order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user.id,
        shippingAddressId: body.data.shippingAddressId,
        billingAddressId: body.data.billingAddressId,
        couponId: coupon?.id,
        subtotal,
        shippingCharge,
        discount,
        total,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            variantSku: item.variant.sku,
            size: item.variant.size,
            color: item.variant.color,
            quantity: item.quantity,
            unitPrice: item.variant.price,
            mrp: item.variant.mrp,
            total: Number(item.variant.price) * item.quantity,
          })),
        },
        statusHistory: {
          create: { status: "PENDING" },
        },
        payment: {
          create: {
            method: body.data.paymentMethod,
            amount: total,
            status: body.data.paymentMethod === "COD" ? "PENDING" : "PENDING",
          },
        },
      },
      include: { items: true, payment: true },
    });

    // Atomic stock decrement — only succeeds when stock >= quantity at commit time,
    // preventing concurrent orders from overselling the same variant.
    for (const item of cartItems) {
      const updated = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data:  { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw new Error(`INSUFFICIENT_STOCK:${item.product.name}`);
      }
    }

    // Update sold counts
    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          totalSoldCount: { increment: item.quantity },
          weeklySoldCount: { increment: item.quantity },
        },
      });
    }

    // Atomic coupon usage increment — WHERE usageLimit IS NULL OR usageCount < usageLimit
    // prevents two concurrent orders from both reading usageCount=9 on a limit=10 coupon
    // and both incrementing to 10 and 11.
    if (coupon) {
      const couponUpdated = await tx.$executeRaw`
        UPDATE "Coupon"
        SET "usageCount" = "usageCount" + 1
        WHERE id = ${coupon.id}
          AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")
      `;
      if (couponUpdated === 0) {
        throw new Error("COUPON_LIMIT_REACHED");
      }
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { userId: session.user.id } });

    return newOrder;
  });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("INSUFFICIENT_STOCK:")) {
      const name = msg.replace("INSUFFICIENT_STOCK:", "");
      return NextResponse.json({ error: `"${name}" is out of stock. Please update your cart.` }, { status: 409 });
    }
    if (msg === "COUPON_LIMIT_REACHED") {
      return NextResponse.json({ error: "This coupon has just reached its usage limit" }, { status: 409 });
    }
    throw err;
  }

  // Warehouse allocation — fire-and-forget after transaction
  // Stock was already decremented in the transaction above; here we only create
  // the allocation records and bump warehouse reservedQty (best-effort).
  Promise.resolve().then(async () => {
    try {
      for (const item of order.items) {
        const warehouseId = await selectWarehouse(prisma as unknown as Parameters<typeof selectWarehouse>[0], item.variantId, item.quantity);
        if (!warehouseId) continue;
        await prisma.$transaction(async tx => {
          await tx.warehouseStock.update({
            where: { warehouseId_variantId: { warehouseId, variantId: item.variantId } },
            data:  { reservedQty: { increment: item.quantity } },
          });
          await tx.orderFulfillmentAllocation.create({
            data: {
              orderId:     order.id,
              variantId:   item.variantId,
              warehouseId,
              reservedQty: item.quantity,
              status:      "PENDING",
            },
          });
        });
      }
    } catch { /* non-blocking */ }
  });

  // SLA creation — fire-and-forget; creates SupplierSLA records for supplier products
  fetch(`${process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000"}/api/internal/sla/order-event`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: JSON.stringify({ orderId: order.id, orderStatus: "PENDING" }),
  }).catch(() => {});

  // Send order confirmation email (non-blocking)
  const shippingAddr = await prisma.address.findUnique({ where: { id: body.data.shippingAddressId } });
  if (session.user.email && shippingAddr) {
    sendOrderConfirmation(session.user.email, {
      orderNumber: order.orderNumber,
      customerName: session.user.name ?? "Customer",
      items: order.items.map(item => ({
        name: item.productName,
        size: item.size ?? undefined,
        quantity: item.quantity,
        price: Number(item.unitPrice),
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shippingCharge ?? 0),
      discount: Number(order.discount ?? 0),
      total: Number(order.total),
      address: {
        fullName: shippingAddr.fullName,
        line1: shippingAddr.line1,
        city: shippingAddr.city,
        state: shippingAddr.state,
        pincode: shippingAddr.pincode,
        phone: shippingAddr.phone,
      },
      paymentMethod: body.data.paymentMethod,
    }).catch(err => console.error("[email] order confirmation failed:", err));
  }

  return NextResponse.json(order, { status: 201 });
}
