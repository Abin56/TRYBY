import type { Metadata } from "next";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Terms & Conditions | TRYBY Sports",
  description: "Terms and Conditions governing your use of TRYBY Sports — the Indian sports e-commerce platform.",
  alternates: { canonical: `${BASE}/terms` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms & Conditions | TRYBY Sports",
    description: "Read the Terms & Conditions governing your use of TRYBY Sports — the premium Indian sports e-commerce platform.",
    url: `${BASE}/terms`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports Terms & Conditions" }],
  },
  twitter: {
    card: "summary",
    title: "Terms & Conditions | TRYBY Sports",
    description: "Terms & Conditions governing your use of TRYBY Sports.",
    site: "@trybysports",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1 className="text-[32px] font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-[13px] text-[#888] mb-2">Last updated: 4 June 2025</p>
        <p className="text-[13px] text-[#888] mb-10">Effective date: 4 June 2025</p>

        <div className="rounded-xl bg-[#FFF9E6] border border-[#F5C518]/40 px-5 py-4 mb-10">
          <p className="text-[13px] text-[#7A6000] leading-relaxed">
            Please read these Terms &amp; Conditions carefully before using TRYBY Sports. By accessing our website or
            placing an order, you agree to be bound by these terms. If you do not agree, please do not use our services.
          </p>
        </div>

        <div className="space-y-8 text-[14px] text-[#555] leading-relaxed">
          <Section title="1. About TRYBY Sports">
            <p>
              TRYBY Sports (&ldquo;TRYBY&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an Indian e-commerce platform
              operating at <strong>www.tryby.in</strong>, offering sports jerseys, sportswear, and related accessories.
              These Terms &amp; Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you
              (&ldquo;Customer&rdquo;, &ldquo;User&rdquo;, &ldquo;you&rdquo;) and TRYBY Sports.
            </p>
            <p className="mt-3">
              By registering an account, browsing our website, or placing an order, you confirm that you have read,
              understood, and agree to these Terms and our{" "}
              <a href="/privacy-policy" className="underline hover:text-[#F5C518]">Privacy Policy</a>.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least <strong>18 years of age</strong> to create an account or place an order.</li>
              <li>
                If you are a minor (under 18), you may use TRYBY only with the involvement and consent of a parent or
                legal guardian who agrees to these Terms on your behalf.
              </li>
              <li>You must be a resident of India or have a valid Indian delivery address.</li>
              <li>You represent that all information you provide is accurate, current, and complete.</li>
            </ul>
          </Section>

          <Section title="3. Products, Pricing &amp; Availability">
            <ul className="list-disc pl-5 space-y-2">
              <li>All prices are listed in <strong>Indian Rupees (INR)</strong> and are inclusive of applicable taxes (GST).</li>
              <li>
                Prices are subject to change without prior notice. The price applicable to your order is the price at
                the time of order placement.
              </li>
              <li>Product availability is subject to stock. We reserve the right to limit quantities.</li>
              <li>
                Product images are for illustrative purposes. Actual product colours may vary slightly due to
                photography and display settings.
              </li>
              <li>
                Products marked <strong>&ldquo;Official Licensed&rdquo;</strong> are authentic licensed merchandise. Products
                marked <strong>&ldquo;Fan Edition&rdquo;</strong> are high-quality fan replicas and are not official licensed
                products. Both are clearly labelled on product pages.
              </li>
              <li>
                We reserve the right to discontinue any product at any time without notice.
              </li>
            </ul>
          </Section>

          <Section title="4. Orders &amp; Contract Formation">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                An order placed on TRYBY constitutes an <strong>offer to purchase</strong>. A binding contract is formed
                only upon our dispatch confirmation email.
              </li>
              <li>
                We reserve the right to cancel or refuse any order for reasons including product unavailability, pricing
                errors, suspected fraud, incomplete or unverifiable delivery information, or inability to deliver to the
                specified address.
              </li>
              <li>
                If we cancel your order after payment, a full refund will be processed to your original payment method
                within 5–7 business days.
              </li>
              <li>
                Orders may be cancelled by you within <strong>1 hour of placement</strong> via the &ldquo;Cancel Order&rdquo;
                option in My Account → Orders, or by contacting official@tryby.in. Once dispatched, cancellation is
                not possible.
              </li>
            </ul>
          </Section>

          <Section title="5. Payment">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Payments are processed securely by <strong>Razorpay Payment Solutions Pvt. Ltd.</strong>, a Reserve Bank
                of India (RBI) authorised payment aggregator. We do not store your payment credentials.
              </li>
              <li>
                We accept: UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking,
                Wallets, and Cash on Delivery (COD) for orders up to ₹5,000.
              </li>
              <li>
                For COD orders, payment must be made in full to the delivery agent at the time of delivery. Refusals
                at delivery may result in your account being restricted for COD.
              </li>
              <li>
                In case of a payment failure, the order will not be processed. If money is debited from your account
                without order confirmation, it will be auto-refunded within 5–7 business days.
              </li>
              <li>
                All transactions are subject to Razorpay&apos;s terms of service and applicable RBI regulations.
              </li>
            </ul>
          </Section>

          <Section title="6. Shipping &amp; Delivery">
            <p>
              Delivery timelines and costs are detailed in our{" "}
              <a href="/shipping" className="underline hover:text-[#F5C518]">Shipping Policy</a>. Standard delivery takes
              3–5 business days; Express delivery takes 1–2 business days. Free standard shipping applies to orders
              above ₹499.
            </p>
            <p className="mt-3">
              Delivery timelines are estimates based on our courier partners&apos; schedules and are not guaranteed.
              TRYBY shall not be liable for delays caused by courier partners, natural events, strikes, or other
              circumstances beyond our control.
            </p>
            <p className="mt-3">
              Risk of loss and title for products pass to you upon delivery to the shipping address.
            </p>
          </Section>

          <Section title="7. Returns, Refunds &amp; Exchanges">
            <p>
              Our return and refund process is governed by our{" "}
              <a href="/returns" className="underline hover:text-[#F5C518]">Returns &amp; Refunds Policy</a>, which forms
              part of these Terms. Key points:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>7-day return window from date of delivery for eligible items</li>
              <li>Items must be unworn, unwashed, with tags and original packaging</li>
              <li>Official licensed jerseys, sale items, and innerwear are non-returnable</li>
              <li>Refunds processed within 5–7 business days of receiving returned item</li>
            </ul>
            <p className="mt-3">
              Your rights under the <strong>Consumer Protection Act, 2019</strong> are not limited by these Terms.
            </p>
          </Section>

          <Section title="8. User Account">
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>
                You must notify us immediately at official@tryby.in if you suspect any unauthorised use of your account.
              </li>
              <li>
                TRYBY is not liable for any loss resulting from unauthorised access to your account due to your failure
                to safeguard your credentials.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent
                activity, or misuse the platform.
              </li>
            </ul>
          </Section>

          <Section title="9. Prohibited Conduct">
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the platform for any unlawful purpose or in violation of any applicable law</li>
              <li>Place fraudulent orders or provide false personal information</li>
              <li>Attempt to circumvent security measures or gain unauthorised access to our systems</li>
              <li>Scrape, crawl, or extract data from our website without written permission</li>
              <li>
                Reproduce, duplicate, or resell any portion of our platform or content without authorisation
              </li>
              <li>Post or transmit any harmful, offensive, or unlawful content via our platform</li>
              <li>Engage in excessive COD order refusals or return abuse</li>
            </ul>
          </Section>

          <Section title="10. Intellectual Property">
            <p>
              All content on TRYBY Sports — including but not limited to the TRYBY logo, product photographs, website
              design, text, graphics, and software — is the property of TRYBY Sports or its licensors and is protected
              under Indian copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-3">
              Licensed sports merchandise (team logos, player names, etc.) is owned by the respective rights holders
              and is used under licence. Any unauthorised reproduction or commercial use is strictly prohibited.
            </p>
            <p className="mt-3">
              You may not use our trademarks or brand assets without prior written consent.
            </p>
          </Section>

          <Section title="11. Disclaimer of Warranties">
            <p>
              TRYBY Sports provides the platform and products on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis. We make no
              warranties, express or implied, regarding merchantability, fitness for a particular purpose, or
              non-infringement, except as required under the Consumer Protection Act, 2019.
            </p>
            <p className="mt-3">
              We do not warrant that the website will be error-free, uninterrupted, or free of viruses or other harmful
              components.
            </p>
          </Section>

          <Section title="12. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable Indian law, TRYBY Sports&apos; total liability to you for any
              claim arising out of or relating to these Terms or our services shall not exceed the amount you paid
              for the specific order in dispute.
            </p>
            <p className="mt-3">
              TRYBY shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
              including loss of profits, data, or business opportunities, even if we have been advised of the
              possibility of such damages.
            </p>
            <p className="mt-3">
              Nothing in these Terms limits or excludes liability for death or personal injury caused by negligence,
              fraud, or any other liability that cannot be limited under applicable law.
            </p>
          </Section>

          <Section title="13. Third-Party Links &amp; Services">
            <p>
              Our website may contain links to third-party websites or services (e.g., Razorpay, courier tracking
              portals). These are provided for convenience only. TRYBY does not endorse or control these third-party
              services and is not responsible for their content, privacy practices, or availability.
            </p>
          </Section>

          <Section title="14. Governing Law &amp; Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with the laws of <strong>India</strong>.
            </p>
            <p className="mt-3">
              In the event of any dispute, both parties shall first attempt resolution through good-faith negotiation
              within 30 days. If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts
              in <strong>Kerala, India</strong>.
            </p>
            <p className="mt-3">
              Consumers also have the right to approach the National Consumer Helpline (1800-11-4000) or file a
              complaint on the Consumer Online Resource &amp; Empowerment (CORE) portal under the Consumer Protection
              Act, 2019.
            </p>
          </Section>

          <Section title="15. Supplier Marketplace (Future Expansion)">
            <p>
              TRYBY Sports may in the future offer a marketplace platform enabling third-party sellers
              (&ldquo;Suppliers&rdquo;) to list products. When this feature is available, additional Supplier Terms will apply.
              TRYBY will act as an intermediary and shall not be liable for products sold by third-party Suppliers,
              though we will maintain quality standards and dispute resolution mechanisms as required under the
              Consumer Protection (E-Commerce) Rules, 2020.
            </p>
          </Section>

          <Section title="16. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be notified to registered
              users via email or in-app notice at least 7 days before the change takes effect. Continued use of TRYBY
              after changes constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="17. Contact Us">
            <div className="rounded-xl border border-[#E0E0E0] bg-white px-5 py-4 text-[13px] space-y-1">
              <p><strong>TRYBY Sports</strong></p>
              <p>Kerala, India</p>
              <p>Email: <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a></p>
              <p>Website: <a href="https://www.tryby.in" className="underline hover:text-[#F5C518]">www.tryby.in</a></p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[17px] font-bold text-[#0D0D0D] mb-3">{title}</h2>
      {children}
    </div>
  );
}
