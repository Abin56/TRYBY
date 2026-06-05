import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Package, MapPin, CreditCard, Truck, ExternalLink, CheckCircle2, Circle } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:          { bg: "rgba(245,197,24,0.1)",   text: "#D4A800", label: "Pending"          },
  CONFIRMED:        { bg: "rgba(74,222,128,0.1)",   text: "#16A34A", label: "Confirmed"        },
  PROCESSING:       { bg: "rgba(99,102,241,0.1)",   text: "#6366F1", label: "Processing"       },
  SHIPPED:          { bg: "rgba(59,130,246,0.1)",   text: "#2563EB", label: "Shipped"          },
  OUT_FOR_DELIVERY: { bg: "rgba(249,115,22,0.1)",   text: "#EA580C", label: "Out for Delivery" },
  DELIVERED:        { bg: "rgba(74,222,128,0.1)",   text: "#16A34A", label: "Delivered"        },
  CANCELLED:        { bg: "rgba(248,113,113,0.1)",  text: "#DC2626", label: "Cancelled"        },
  RETURN_REQUESTED: { bg: "rgba(245,197,24,0.1)",   text: "#D4A800", label: "Return Requested" },
  RETURNED:         { bg: "rgba(248,113,113,0.1)",  text: "#DC2626", label: "Returned"         },
  REFUNDED:         { bg: "rgba(74,222,128,0.1)",   text: "#16A34A", label: "Refunded"         },
};

const SHIPMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Order Received", PACKED: "Packed & Ready",
  PICKED_UP: "Picked Up by Courier", IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered",
  FAILED_DELIVERY: "Delivery Attempted", RETURNED: "Returned to Sender", LOST: "Lost in Transit",
};

const COURIER_LABEL: Record<string, string> = {
  SHIPROCKET: "Shiprocket", DELHIVERY: "Delhivery", DTDC: "DTDC",
  INDIA_POST: "India Post", BLUEDART: "BlueDart",
  XPRESSBEES: "Xpressbees", ECOM_EXPRESS: "Ecom Express", OTHER: "Courier",
};

const TRACKING_STEPS = [
  { key: "PENDING",          label: "Order Placed",      desc: "We received your order"             },
  { key: "CONFIRMED",        label: "Confirmed",          desc: "Payment verified, packing started"  },
  { key: "PROCESSING",       label: "Packed",             desc: "Your order is packed and ready"     },
  { key: "SHIPPED",          label: "Shipped",            desc: "Picked up by courier"               },
  { key: "IN_TRANSIT",       label: "In Transit",         desc: "Moving through courier network"     },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery",   desc: "On its way to your door"            },
  { key: "DELIVERED",        label: "Delivered",          desc: "Successfully delivered!"            },
];

const STEP_RANK: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, PROCESSING: 2, SHIPPED: 3,
  IN_TRANSIT: 4, OUT_FOR_DELIVERY: 5, DELIVERED: 6,
};

