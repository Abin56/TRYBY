import type { Metadata } from "next";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Cancellation Policy | TRYBY Sports",
  description: "TRYBY Sports order cancellation policy — how to cancel, timelines, and refund details.",
  alternates: { canonical: `${BASE}/cancellation` },
  openGraph: {
    title: "Cancellation Policy | TRYBY Sports",
    description: "Cancel within 1 hour for a full refund. Understand TRYBY Sports' cancellation windows, refund timelines, and alternatives.",
    url: `${BASE}/cancellation`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports Cancellation Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cancellation Policy | TRYBY Sports",
    description: "Cancel within 1 hour for a full refund. TRYBY Sports cancellation & refund policy.",
    images: [`${BASE}/og-image.png`],
    site: "@trybysports",
  },
};

export default function CancellationPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1
          className="text-[32px] font-black text-[#0D0D0D] mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Cancellation Policy
        </h1>
        <p className="text-[13px] text-[#888] mb-10">Last updated: 5 June 2025</p>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: "⏱️",
              label: "Cancellation Window",
              value: "Within 1 hour of placing order",
              color: "#16A34A",
              bg: "#F0FDF4",
              border: "#BBF7D0",
            },
            {
              icon: "💸",
              label: "Refund on Cancellation",
              value: "Full refund to original payment method",
              color: "#1D4ED8",
              bg: "#EFF6FF",
              border: "#BFDBFE",
            },
            {
              icon: "📦",
              label: "After Dispatch",
              value: "Cancellation not possible once shipped",
              color: "#B45309",
              bg: "#FFFBEB",
              border: "#FDE68A",
            },
          ].map(({ icon, label, value, color, bg, border }) => (
            <div
              key={label}
              className="rounded-[20px] p-5"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-[11px] font-black uppercase tracking-[0.1em] mt-2 mb-1" style={{ color }}>
                {label}
              </p>
              <p className="text-[13px] font-semibold text-[#0D0D0D]">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {[
            {
              icon: "✅",
              title: "How to Cancel Your Order",
              body: (
                <>
                  <p>Orders can be cancelled within <strong>1 hour of placement</strong>. To cancel:</p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1.5">
                    <li>Log in to your TRYBY account</li>
                    <li>Go to <strong>My Account → Orders</strong></li>
                    <li>Select the order you wish to cancel</li>
                    <li>Click <strong>&ldquo;Cancel Order&rdquo;</strong> and select a reason</li>
                    <li>Confirm the cancellation — you will receive an email confirmation within minutes</li>
                  </ol>
                  <p className="mt-3">
                    Alternatively, email{" "}
                    <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">
                      official@tryby.in
                    </a>{" "}
                    immediately with your Order ID and &ldquo;Cancel Order&rdquo; in the subject line. We will do our best but
                    cannot guarantee cancellation once the order moves to processing.
                  </p>
                </>
              ),
            },
            {
              icon: "⚠️",
              title: "When Cancellation is Not Possible",
              body: (
                <>
                  <p>Cancellation is <strong>not possible</strong> in the following situations:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>The 1-hour cancellation window has passed</li>
                    <li>The order has already been dispatched or is out for delivery</li>
                    <li>The item is a <strong>customised product</strong> (name/number printing) — production begins immediately</li>
                    <li>The item is a <strong>digital product</strong> (gift cards, digital vouchers) — delivered instantly upon payment</li>
                    <li>The order is a <strong>pre-order or back-order</strong> item that has already entered fulfillment</li>
                  </ul>
                  <p className="mt-3">
                    If you&apos;ve missed the cancellation window, you can initiate a return after delivery under our{" "}
                    <a href="/returns" className="underline hover:text-[#F5C518]">
                      7-day Returns Policy
                    </a>{" "}
                    (subject to eligibility).
                  </p>
                </>
              ),
            },
            {
              icon: "💰",
              title: "Refund After Cancellation",
              body: (
                <>
                  <p>
                    Once your cancellation is confirmed, a <strong>full refund</strong> is initiated to your original
                    payment method. No deductions are made for cancellations within the permitted window.
                  </p>
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-[13px] border-collapse">
                      <thead>
                        <tr className="bg-[#F0F0F0] text-[#0D0D0D] font-semibold">
                          <th className="text-left px-3 py-2.5 rounded-tl-lg">Payment Method</th>
                          <th className="text-left px-3 py-2.5 rounded-tr-lg">Refund Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ECECEC]">
                        {[
                          ["Credit / Debit Card", "5–7 business days to original card"],
                          ["UPI (GPay, PhonePe, Paytm)", "2–3 business days to UPI ID"],
                          ["Net Banking", "3–5 business days to bank account"],
                          ["Wallets", "2–3 business days to wallet"],
                          ["Cash on Delivery (COD)", "N/A — order cancelled before delivery, no charge"],
                        ].map(([method, timeline]) => (
                          <tr key={method} className="bg-white">
                            <td className="px-3 py-2.5">{method}</td>
                            <td className="px-3 py-2.5 font-semibold text-[#0D0D0D]">{timeline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[12px] text-[#888]">
                    Bank processing timelines are indicative and may vary. You will receive an email when the refund
                    is initiated. If you don&apos;t see the refund after 7 business days, contact{" "}
                    <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a>.
                  </p>
                </>
              ),
            },
            {
              icon: "🏭",
              title: "Cancellation by TRYBY",
              body: (
                <>
                  <p>
                    In rare cases, TRYBY Sports may cancel your order. This can happen due to:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>Product out of stock after order placement</li>
                    <li>Pricing or product listing error</li>
                    <li>Unverifiable or undeliverable delivery address</li>
                    <li>Suspected fraudulent or abusive activity</li>
                    <li>Payment authorisation failure or chargeback risk</li>
                  </ul>
                  <p className="mt-3">
                    If we cancel your order, you will be notified via email and a <strong>full refund</strong> will be
                    processed within 5–7 business days. We will also attempt to contact you to offer alternatives where
                    possible.
                  </p>
                </>
              ),
            },
            {
              icon: "🎁",
              title: "Digital Products — No Cancellation",
              body: (
                <p>
                  Digital products (gift cards, digital vouchers, downloadable content) are fulfilled electronically
                  upon successful payment. As delivery is instantaneous, cancellations are <strong>not accepted</strong>{" "}
                  once payment is confirmed. Please review your order carefully before completing payment for digital
                  products. Contact{" "}
                  <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">
                    official@tryby.in
                  </a>{" "}
                  if you believe there has been an error.
                </p>
              ),
            },
            {
              icon: "🏪",
              title: "Marketplace / Supplier Orders",
              body: (
                <p>
                  For orders fulfilled by third-party Suppliers on the TRYBY marketplace, the same 1-hour
                  cancellation window applies. Once a Supplier has confirmed and dispatched the order, cancellation
                  is not possible. TRYBY mediates all disputes between customers and Suppliers. If a Supplier is
                  unable to fulfil your order, a full refund will be processed automatically.
                </p>
              ),
            },
            {
              icon: "🔄",
              title: "Alternative to Cancellation",
              body: (
                <>
                  <p>
                    If you&apos;ve missed the cancellation window, you still have options:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>
                      <strong>Refuse delivery:</strong> If the courier attempts delivery, you may refuse acceptance.
                      The item will be returned to our warehouse and a refund (minus original shipping charges) will
                      be processed.
                    </li>
                    <li>
                      <strong>Return after delivery:</strong> Initiate a return within 7 days of delivery under our{" "}
                      <a href="/returns" className="underline hover:text-[#F5C518]">Returns Policy</a> (subject to
                      eligibility).
                    </li>
                    <li>
                      <strong>Exchange:</strong> Request a size or colour exchange via My Account → Orders.
                    </li>
                  </ul>
                </>
              ),
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="flex gap-4 bg-white rounded-[20px] p-5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-2">{title}</h3>
                <div className="text-[13px] text-[#555] leading-relaxed">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-[#FFF9E6] border border-[#F5C518]/40 px-5 py-4">
          <p className="text-[13px] font-semibold text-[#7A6000] mb-1">Need to cancel an order?</p>
          <p className="text-[13px] text-[#7A6000]">
            Email{" "}
            <a href="mailto:official@tryby.in" className="underline font-semibold">
              official@tryby.in
            </a>{" "}
            with your Order ID as quickly as possible. We respond within business hours. For policy questions,
            visit our{" "}
            <a href="/faq" className="underline font-semibold">
              FAQ
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
