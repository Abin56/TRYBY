import type { Metadata } from "next";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Returns & Refunds | TRYBY Sports",
  description: "TRYBY Sports 7-day easy returns and refund policy. Consumer Protection Act compliant.",
  alternates: { canonical: `${BASE}/returns` },
  openGraph: {
    title: "Returns & Refunds | TRYBY Sports",
    description: "7-day easy returns · Free pickup · Full refund on eligible items. Consumer Protection Act 2019 compliant.",
    url: `${BASE}/returns`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports Returns Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Returns & Refunds | TRYBY Sports",
    description: "7-day easy returns · Free pickup · Full refund on eligible items.",
    images: [`${BASE}/og-image.png`],
    site: "@trybysports",
  },
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1 className="text-[32px] font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Returns &amp; Refunds
        </h1>
        <p className="text-[13px] text-[#888] mb-4">Last updated: 4 June 2025</p>

        <div className="flex items-center gap-2 mb-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
          <span className="text-xl">✅</span>
          <p className="text-[14px] font-semibold text-[#16A34A]">7-day easy returns on all eligible products · Free pickup</p>
        </div>

        <div className="space-y-4 text-[14px] text-[#555] leading-relaxed">
          {[
            {
              icon: "📋",
              title: "Return Eligibility",
              body: (
                <>
                  <p>To be eligible for a return, the following conditions must be met:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>Return request raised <strong>within 7 days of delivery</strong></li>
                    <li>Item must be <strong>unworn and unwashed</strong></li>
                    <li>All original tags must be <strong>intact and attached</strong></li>
                    <li>Original packaging (poly bag, box) must be <strong>present</strong></li>
                    <li>Item must not have been altered, damaged, or used</li>
                  </ul>
                </>
              ),
            },
            {
              icon: "🚫",
              title: "Non-Returnable Items",
              body: (
                <>
                  <p className="mb-2">The following items are <strong>not eligible for return or refund</strong> (except in the case of manufacturing defect or wrong item delivered):</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Official licensed jerseys (IPL, FIFA, ISL, etc.) — unless defective</li>
                    <li>Sale, clearance, or promotional items explicitly marked &ldquo;No Return&rdquo;</li>
                    <li>Innerwear, socks, and similar personal hygiene products</li>
                    <li>Items damaged due to misuse, washing errors, or accidental damage by customer</li>
                    <li>Items without original tags or packaging</li>
                    <li>Gift cards and digital products</li>
                  </ul>
                </>
              ),
            },
            {
              icon: "🔄",
              title: "How to Initiate a Return",
              body: (
                <>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Log in to your TRYBY account → <strong>My Account → Orders</strong></li>
                    <li>Select the order and the specific item(s) you wish to return</li>
                    <li>Choose reason for return and upload clear photographs (required for damage/defect claims)</li>
                    <li>Submit the return request — our team reviews within <strong>24 hours</strong></li>
                    <li>Once approved, a <strong>free pickup</strong> will be arranged within 2–3 business days</li>
                    <li>Ensure the item is packed securely and hand it to the pickup agent</li>
                  </ol>
                  <p className="mt-3">
                    Alternatively, email <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a> with
                    your order number and return reason.
                  </p>
                </>
              ),
            },
            {
              icon: "🔍",
              title: "Quality Check",
              body: (
                <p>
                  All returned items go through a quality inspection at our warehouse. If the returned item does not meet
                  the eligibility criteria (e.g., tags removed, signs of wear, damage not reported at delivery), the
                  return may be <strong>rejected</strong> and the item will be sent back to you at no charge. You will be
                  notified by email of the outcome within 48 hours of receiving the return.
                </p>
              ),
            },
            {
              icon: "💰",
              title: "Refund Timeline &amp; Methods",
              body: (
                <>
                  <p className="mb-2">Once your return is received and inspected (typically 2–3 business days after pickup), refunds are processed as follows:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] border-collapse mt-1">
                      <thead>
                        <tr className="bg-[#F0F0F0] text-[#0D0D0D] font-semibold">
                          <th className="text-left px-3 py-2 rounded-tl-lg">Payment Method</th>
                          <th className="text-left px-3 py-2 rounded-tr-lg">Refund Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ECECEC]">
                        {[
                          ["Credit / Debit Card", "5–7 business days to original card"],
                          ["UPI (GPay, PhonePe, Paytm)", "2–3 business days to UPI ID"],
                          ["Net Banking", "3–5 business days to bank account"],
                          ["Wallets", "2–3 business days to wallet"],
                          ["Cash on Delivery (COD)", "5–7 business days via NEFT to provided bank account"],
                        ].map(([method, timeline]) => (
                          <tr key={method} className="bg-white">
                            <td className="px-3 py-2">{method}</td>
                            <td className="px-3 py-2 font-semibold text-[#0D0D0D]">{timeline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[12px] text-[#888]">
                    Shipping charges (if any) are non-refundable unless the return is due to our error (wrong item,
                    manufacturing defect). Bank processing timelines are indicative and may vary.
                  </p>
                </>
              ),
            },
            {
              icon: "🔁",
              title: "Exchanges",
              body: (
                <>
                  <p>
                    We support <strong>size and colour exchanges</strong> on eligible products. To request an exchange:
                  </p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1.5">
                    <li>Go to My Account → Orders → Select order → Request Exchange</li>
                    <li>Choose the reason and select the new size/colour desired</li>
                    <li>Submit — our team will review within 24 hours</li>
                  </ol>
                  <p className="mt-3">
                    Exchanges are subject to stock availability. If the desired size/colour is unavailable, we will
                    process a full refund instead. There is <strong>no extra charge</strong> for the first exchange on an
                    eligible item.
                  </p>
                </>
              ),
            },
            {
              icon: "⚠️",
              title: "Damaged, Defective, or Wrong Item",
              body: (
                <>
                  <p>
                    If you receive a damaged, defective, or wrong item, you are eligible for a full refund or
                    replacement regardless of the return window, provided you:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>Report the issue within <strong>48 hours of delivery</strong></li>
                    <li>Email <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a> with clear photographs of the defect/damage and the packaging</li>
                    <li>Do not use, wash, or alter the product before reporting</li>
                  </ul>
                  <p className="mt-3">
                    Your rights under the <strong>Consumer Protection Act, 2019</strong> apply fully and are not
                    limited by this policy.
                  </p>
                </>
              ),
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-4 bg-white rounded-[20px] p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-2">{title}</h3>
                <div className="text-[13px] text-[#555] leading-relaxed">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-[#FFF9E6] border border-[#F5C518]/40 px-5 py-4">
          <p className="text-[13px] font-semibold text-[#7A6000] mb-1">Still have questions about returns?</p>
          <p className="text-[13px] text-[#7A6000]">
            Email <a href="mailto:official@tryby.in" className="underline font-semibold">official@tryby.in</a> or visit{" "}
            <a href="/contact" className="underline font-semibold">Contact Us</a>. We respond within 24 business hours.
          </p>
        </div>
      </div>
    </div>
  );
}
