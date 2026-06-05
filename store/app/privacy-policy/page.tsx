import type { Metadata } from "next";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Privacy Policy | TRYBY Sports",
  description: "TRYBY Sports Privacy Policy — how we collect, use, and protect your personal data under the Digital Personal Data Protection Act, 2023.",
  alternates: { canonical: `${BASE}/privacy-policy` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | TRYBY Sports",
    description: "How TRYBY Sports collects, uses, and protects your personal data — DPDP Act 2023 compliant.",
    url: `${BASE}/privacy-policy`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports Privacy Policy" }],
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | TRYBY Sports",
    description: "How TRYBY Sports handles your personal data — DPDP Act 2023 compliant.",
    site: "@trybysports",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1 className="text-[32px] font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Privacy Policy
        </h1>
        <p className="text-[13px] text-[#888] mb-2">Last updated: 5 June 2025</p>
        <p className="text-[13px] text-[#888] mb-10">Effective date: 5 June 2025</p>

        <div className="rounded-xl bg-[#FFF9E6] border border-[#F5C518]/40 px-5 py-4 mb-10">
          <p className="text-[13px] text-[#7A6000] leading-relaxed">
            This Privacy Policy is in compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>, the
            Information Technology Act, 2000, and applicable rules under Indian law. By using TRYBY Sports, you consent
            to the practices described herein.
          </p>
        </div>

        <div className="space-y-8 text-[14px] text-[#555] leading-relaxed">
          <Section title="1. Who We Are">
            <p>
              TRYBY Sports (&ldquo;TRYBY&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an Indian e-commerce platform operating at{" "}
              <strong>www.tryby.in</strong>, offering sports jerseys, sportswear, and related accessories to customers
              across India. Our registered business is located in <strong>Kerala, India</strong>.
            </p>
            <p className="mt-3">
              For privacy matters, contact our Data Fiduciary at: <strong>official@tryby.in</strong>
            </p>
          </Section>

          <Section title="2. Personal Data We Collect">
            <p className="mb-3">We collect personal data only to the extent necessary to fulfil the purposes described below:</p>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-[#0D0D0D] mb-1">2.1 Data You Provide Directly</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Account registration:</strong> Full name, email address, mobile number, password (hashed)</li>
                  <li><strong>Order placement:</strong> Shipping address (building, street, city, state, PIN code), billing details</li>
                  <li><strong>Customer support:</strong> Messages, order references, photographs of products (for return requests)</li>
                  <li><strong>Promotional opt-in:</strong> Email or WhatsApp number (with explicit consent)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[#0D0D0D] mb-1">2.2 Data Collected Automatically</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>IP address, browser type, device type, operating system</li>
                  <li>Pages visited, time spent, referring URL, clickstream data</li>
                  <li>Cookie identifiers (see our <a href="/cookies" className="underline text-[#0D0D0D] hover:text-[#F5C518]">Cookie Policy</a>)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[#0D0D0D] mb-1">2.3 Payment Data</p>
                <p>
                  All payment transactions are processed by <strong>Razorpay Payment Solutions Pvt. Ltd.</strong>, a PCI‑DSS
                  Level 1 certified payment gateway. TRYBY does not store card numbers, CVV, UPI credentials, or net
                  banking details on its servers. Razorpay&apos;s own privacy policy governs payment data.
                </p>
              </div>
            </div>
          </Section>

          <Section title="3. Purposes of Processing">
            <p className="mb-3">We process your personal data for the following purposes and lawful bases:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#F0F0F0] text-[#0D0D0D] font-semibold">
                    <th className="text-left px-4 py-2.5 rounded-tl-lg">Purpose</th>
                    <th className="text-left px-4 py-2.5 rounded-tr-lg">Lawful Basis (DPDP Act)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECEC]">
                  {[
                    ["Process and fulfil orders", "Performance of contract"],
                    ["Send order confirmations, dispatch alerts, delivery updates", "Performance of contract"],
                    ["Facilitate payment processing via Razorpay", "Performance of contract"],
                    ["Provide customer support and resolve disputes", "Legitimate interest"],
                    ["Detect and prevent fraud, chargebacks, and abuse", "Legitimate interest / Legal obligation"],
                    ["Send promotional communications (newsletters, offers)", "Consent (opt-in only)"],
                    ["Improve website functionality and user experience", "Legitimate interest"],
                    ["Comply with legal obligations (GST, IT Act, court orders)", "Legal obligation"],
                  ].map(([p, b]) => (
                    <tr key={p} className="bg-white">
                      <td className="px-4 py-2.5">{p}</td>
                      <td className="px-4 py-2.5 font-semibold text-[#0D0D0D]">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Digital Products">
            <p>
              Where TRYBY offers digital products (gift cards, downloadable content, digital vouchers), the following applies:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                Digital product purchases are fulfilled electronically and are <strong>non-refundable</strong> once
                delivered to your registered email or account.
              </li>
              <li>
                We retain a record of digital product transactions for billing, tax, and fraud prevention purposes for
                the same duration as physical order records.
              </li>
              <li>
                Redemption data (e.g., whether a gift card has been used) is stored to prevent duplicate claims.
              </li>
            </ul>
          </Section>

          <Section title="4a. Supplier Marketplace">
            <p>
              TRYBY may operate as a marketplace enabling third-party sellers (&ldquo;Suppliers&rdquo;) to list products. In that context:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                Supplier business data (GST number, bank details, product catalogues) is collected to operate the
                marketplace and process payouts.
              </li>
              <li>
                Customer data is shared with Suppliers <strong>only</strong> to the extent required to fulfil an order
                (e.g., delivery address). Suppliers are contractually bound not to use customer data for independent
                marketing.
              </li>
              <li>
                TRYBY acts as an intermediary under the Consumer Protection (E-Commerce) Rules, 2020 and conducts
                due diligence on Supplier onboarding.
              </li>
            </ul>
          </Section>

          <Section title="6. Sharing of Personal Data">
            <p className="mb-3">
              We do not sell, rent, or trade your personal data. We share data only as necessary with these categories of
              service providers who are bound by confidentiality obligations:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Payment processor:</strong> Razorpay Payment Solutions Pvt. Ltd. (payment authorisation, fraud detection — PCI-DSS Level 1 certified)</li>
              <li><strong>Courier &amp; logistics partners:</strong> For order delivery and tracking (name, phone, address)</li>
              <li><strong>Cloud infrastructure:</strong> Vercel Inc. (hosting), Neon (database)</li>
              <li><strong>Email / communication services:</strong> Resend (transactional and support emails)</li>
              <li><strong>Media hosting:</strong> Cloudinary Inc. (product images — no personal customer data shared)</li>
              <li><strong>Analytics:</strong> Google Analytics (anonymised, aggregated data only)</li>
              <li><strong>Legal authorities:</strong> When required by Indian law, court order, or government directive</li>
            </ul>
            <p className="mt-3">
              Where we share data with processors outside India, we ensure appropriate safeguards per the DPDP Act, 2023.
            </p>
          </Section>

          <Section title="6a. Payment Disclaimer">
            <p>
              All payment transactions are processed by <strong>Razorpay Payment Solutions Pvt. Ltd.</strong>, a
              PCI-DSS Level 1 certified gateway authorised by the Reserve Bank of India (RBI).
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>TRYBY Sports does <strong>not</strong> store card numbers, CVV codes, UPI PINs, or net banking credentials.</li>
              <li>All connections use TLS 1.2 / 1.3 (256-bit SSL) encryption.</li>
              <li>
                TRYBY will <strong>never</strong> ask for your OTP, payment credentials, or password via email,
                phone, SMS, or any other channel. Report any such request to{" "}
                <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a> immediately.
              </li>
              <li>
                Failed payment refunds are handled by Razorpay&apos;s automated reversal process within 5–7 business
                days. TRYBY has no control over the timeline of bank-side reversals.
              </li>
            </ul>
          </Section>

          <Section title="7. Data Retention">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account data:</strong> Retained while the account is active and for 3 years after closure</li>
              <li><strong>Order records:</strong> 7 years (required under Indian GST and accounting laws)</li>
              <li><strong>Customer support logs:</strong> 2 years from resolution</li>
              <li><strong>Marketing consent records:</strong> Until consent is withdrawn, plus 1 year</li>
              <li><strong>Cookie / analytics data:</strong> Up to 26 months (Google Analytics default)</li>
              <li><strong>Supplier business data:</strong> Duration of supplier agreement + 7 years</li>
            </ul>
          </Section>

          <Section title="8. Cookies and Tracking">
            <p>
              We use cookies and similar technologies to operate the website, remember your cart, and understand how
              visitors use our platform. Please read our{" "}
              <a href="/cookies" className="underline text-[#0D0D0D] hover:text-[#F5C518]">Cookie Policy</a> for full
              details and opt-out instructions.
            </p>
          </Section>

          <Section title="9. Data Security">
            <ul className="list-disc pl-5 space-y-2">
              <li>All data in transit is encrypted using TLS 1.2 / 1.3 (256-bit SSL)</li>
              <li>Passwords are hashed using bcrypt and never stored in plaintext</li>
              <li>Database access is restricted to authorised personnel only via role-based access control</li>
              <li>Razorpay is PCI-DSS Level 1 certified; we rely on their infrastructure for payment security</li>
              <li>Regular security reviews of third-party integrations are conducted</li>
            </ul>
            <p className="mt-3">
              In the event of a data breach that is likely to result in harm, we will notify affected users and the
              relevant authority as required under the DPDP Act, 2023.
            </p>
          </Section>

          <Section title="10. User Account Policy">
            <ul className="list-disc pl-5 space-y-2">
              <li>Each user may hold only one active account. Duplicate accounts may be merged or removed.</li>
              <li>You are responsible for maintaining the confidentiality of your credentials and all activity under your account.</li>
              <li>
                Accounts inactive for more than <strong>24 months</strong> may be deactivated after 30 days&apos; notice
                to the registered email.
              </li>
              <li>
                To delete your account, email{" "}
                <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a>{" "}
                with subject &ldquo;Account Deletion Request&rdquo;. Processed within 30 days. Order history required for
                statutory compliance will be retained per Section 7.
              </li>
              <li>TRYBY reserves the right to suspend or terminate accounts that violate our Terms of Service.</li>
            </ul>
          </Section>

          <Section title="11. Your Rights as a Data Principal">
            <p className="mb-3">Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access:</strong> Obtain a summary of your personal data we process</li>
              <li><strong>Correction &amp; Completeness:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Grievance Redressal:</strong> Register a complaint with our designated Grievance Officer</li>
              <li><strong>Nomination:</strong> Nominate an individual to exercise your rights in the event of death or incapacity</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any right, email{" "}
              <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a>{" "}
              with subject <strong>&ldquo;Data Privacy Request&rdquo;</strong> and your registered account details. We will
              respond within <strong>30 days</strong>.
            </p>
          </Section>

          <Section title="12. Children's Privacy">
            <p>
              TRYBY Sports is not directed at children under 18 years of age. We do not knowingly collect personal data
              from minors. If we become aware that we have inadvertently collected data from a child, we will delete it
              promptly. If you believe your child has provided us personal data, contact us immediately at{" "}
              <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a>.
            </p>
          </Section>

          <Section title="13. International Data Transfers">
            <p>
              Some third-party providers (Vercel, Cloudinary, Google) may process data outside India. We only use
              processors that provide adequate data protection guarantees through standard contractual clauses or
              equivalent frameworks aligned with the DPDP Act, 2023.
            </p>
          </Section>

          <Section title="14. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. We will notify registered users of material changes by
              email at least <strong>7 days before</strong> they take effect. The &ldquo;Last Updated&rdquo; date at the top of
              this page indicates when the policy was last revised. Continued use of TRYBY after changes constitutes
              acceptance of the revised policy.
            </p>
          </Section>

          <Section title="15. Grievance Officer">
            <p>
              In accordance with the IT Act, 2000, and the DPDP Act, 2023, the details of our Grievance Officer are:
            </p>
            <div className="mt-3 rounded-xl border border-[#E0E0E0] bg-white px-5 py-4 text-[13px] space-y-1">
              <p><strong>Name:</strong> Abin John</p>
              <p><strong>Designation:</strong> Founder &amp; Grievance Officer, TRYBY Sports</p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a>
              </p>
              <p><strong>Address:</strong> TRYBY Sports, Kerala, India</p>
              <p><strong>Response time:</strong> Within 30 days of receipt of complaint</p>
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
