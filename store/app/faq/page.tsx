import type { Metadata } from "next";
import { FaqJsonLd } from "@/components/seo/json-ld";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "FAQ | TRYBY Sports",
  description: "Frequently asked questions about ordering, sizing, shipping, returns, payments, and more at TRYBY Sports.",
  alternates: { canonical: `${BASE}/faq` },
  openGraph: {
    title: "FAQ | TRYBY Sports",
    description: "All your questions about TRYBY Sports answered — orders, sizing, shipping, returns, payments, and account help.",
    url: `${BASE}/faq`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports FAQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | TRYBY Sports",
    description: "All your questions about orders, sizing, shipping, returns, and payments answered.",
    images: [`${BASE}/og-image.png`],
    site: "@trybysports",
  },
};

const FAQS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Orders & Shopping",
    items: [
      {
        q: "How do I place an order on TRYBY?",
        a: "Browse products, select your size and quantity, click 'Add to Cart', then proceed to Checkout. You'll need to log in or create a free account, enter your delivery address, choose a shipping method, and complete payment via Razorpay. You'll receive a confirmation email within minutes.",
      },
      {
        q: "Can I order without creating an account?",
        a: "Currently, an account is required to place orders so we can track your order history, process returns, and send updates. Registration is free and takes under a minute.",
      },
      {
        q: "Can I cancel my order?",
        a: "Orders can be cancelled within 1 hour of placement. Go to My Account → Orders → Cancel Order. Once dispatched, cancellation is not possible. If you miss the window, you can return the item after delivery per our 7-day Returns Policy.",
      },
      {
        q: "Can I modify my order after placing it?",
        a: "Once an order is placed, modifications (size, address, quantity) cannot be guaranteed as orders are processed quickly. Email official@tryby.in immediately with your order number and we'll try our best, but we cannot promise changes once the order is in processing.",
      },
      {
        q: "I placed an order but didn't receive a confirmation email. What should I do?",
        a: "Check your spam/junk folder first. If nothing appears within 30 minutes of payment, email official@tryby.in with your registered email and approximate order time. We'll verify and resend the confirmation.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    items: [
      {
        q: "How do I find my correct size?",
        a: "Each product page has a detailed Size Guide with chest, shoulder, and length measurements in centimetres. TRYBY follows standard Indian sizing (S/M/L/XL/XXL/XXXL). For jerseys, if you're between sizes, we recommend sizing up for a comfortable fit. You can also check the 'Fit Type' on each product (Athletic Fit vs Regular Fit).",
      },
      {
        q: "What is the difference between 'Official Licensed' and 'Fan Edition'?",
        a: "Official Licensed products are authentic merchandise produced under an official licence from the sports body or club (e.g., IPL, FIFA). They carry official holograms and licence tags. Fan Edition products are high-quality fan replicas with the same look and feel but are not official licensed products. Both types are clearly labelled on the product page.",
      },
      {
        q: "Are the products genuine and of good quality?",
        a: "Absolutely. Every product on TRYBY undergoes quality checks before dispatch. Fan Edition jerseys use premium polyester fabric designed for durability and breathability. Official Licensed items come directly from authorised distributors. We stand behind our quality — any defective product will be replaced or refunded.",
      },
      {
        q: "Do you offer customisation (name, number printing)?",
        a: "Custom name and number printing is available on select jerseys. Look for the 'Customise' option on the product page. Please note: customised items are non-returnable and non-exchangeable unless delivered with a manufacturing defect.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard Delivery: 3–5 business days (₹49, free on orders ₹499+). Express Delivery: 1–2 business days (₹149). Business days are Monday to Saturday, excluding public holidays. You'll receive a tracking link as soon as your order is dispatched.",
      },
      {
        q: "Do you deliver across all of India?",
        a: "Yes, we deliver pan-India through our courier partners. Some remote pincodes in J&K, Northeast India, and island territories may take additional time or may have limited service. You can verify delivery availability by entering your pincode at checkout.",
      },
      {
        q: "How do I track my order?",
        a: "Once dispatched, you'll receive a tracking number and link via email. You can also track in real time from My Account → Orders on the TRYBY website. If tracking hasn't updated within 48 hours of dispatch, contact official@tryby.in.",
      },
      {
        q: "What happens if I'm not available at the time of delivery?",
        a: "Our courier partner makes up to 3 delivery attempts. If all attempts fail, the shipment returns to our warehouse and a refund (minus original shipping) is processed. To avoid this, ensure your address is accurate and your phone number is reachable.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 7-day return policy from the date of delivery on eligible items. Items must be unworn, unwashed, with all original tags attached and original packaging intact. Visit My Account → Orders → Request Return to initiate the process. Free pickup is provided.",
      },
      {
        q: "Which items cannot be returned?",
        a: "Official licensed jerseys, sale/clearance items marked 'No Return', innerwear, socks, customised items, and items showing signs of use or missing tags are not eligible for return. See our full Returns Policy for details.",
      },
      {
        q: "How long does my refund take?",
        a: "Once we receive and inspect your return (2–3 business days), refunds are processed: UPI (2–3 days), Cards (5–7 days), Net Banking (3–5 days), COD via NEFT (5–7 days). You'll receive an email confirmation when the refund is initiated.",
      },
      {
        q: "Can I exchange my item for a different size?",
        a: "Yes! We support size and colour exchanges on eligible items. Go to My Account → Orders → Request Exchange, select the new size/colour. Exchanges are free and subject to stock availability. If the desired size is unavailable, we'll process a full refund.",
      },
      {
        q: "I received a damaged or wrong item. What do I do?",
        a: "Please photograph the item and the packaging immediately and email official@tryby.in within 48 hours of delivery. Include your order number and clear photos. You'll receive a full replacement or refund at no cost to you — no questions asked.",
      },
    ],
  },
  {
    category: "Payments & Security",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI (GPay, PhonePe, Paytm, BHIM UPI), Credit Cards (Visa, Mastercard, RuPay), Debit Cards, Net Banking (all major banks), Digital Wallets, and Cash on Delivery (COD) for orders up to ₹5,000.",
      },
      {
        q: "Is it safe to pay on TRYBY?",
        a: "Absolutely. All payments are processed by Razorpay, a PCI-DSS Level 1 certified payment gateway regulated by the RBI. Your card/UPI details are never stored on TRYBY's servers. All connections are encrypted with 256-bit TLS/SSL.",
      },
      {
        q: "My payment failed but money was deducted. What happens?",
        a: "If your payment failed but money was debited from your account, it will be automatically refunded by Razorpay within 5–7 business days. If you don't receive the refund, email official@tryby.in with your order number and bank statement screenshot.",
      },
      {
        q: "Do you offer EMI or Buy Now Pay Later (BNPL)?",
        a: "EMI options (No-Cost EMI on eligible cards) and BNPL are available through Razorpay at checkout, subject to bank and wallet eligibility. Look for the 'EMI' option in the payment screen.",
      },
    ],
  },
  {
    category: "Account & Support",
    items: [
      {
        q: "How do I contact TRYBY customer support?",
        a: "Email us at official@tryby.in — we respond within 24 business hours (Mon–Sat). For urgent queries, WhatsApp support is available Mon–Sat, 10am–6pm IST (number available on our Contact page).",
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page and enter your registered email. You'll receive a password reset link within a few minutes. Check your spam folder if you don't see it.",
      },
      {
        q: "How do I delete my account?",
        a: "To delete your account and personal data, email official@tryby.in with your registered email and a request for account deletion. We'll process your request within 30 days as per the DPDP Act, 2023. Note: order records may be retained for statutory compliance.",
      },
    ],
  },
];

