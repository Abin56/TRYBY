import type { Metadata } from "next";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Shipping Policy | TRYBY Sports",
  description: "Delivery timelines, shipping costs, tracking, and coverage for TRYBY Sports orders across India.",
  alternates: { canonical: `${BASE}/shipping` },
  openGraph: {
    title: "Shipping Policy | TRYBY Sports",
    description: "Standard delivery 3–5 days (₹49), Express 1–2 days (₹149). Free shipping on orders ₹499+. Pan-India — 25,000+ pincodes.",
    url: `${BASE}/shipping`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports Shipping Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipping Policy | TRYBY Sports",
    description: "Standard delivery 3–5 days (₹49), Express 1–2 days (₹149). Free on orders ₹499+.",
    images: [`${BASE}/og-image.png`],
    site: "@trybysports",
  },
};

const SHIPPING_CARDS = [
  {
    icon: "🚚",
    title: "Standard Delivery",
    badge: "Most Popular",
    badgeColor: "#F5C518",
    details: [
      { label: "Estimated Time", value: "3–5 business days" },
      { label: "Shipping Cost", value: "₹49" },
      { label: "Free Shipping", value: "Orders above ₹499" },
      { label: "Coverage", value: "Pan-India (25,000+ pincodes)" },
    ],
  },
  {
    icon: "⚡",
    title: "Express Delivery",
    badge: "Fastest",
    badgeColor: "#0D0D0D",
    details: [
      { label: "Estimated Time", value: "1–2 business days" },
      { label: "Shipping Cost", value: "₹149" },
      { label: "Free Shipping", value: "Not applicable" },
      { label: "Coverage", value: "Major cities &amp; metros" },
    ],
  },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1 className="text-[32px] font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Shipping Policy
        </h1>
        <p className="text-[13px] text-[#888] mb-10">Last updated: 4 June 2025</p>

        {/* Delivery Options */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {SHIPPING_CARDS.map(({ icon, title, badge, badgeColor, details }) => (
            <div key={title} className="bg-white rounded-[20px] p-5 relative overflow-hidden" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <span
                className="absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{
                  background: badgeColor,
                  color: badgeColor === "#F5C518" ? "#0D0D0D" : "#F5C518",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                {badge}
              </span>
              <span className="text-3xl">{icon}</span>
              <h3 className="text-[16px] font-bold text-[#0D0D0D] mt-3 mb-3">{title}</h3>
              <div className="space-y-2">
                {details.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-[13px]">
                    <span className="text-[#888]">{label}</span>
                    <span
                      className="font-semibold text-[#0D0D0D] text-right"
                      dangerouslySetInnerHTML={{ __html: value }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info cards */}
        <div className="space-y-4 text-[14px] text-[#555] leading-relaxed">
          {[
            {
              icon: "📦",
              title: "Order Processing Time",
              body: "Orders are processed on business days (Monday to Saturday, excluding public holidays). Orders placed before 2:00 PM IST are typically dispatched the same day. Orders placed after 2:00 PM IST are dispatched the next business day. You will receive a dispatch confirmation email with a tracking number once your order ships.",
            },
            {
              icon: "📍",
              title: "Delivery Coverage",
              body: "We deliver pan-India to 25,000+ serviceable pincodes via our courier partners. Some remote or rural pincodes may not be serviceable or may experience additional delays of 1–3 business days. You can verify deliverability at checkout by entering your pincode. Delivery to J&K, Northeast states, and Andaman & Nicobar Islands may take additional time.",
            },
            {
              icon: "🔍",
              title: "Order Tracking",
              body: "Once your order is dispatched, a tracking number is sent to your registered email and mobile number. Track your shipment via My Account → Orders on our website, or directly on our courier partner's website using the tracking number provided.",
            },
            {
              icon: "⚠️",
              title: "Delivery Attempt Policy",
              body: "Our courier partner will attempt delivery up to 3 times at the provided address. After 3 failed attempts (including customer unavailability), the shipment is returned to our warehouse. Upon return, a full refund minus original shipping charges is initiated. To re-order, please update your delivery address or contact support.",
            },
            {
              icon: "🏢",
              title: "Address Accuracy",
              body: "Please ensure your delivery address is complete and accurate, including flat/house number, building name, street, area, city, state, and 6-digit PIN code. TRYBY is not responsible for non-delivery or delays caused by incomplete or incorrect addresses provided by the customer.",
            },
            {
              icon: "📦",
              title: "Packaging",
              body: "All products are securely packaged to prevent damage during transit. Products are packed in branded TRYBY packaging with tamper-evident seals. If you receive a package with visible damage or a broken seal, please photograph it before opening and contact official@tryby.in within 24 hours.",
            },
            {
              icon: "🌐",
              title: "International Shipping",
              body: "Currently, TRYBY Sports ships within India only. International shipping is not available at this time. We aim to launch international delivery in future.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-4 bg-white rounded-[20px] p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-1.5">{title}</h3>
                <p className="text-[13px] text-[#555] leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-5 py-4">
          <p className="text-[13px] font-semibold text-[#16A34A] mb-1">Need help with your delivery?</p>
          <p className="text-[13px] text-[#15803D]">
            Email us at <a href="mailto:official@tryby.in" className="underline font-semibold">official@tryby.in</a> or
            visit <a href="/contact" className="underline font-semibold">Contact Us</a>. We respond within 24 business hours.
          </p>
        </div>
      </div>
    </div>
  );
}