function fmt(n: number | string | { toString(): string }) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          variant: true,
        },
      },
      payment: true,
      shipment: { include: { events: { orderBy: { eventAt: "desc" }, take: 20 } } },
      shippingAddress: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      coupon: true,
    },
  });

  if (!order) notFound();

  const style     = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
  const rank      = STEP_RANK[order.status] ?? 0;
  const shipment  = order.shipment;
  const isCancelled    = order.status === "CANCELLED";
  const isFinalNegative = ["CANCELLED", "RETURNED", "RETURN_REQUESTED"].includes(order.status);
  const hasTracking     = !!(shipment?.trackingNumber || shipment?.awbCode);
  const courierName     = shipment?.courier
    ? COURIER_LABEL[shipment.courier] ?? shipment.carrierName ?? "Courier"
    : shipment?.carrierName ?? "Courier";

  // Find the datetime for each status from history
  const historyByStatus: Record<string, Date> = {};
  for (const h of order.statusHistory) {
    if (!historyByStatus[h.status]) historyByStatus[h.status] = new Date(h.createdAt);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[700px] mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href="/account/orders"
            className="text-[13px] font-semibold text-[#888] hover:text-[#0D0D0D] transition-colors">
            ← Orders
          </Link>
          <span className="text-[#CCCCCC]">/</span>
          <span className="text-[13px] font-bold text-[#0D0D0D]">{order.orderNumber}</span>
          <span className="rounded-full px-3 py-1 text-[11px] font-black ml-auto"
            style={{ background: style.bg, color: style.text }}>
            {style.label}
          </span>
        </div>

        {/* ── Delivery Timeline ── */}
        {!isCancelled && (
          <div className="bg-white rounded-[20px] p-6 mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <h2 className="text-[15px] font-black text-[#0D0D0D] mb-6"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Delivery Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-[13px] top-3 bottom-3 w-0.5" style={{ background: "#F0F0F0" }} />
              <div
                className="absolute left-[13px] top-3 w-0.5"
                style={{
                  background: "linear-gradient(to bottom, #F5C518, #F5C51888)",
                  height: `${Math.min(((rank) / (TRACKING_STEPS.length - 1)) * 100, 100)}%`,
                }}
              />
              <div className="space-y-5">
                {TRACKING_STEPS.map((step, i) => {
                  const done    = i <= rank;
                  const current = i === rank;
                  const ts      = historyByStatus[step.key];
                  return (
                    <div key={step.key} className="flex items-start gap-4 pl-8 relative">
                      <div className={`absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                        done ? "border-[#F5C518] bg-[#F5C518]" : "border-[#E8E8E8] bg-white"
                      }`}>
                        {done
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-[#0D0D0D]" />
                          : <Circle className="h-3 w-3 text-[#DDDDDD]" />
                        }
                      </div>
                      <div className="flex-1 pb-0.5">
                        <div className="flex items-center gap-2">
                          <p className={`text-[13px] font-bold ${done ? "text-[#0D0D0D]" : "text-[#BBBBBB]"}`}>
                            {step.label}
                          </p>
                          {current && i > 0 && (
                            <span className="text-[10px] font-black text-[#F5C518] rounded-full px-2 py-0.5"
                              style={{ background: "rgba(245,197,24,0.12)" }}>
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#AAAAAA] mt-0.5">{step.desc}</p>
                        {ts && (
                          <p className="text-[10px] text-[#CCCCCC] mt-0.5">
                            {ts.toLocaleString("en-IN", {
                              day: "2-digit", month: "short",
                              hour: "2-digit", minute: "2-digit", hour12: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Tracking Card ── */}
        {hasTracking && !isFinalNegative && (
          <div className="bg-white rounded-[20px] p-5 mb-4"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1.5px solid #E8F0FE" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                style={{ background: "rgba(37,99,235,0.08)" }}>
                <Truck className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-[#0D0D0D]">
                  {shipment?.status
                    ? (SHIPMENT_STATUS_LABEL[shipment.status] ?? courierName)
                    : courierName}
                </p>
                <p className="text-[11px] text-[#888]">{courierName}</p>
              </div>
              {shipment?.estimatedAt && new Date(shipment.estimatedAt) > new Date() && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#888]">Expected by</p>
                  <p className="text-[12px] font-bold text-[#0D0D0D]">
                    {new Date(shipment.estimatedAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-2" style={{ borderColor: "#F0F0F0" }}>
              {(shipment?.awbCode || shipment?.trackingNumber) && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#888]">AWB / Tracking No.</span>
                  <span className="text-[12px] font-bold font-mono text-[#0D0D0D]">
                    {shipment.awbCode ?? shipment.trackingNumber}
                  </span>
                </div>
              )}
              {/* Last scan location from latest event */}
              {shipment?.events && shipment.events.length > 0 && shipment.events[0].location && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#888]">Last Scan</span>
                  <span className="text-[12px] font-semibold text-[#0D0D0D]">
                    📍 {shipment.events[0].location}
                  </span>
                </div>
              )}
            </div>

            {/* Live tracking events from webhooks */}
            {shipment?.events && shipment.events.length > 0 && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: "#F0F0F0" }}>
                <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-3">Tracking History</p>
                <div className="relative space-y-0">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5" style={{ background: "#E8F0FE" }} />
                  {shipment.events.map((ev, i) => (
                    <div key={ev.id} className="flex gap-3 pl-6 pb-4 relative">
                      <div className={`absolute left-0 h-3.5 w-3.5 rounded-full border-2 top-1 ${
                        i === 0 ? "border-[#2563EB] bg-[#2563EB]" : "border-[#DDDDDD] bg-white"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] font-bold ${i === 0 ? "text-[#0D0D0D]" : "text-[#555]"}`}>
                          {ev.status}
                        </p>
                        {ev.description && ev.description !== ev.status && (
                          <p className="text-[11px] text-[#888] mt-0.5">{ev.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {ev.location && (
                            <span className="text-[10px] text-[#AAAAAA]">📍 {ev.location}</span>
                          )}
                          <span className="text-[10px] text-[#CCCCCC]">
                            {new Date(ev.eventAt).toLocaleString("en-IN", {
                              day: "2-digit", month: "short",
                              hour: "2-digit", minute: "2-digit", hour12: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shipment?.trackingUrl && (
              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[13px] font-bold text-white"
                style={{ background: "#2563EB" }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Track Live on {courierName}
              </a>
            )}
          </div>
        )}

        {/* ── Order Items ── */}
        <div className="bg-white rounded-[20px] p-5 mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 className="text-[15px] font-black text-[#0D0D0D] mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map(item => {
              const img = item.product?.images?.[0]?.url;
              return (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ background: "#F5F5F5" }}>
                    {img
                      ? <img src={img} alt={item.productName} className="w-full h-full object-cover" />
                      : <Package className="h-5 w-5 text-[#CCCCCC]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0D0D0D] truncate">{item.productName}</p>
                    <p className="text-[11px] text-[#888]">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && " · "}
                      {item.color && `Color: ${item.color}`}
                      {" · "}Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-black text-[#0D0D0D]">{fmt(item.total)}</p>
                    <p className="text-[11px] text-[#AAAAAA] line-through">{fmt(Number(item.mrp) * item.quantity)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price breakdown */}
          <div className="mt-5 pt-4 border-t border-[#F0F0F0] space-y-2">
            <div className="flex justify-between text-[13px] text-[#888]">
              <span>Subtotal</span>
              <span className="text-[#0D0D0D] font-semibold">{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-[#888]">
              <span>Shipping</span>
              <span className={`font-semibold ${Number(order.shippingCharge) === 0 ? "text-[#16A34A]" : "text-[#0D0D0D]"}`}>
                {Number(order.shippingCharge) === 0 ? "FREE" : fmt(order.shippingCharge)}
              </span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-[13px] text-[#888]">
                <span>Discount{order.coupon ? ` (${order.coupon.code})` : ""}</span>
                <span className="font-semibold text-[#16A34A]">- {fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[15px] font-black text-[#0D0D0D] pt-1 border-t border-[#F0F0F0]">
              <span>Total Paid</span><span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Address + Payment ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[#F5C518]" />
              <h3 className="text-[13px] font-black text-[#0D0D0D]">Shipping Address</h3>
            </div>
            <div className="text-[12px] text-[#555] leading-relaxed">
              <p className="font-semibold text-[#0D0D0D]">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
              <p>India</p>
              <p className="mt-1">📞 {order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-[#F5C518]" />
              <h3 className="text-[13px] font-black text-[#0D0D0D]">Payment</h3>
            </div>
            {order.payment ? (
              <div className="text-[12px] text-[#555] leading-relaxed">
                <p><span className="font-semibold text-[#0D0D0D]">Method: </span>
                  {order.payment.method.replace("RAZORPAY_", "").replace(/_/g, " ")}</p>
                <p><span className="font-semibold text-[#0D0D0D]">Status: </span>
                  {order.payment.status}</p>
                {order.payment.razorpayPaymentId && (
                  <p className="text-[11px] text-[#AAAAAA] mt-1 font-mono">{order.payment.razorpayPaymentId}</p>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-[#888]">No payment record</p>
            )}
          </div>
        </div>

        {/* ── Status History ── */}
        <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 className="text-[13px] font-black text-[#0D0D0D] mb-4">Order History</h3>
          <div className="space-y-3">
            {[...order.statusHistory].reverse().map(h => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: STATUS_STYLES[h.status]?.text ?? "#CCCCCC" }} />
                <div>
                  <p className="text-[12px] font-semibold text-[#0D0D0D]">
                    {STATUS_STYLES[h.status]?.label ?? h.status}
                  </p>
                  {h.note && <p className="text-[11px] text-[#888]">{h.note}</p>}
                  <p className="text-[11px] text-[#AAAAAA]">
                    {new Date(h.createdAt).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit", hour12: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