// Flatten all FAQ items for JSON-LD structured data
const FAQ_SCHEMA_ITEMS = FAQS.flatMap((section) =>
  section.items.map(({ q, a }) => ({ question: q, answer: a }))
);

export default function FAQPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <FaqJsonLd items={FAQ_SCHEMA_ITEMS} />
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1 className="text-[32px] font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Frequently Asked Questions
        </h1>
        <p className="text-[14px] text-[#888] mb-10">
          Everything you need to know about TRYBY Sports. Can&apos;t find your answer?{" "}
          <a href="/contact" className="text-[#0D0D0D] font-semibold underline hover:text-[#F5C518]">Contact us</a>.
        </p>

        <div className="space-y-8">
          {FAQS.map(({ category, items }) => (
            <div key={category}>
              <h2
                className="text-[11px] font-black uppercase tracking-[0.18em] text-[#888] mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {category}
              </h2>
              <div className="space-y-2">
                {items.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group bg-white rounded-[16px] overflow-hidden"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none text-[14px] font-bold text-[#0D0D0D] hover:bg-[#FAFAFA] transition-colors">
                      <span className="pr-4">{q}</span>
                      <span className="text-[#F5C518] text-lg shrink-0 transition-transform duration-200 group-open:rotate-45">+</span>
                    </summary>
                    <p className="px-5 pb-5 pt-1 text-[13px] text-[#555] leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-[20px] p-6 text-center" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-[16px] font-bold text-[#0D0D0D] mb-1">Still have a question?</p>
          <p className="text-[13px] text-[#888] mb-4">We&apos;re here to help. Reach us via email or WhatsApp.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="mailto:official@tryby.in"
              className="inline-flex h-10 items-center px-5 rounded-full font-bold text-[13px] text-[#0D0D0D] hover:opacity-85 transition-opacity"
              style={{ background: "#F5C518" }}
            >
              Email Support
            </a>
            <a
              href="/contact"
              className="inline-flex h-10 items-center px-5 rounded-full font-bold text-[13px] text-[#0D0D0D] border-2 border-[#E0E0E0] hover:border-[#F5C518] transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
