/**
 * Resend email integration — all transactional templates.
 * Gracefully no-ops (with console.log) when RESEND_API_KEY is not configured.
 */

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const FROM       = process.env.RESEND_FROM_EMAIL ?? "official@tryby.in";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://tryby.in";

export function isEmailConfigured(): boolean {
  return !!(RESEND_KEY && !RESEND_KEY.startsWith("REPLACE"));
}

// ── Core send ───────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.log(`[email:dev] → ${to} | ${subject}`);
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[email] send failed:", err);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[email] send error:", msg);
    return { ok: false, error: msg };
  }
}

// ── Shared layout ───────────────────────────────────────────────────────────

function layout(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}&nbsp;&zwnj;</div>` : ""}
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:32px 16px">
  <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"
    style="max-width:600px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">
    <tr><td style="background:#0D0D0D;padding:22px 32px">
      <a href="${APP_URL}" style="text-decoration:none">
        <span style="font-size:26px;font-weight:900;color:#FFFFFF;letter-spacing:-0.02em;font-family:system-ui,sans-serif">
          TRY<span style="color:#F5C518">BY</span>
        </span>
        <span style="font-size:11px;color:rgba(255,255,255,0.4);margin-left:8px;font-weight:600;letter-spacing:0.1em">SPORTS</span>
      </a>
    </td></tr>
    <tr><td style="padding:32px 32px 24px">${content}</td></tr>
    <tr><td style="background:#F9F9F9;padding:20px 32px;border-top:1px solid #ECECEC">
      <p style="margin:0 0 6px;font-size:12px;color:#999;text-align:center">TRYBY Sports · Premium jerseys &amp; gear across India</p>
      <p style="margin:0;font-size:11px;color:#BBBBBB;text-align:center">
        <a href="${APP_URL}/privacy-policy" style="color:#BBBBBB;text-decoration:none">Privacy</a> ·
        <a href="${APP_URL}/terms" style="color:#BBBBBB;text-decoration:none">Terms</a> ·
        <a href="${APP_URL}/account" style="color:#BBBBBB;text-decoration:none">Account</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

const btn  = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#F5C518;color:#0D0D0D;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:14px;margin-top:8px">${label}</a>`;

const btnDark = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#0D0D0D;color:#FFFFFF;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:14px;margin-top:8px">${label}</a>`;

const card = (inner: string, bg = "#F8F8F8") =>
  `<div style="background:${bg};border-radius:12px;padding:16px;margin:16px 0">${inner}</div>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#0D0D0D;line-height:1.2">${text}</h1>`;

const p = (text: string, color = "#555") =>
  `<p style="margin:0 0 16px;font-size:14px;color:${color};line-height:1.6">${text}</p>`;

