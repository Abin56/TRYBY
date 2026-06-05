import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Package } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:          { bg: "rgba(245,197,24,0.12)",  text: "#D4A800", label: "Pending" },
  CONFIRMED:        { bg: "rgba(74,222,128,0.12)",  text: "#16A34A", label: "Confirmed" },
  PROCESSING:       { bg: "rgba(99,102,241,0.12)",  text: "#6366F1", label: "Processing" },
  SHIPPED:          { bg: "rgba(59,130,246,0.12)",  text: "#2563EB", label: "Shipped" },
  OUT_FOR_DELIVERY: { bg: "rgba(249,115,22,0.12)",  text: "#EA580C", label: "Out for Delivery" },
  DELIVERED:        { bg: "rgba(74,222,128,0.12)",  text: "#16A34A", label: "Delivered" },
  CANCELLED:        { bg: "rgba(248,113,113,0.12)", text: "#DC2626", label: "Cancelled" },
  RETURN_REQUESTED: { bg: "rgba(245,197,24,0.12)",  text: "#D4A800", label: "Return Requested" },
  RETURNED:         { bg: "rgba(248,113,113,0.12)", text: "#DC2626", label: "Returned" },
  REFUNDED:         { bg: "rgba(74,222,128,0.12)",  text: "#16A34A", label: "Refunded" },
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/auth/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        },
        take: 2,
      },
      payment: true,
      shipment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[700px] mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="text-[13px] font-semibold text-[#888] hover:text-[#0D0D0D] transition-colors">
            ← Account
          </Link>
          <span className="text-[#CCCCCC]">/</span>
          <h1 className="text-[20px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full mb-5" style={{ background: "rgba(245,197,24,0.1)" }}>
              <ShoppingBag className="h-9 w-9 text-[#F5C518]" />
            </div>
            <h2 className="text-[18px] font-black text-[#0D0D0D] mb-2">No orders yet</h2>
            <p className="text-[14px] text-[#888] mb-6">Your first order is just a few clicks away!</p>
            <Link href="/products" className="inline-flex h-12 items-center px-8 rounded-full font-black text-[14px] text-[#0D0D0D]" style={{ background: "#F5C518" }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
              const firstItem = order.items[0];
              const img = firstItem?.product?.images?.[0]?.url;
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block bg-white rounded-[20px] p-5 hover:shadow-md transition-all group"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "#F5F5F5" }}>
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-[#CCCCCC]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[13px] font-bold text-[#0D0D0D]">{order.orderNumber}</p>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-black shrink-0" style={{ background: style.bg, color: style.text }}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#888]">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {order.shipment?.trackingNumber && (
                        <p className="text-[11px] text-[#2563EB] mt-0.5">Tracking: {order.shipment.trackingNumber}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-black text-[#0D0D0D]">₹{Number(order.total).toLocaleString("en-IN")}</p>
                      <ChevronRight className="h-4 w-4 text-[#CCCCCC] group-hover:text-[#888] transition-colors ml-auto mt-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