// ── 1. Welcome ──────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, data: { name: string }) {
  const html = layout(`
    ${h1("Welcome to TRYBY! 🏆")}
    ${p(`Hi ${data.name}, you're in. TRYBY is where India's best sports fans gear up — from official IPL jerseys to premium gym kit.`)}
    ${card(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0D0D0D">What's waiting for you</p>
      <ul style="margin:8px 0 0;padding:0 0 0 18px;font-size:13px;color:#555;line-height:1.8">
        <li>Official licensed jerseys from IPL, ISL &amp; more</li>
        <li>New drops every week — follow your teams</li>
        <li>Fast delivery across India · Easy returns</li>
      </ul>
    `)}
    ${btn(`${APP_URL}/products`, "Shop Now →")}
  `, `Welcome to TRYBY, ${data.name}! Your account is ready.`);

  return send(to, "Welcome to TRYBY Sports 🏆", html);
}

// ── 2. Order Confirmation ───────────────────────────────────────────────────

export interface OrderEmailData {
  orderNumber:   string;
  customerName:  string;
  items:         { name: string; size?: string; color?: string; quantity: number; price: number }[];
  subtotal:      number;
  shipping:      number;
  discount:      number;
  total:         number;
  address:       { fullName: string; line1: string; city: string; state: string; pincode: string; phone: string };
  paymentMethod: string;
  couponCode?:   string;
}

export async function sendOrderConfirmation(to: string, data: OrderEmailData) {
  const itemRows = data.items.map(item => `
    <tr style="border-bottom:1px solid #F0F0F0">
      <td style="padding:10px 0;vertical-align:top">
        <p style="margin:0;font-size:13px;font-weight:600;color:#0D0D0D">${item.name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#888">
          ${[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`, `Qty: ${item.quantity}`].filter(Boolean).join(" · ")}
        </p>
      </td>
      <td style="padding:10px 0;text-align:right;font-size:13px;font-weight:700;color:#0D0D0D;white-space:nowrap">
        ₹${(item.price * item.quantity).toLocaleString("en-IN")}
      </td>
    </tr>
  `).join("");

  const html = layout(`
    ${h1("Order Confirmed! 🎉")}
    ${p(`Hi ${data.customerName}, your order <strong>#${data.orderNumber}</strong> is confirmed.`)}
    <div style="background:#FFF9E6;border:1.5px solid #F5C518;border-radius:12px;padding:10px 14px;margin:0 0 20px;display:inline-block">
      <span style="font-size:13px;font-weight:700;color:#0D0D0D">Order #${data.orderNumber}</span>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">${itemRows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr><td style="font-size:13px;color:#888;padding:3px 0">Subtotal</td><td style="font-size:13px;font-weight:600;color:#0D0D0D;text-align:right">₹${data.subtotal.toLocaleString("en-IN")}</td></tr>
      <tr><td style="font-size:13px;color:#888;padding:3px 0">Shipping</td><td style="font-size:13px;font-weight:600;color:${data.shipping === 0 ? "#16A34A" : "#0D0D0D"};text-align:right">${data.shipping === 0 ? "FREE" : `₹${data.shipping.toLocaleString("en-IN")}`}</td></tr>
      ${data.discount > 0 ? `<tr><td style="font-size:13px;color:#888;padding:3px 0">Discount${data.couponCode ? ` (${data.couponCode})` : ""}</td><td style="font-size:13px;font-weight:600;color:#16A34A;text-align:right">−₹${data.discount.toLocaleString("en-IN")}</td></tr>` : ""}
      <tr style="border-top:2px solid #F0F0F0"><td style="font-size:15px;font-weight:900;color:#0D0D0D;padding:10px 0 4px">Total Paid</td><td style="font-size:15px;font-weight:900;color:#0D0D0D;text-align:right;padding:10px 0 4px">₹${data.total.toLocaleString("en-IN")}</td></tr>
    </table>
    ${card(`
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0D0D0D">📦 Delivering to</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.6">
        ${data.address.fullName}<br/>${data.address.line1}, ${data.address.city}<br/>
        ${data.address.state} − ${data.address.pincode}<br/>📞 ${data.address.phone}
      </p>
    `)}
    <p style="margin:0 0 20px;font-size:13px;color:#888">Payment: <strong style="color:#0D0D0D">${data.paymentMethod.replace("RAZORPAY_", "").replace(/_/g, " ")}</strong></p>
    ${btn(`${APP_URL}/account/orders`, "Track Your Order →")}
  `, `Your TRYBY order #${data.orderNumber} is confirmed!`);

  return send(to, `Order Confirmed: #${data.orderNumber} | TRYBY`, html);
}

// ── 3. Payment Success ──────────────────────────────────────────────────────

export async function sendPaymentSuccess(to: string, data: {
  customerName:  string;
  orderNumber:   string;
  amount:        number;
  paymentMethod: string;
  razorpayId?:   string;
}) {
  const html = layout(`
    ${h1("Payment Received ✅")}
    ${p(`Hi ${data.customerName}, we've received your payment for order <strong>#${data.orderNumber}</strong>.`)}
    ${card(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:13px;color:#888">Amount</td><td style="font-size:14px;font-weight:700;color:#0D0D0D;text-align:right">₹${data.amount.toLocaleString("en-IN")}</td></tr>
        <tr><td style="font-size:13px;color:#888;padding-top:4px">Method</td><td style="font-size:13px;color:#555;text-align:right;padding-top:4px">${data.paymentMethod.replace("RAZORPAY_", "").replace(/_/g, " ")}</td></tr>
        ${data.razorpayId ? `<tr><td style="font-size:13px;color:#888;padding-top:4px">Ref</td><td style="font-size:11px;color:#888;text-align:right;padding-top:4px;font-family:monospace">${data.razorpayId}</td></tr>` : ""}
      </table>
    `, "#F0FDF4")}
    ${p("Your order is now being processed. You'll get a shipping update soon.")}
    ${btn(`${APP_URL}/account/orders`, "View Order")}
  `, `Payment of ₹${data.amount.toLocaleString("en-IN")} received for #${data.orderNumber}`);

  return send(to, `Payment Confirmed for #${data.orderNumber} | TRYBY`, html);
}

// ── 4. Payment Failed ───────────────────────────────────────────────────────

export async function sendPaymentFailed(to: string, data: {
  customerName:   string;
  orderNumber:    string;
  amount:         number;
  failureReason?: string;
}) {
  const html = layout(`
    ${h1("Payment Failed ⚠️")}
    ${p(`Hi ${data.customerName}, we couldn't process your payment for order <strong>#${data.orderNumber}</strong>.`)}
    ${card(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#DC2626">Amount: ₹${data.amount.toLocaleString("en-IN")}</p>
      ${data.failureReason ? `<p style="margin:0;font-size:12px;color:#888">Reason: ${data.failureReason}</p>` : ""}
    `, "#FFF5F5")}
    ${p("Your order is saved. Try again with a different payment method.")}
    ${btn(`${APP_URL}/checkout`, "Try Again →")}
    ${p("Need help? Email us at support@tryby.in", "#999")}
  `, `Your TRYBY payment failed — retry to complete your order`);

  return send(to, `Action Required: Payment Failed for #${data.orderNumber}`, html);
}

// ── 5. Order Shipped ────────────────────────────────────────────────────────

export async function sendShippingUpdate(to: string, data: {
  orderNumber:    string;
  customerName:   string;
  carrier?:       string;
  trackingNumber: string;
  trackingUrl?:   string;
  estimatedDate?: string;
}) {
  const html = layout(`
    ${h1("Your order is on its way! 🚚")}
    ${p(`Hi ${data.customerName}, your TRYBY order has been shipped!`)}
    ${card(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0D0D0D">Order #${data.orderNumber}</p>
      ${data.carrier ? `<p style="margin:0 0 4px;font-size:13px;color:#555">Carrier: <strong>${data.carrier}</strong></p>` : ""}
      <p style="margin:0 0 4px;font-size:13px;color:#555">Tracking: <strong style="font-family:monospace">${data.trackingNumber}</strong></p>
      ${data.estimatedDate ? `<p style="margin:0;font-size:12px;color:#888">Expected: ${data.estimatedDate}</p>` : ""}
    `, "#EFF6FF")}
    ${data.trackingUrl ? `${btnDark(data.trackingUrl, "Track Live →")}<br/><br/>` : ""}
    ${btn(`${APP_URL}/account/orders`, "View Order")}
  `, `Your TRYBY order #${data.orderNumber} has been shipped!`);

  return send(to, `Shipped: Your TRYBY order #${data.orderNumber} is on the way 🚚`, html);
}

// ── 6. Order Delivered ──────────────────────────────────────────────────────

export async function sendOrderDelivered(to: string, data: {
  customerName: string;
  orderNumber:  string;
  items:        { name: string; productSlug: string; orderItemId: string; imageUrl?: string }[];
}) {
  const reviewLinks = data.items.slice(0, 3).map(item => `
    <tr><td style="padding:8px 0;border-bottom:1px solid #F5F5F5">
      <span style="font-size:13px;font-weight:600;color:#0D0D0D">${item.name}</span><br/>
      <a href="${APP_URL}/products/${item.productSlug}?review=1&orderItemId=${item.orderItemId}"
        style="display:inline-block;margin-top:6px;background:#F5C518;color:#0D0D0D;font-weight:700;font-size:11px;text-decoration:none;padding:5px 12px;border-radius:8px">
        ★ Leave a Review
      </a>
    </td></tr>
  `).join("");

  const html = layout(`
    ${h1("Delivered! Hope you love it 📦✅")}
    ${p(`Hi ${data.customerName}, your order <strong>#${data.orderNumber}</strong> has been delivered. Enjoy your gear!`)}
    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0D0D0D">How did we do?</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">${reviewLinks}</table>
    ${p("Your reviews help thousands of sports fans. Takes under 60 seconds! ⚡")}
    ${btn(`${APP_URL}/account/orders`, "View Order History")}
  `, `Your TRYBY order #${data.orderNumber} has been delivered!`);

  return send(to, `Delivered: Order #${data.orderNumber} | TRYBY`, html);
}

// ── 7. Return Approved ──────────────────────────────────────────────────────

export async function sendReturnApproved(to: string, data: {
  customerName: string;
  orderNumber:  string;
  refundAmount: number;
  pickupDate?:  string;
  instructions: string;
}) {
  const html = layout(`
    ${h1("Return Approved ✅")}
    ${p(`Hi ${data.customerName}, your return for order <strong>#${data.orderNumber}</strong> is approved.`)}
    ${card(`
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#16A34A">Refund: ₹${data.refundAmount.toLocaleString("en-IN")}</p>
      ${data.pickupDate ? `<p style="margin:0 0 4px;font-size:13px;color:#555">Pickup: <strong>${data.pickupDate}</strong></p>` : ""}
      <p style="margin:0;font-size:13px;color:#555">${data.instructions}</p>
    `, "#F0FDF4")}
    ${p("Refund to your original payment method within 5–7 business days after we receive the item.")}
    ${btn(`${APP_URL}/account/orders`, "Track Return")}
  `, `Your TRYBY return for #${data.orderNumber} is approved`);

  return send(to, `Return Approved: #${data.orderNumber} | TRYBY`, html);
}

// ── 8. Return Rejected ──────────────────────────────────────────────────────

export async function sendReturnRejected(to: string, data: {
  customerName: string;
  orderNumber:  string;
  reason:       string;
}) {
  const html = layout(`
    ${h1("Return Request Update")}
    ${p(`Hi ${data.customerName}, we've reviewed your return for order <strong>#${data.orderNumber}</strong>.`)}
    ${card(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#DC2626">Return could not be approved</p>
      <p style="margin:0;font-size:13px;color:#555">${data.reason}</p>
    `, "#FFF5F5")}
    ${p("If you think this is a mistake, our support team is here to help.")}
    <a href="mailto:support@tryby.in" style="display:inline-block;background:#0D0D0D;color:#FFFFFF;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px">Contact Support</a>
  `, `Update on your return for TRYBY order #${data.orderNumber}`);

  return send(to, `Return Update: Order #${data.orderNumber} | TRYBY`, html);
}

// ── 9. Supplier Approved ────────────────────────────────────────────────────

export async function sendSupplierApproved(to: string, data: { name: string; companyName: string }) {
  const html = layout(`
    ${h1("Welcome to the TRYBY Supplier Network! 🤝")}
    ${p(`Hi ${data.name}, <strong>${data.companyName}</strong> has been approved as a TRYBY supplier.`)}
    ${card(`
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0D0D0D">Getting started</p>
      <ol style="margin:8px 0 0;padding:0 0 0 18px;font-size:13px;color:#555;line-height:1.9">
        <li>Log in to your supplier portal</li>
        <li>Complete your profile &amp; upload documents</li>
        <li>List your products — live after admin review</li>
        <li>Manage orders &amp; track payouts in real time</li>
      </ol>
    `)}
    ${btn(`${APP_URL}/supplier/dashboard`, "Open Supplier Portal →")}
  `, `${data.companyName} is now a TRYBY supplier!`);

  return send(to, `Supplier Approved: Welcome to TRYBY, ${data.companyName}!`, html);
}

// ── 10. Payout Approved ─────────────────────────────────────────────────────

export async function sendPayoutApproved(to: string, data: {
  supplierName:  string;
  amount:        number;
  reference:     string;
  scheduledDate?: string;
}) {
  const html = layout(`
    ${h1("Payout Approved 💸")}
    ${p(`Hi ${data.supplierName}, your payout is approved and being processed.`)}
    ${card(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:13px;color:#888">Amount</td><td style="font-size:16px;font-weight:900;color:#16A34A;text-align:right">₹${data.amount.toLocaleString("en-IN")}</td></tr>
        <tr><td style="font-size:13px;color:#888;padding-top:4px">Reference</td><td style="font-size:12px;color:#555;text-align:right;padding-top:4px;font-family:monospace">${data.reference}</td></tr>
        ${data.scheduledDate ? `<tr><td style="font-size:13px;color:#888;padding-top:4px">Expected by</td><td style="font-size:13px;font-weight:600;color:#0D0D0D;text-align:right;padding-top:4px">${data.scheduledDate}</td></tr>` : ""}
      </table>
    `, "#F0FDF4")}
    ${p("Amount credited to your registered bank account within 2–3 business days.")}
    ${btn(`${APP_URL}/supplier/payouts`, "View Payout History")}
  `, `Your TRYBY payout of ₹${data.amount.toLocaleString("en-IN")} is on its way`);

  return send(to, `Payout Approved: ₹${data.amount.toLocaleString("en-IN")} | TRYBY`, html);
}

// ── 11. Password Reset ──────────────────────────────────────────────────────

export async function sendPasswordReset(to: string, data: { name?: string; resetUrl: string; expiresIn: string }) {
  const html = layout(`
    ${h1("Reset your password 🔑")}
    ${p(`Hi${data.name ? ` ${data.name}` : ""},<br/>We received a request to reset your TRYBY password.`)}
    ${btn(data.resetUrl, "Reset Password →")}
    ${card(`<p style="margin:0;font-size:12px;color:#888">This link expires in <strong>${data.expiresIn}</strong>. If you didn't request this, ignore the email.</p>`)}
    ${p(`Or copy this URL:<br/><span style="font-size:11px;color:#888;word-break:break-all">${data.resetUrl}</span>`, "#555")}
  `, "Reset your TRYBY password — expires in 1 hour");

  return send(to, "Reset your TRYBY password", html);
}

// ── Legacy alias ─────────────────────────────────────────────────────────────

export async function sendReviewRequest(to: string, data: {
  customerName: string;
  orderNumber:  string;
  items:        { name: string; imageUrl?: string; productSlug: string; orderItemId: string }[];
}) {
  return sendOrderDelivered(to, {
    customerName: data.customerName,
    orderNumber:  data.orderNumber,
    items:        data.items,
  });
}
