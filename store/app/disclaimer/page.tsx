import type { Metadata } from "next";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Disclaimer | TRYBY Sports",
  description: "Legal disclaimer for TRYBY Sports — product information accuracy, liability limitations, and third-party content.",
  alternates: { canonical: `${BASE}/disclaimer` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Disclaimer | TRYBY Sports",
    description: "Legal disclaimer for TRYBY Sports — product accuracy, liability limits, and third-party service notices.",
    url: `${BASE}/disclaimer`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports Disclaimer" }],
  },
  twitter: {
    card: "summary",
    title: "Disclaimer | TRYBY Sports",
    description: "Legal disclaimer for TRYBY Sports — liability and product accuracy.",
    site: "@trybysports",
  },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1 className="text-[32px] font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Disclaimer
        </h1>
        <p className="text-[13px] text-[#888] mb-10">Last updated: 4 June 2025</p>

        <div className="space-y-8 text-[14px] text-[#555] leading-relaxed">
          <Section title="1. General Information Only">
            <p>
              The content published on TRYBY Sports (<strong>www.tryby.in</strong>) — including product descriptions,
              size guides, care instructions, and any editorial content — is provided for general informational and
              commercial purposes only. While we make every effort to ensure accuracy, we make no representations or
              warranties of any kind, express or implied, about the completeness, accuracy, reliability, or
              suitability of the information on this website.
            </p>
          </Section>

          <Section title="2. Product Information">
            <p>
              All product images, colours, and descriptions on TRYBY Sports are as accurate as commercially reasonable.
              However, actual product colours may differ slightly from what appears on your screen due to variations
              in display calibration, monitor settings, and photography conditions. Such differences do not constitute
              a defect or misrepresentation.
            </p>
            <p className="mt-3">
              Size guides are provided as a general reference. Fit may vary based on individual body shape, fabric
              composition, and washing instructions. TRYBY is not liable for incorrect size selections made by the
              customer; however, size exchanges are available under our{" "}
              <a href="/returns" className="underline hover:text-[#F5C518]">Returns &amp; Refunds Policy</a>.
            </p>
          </Section>

          <Section title="3. Licensed Merchandise Disclaimer">
            <p>
              Products marked as <strong>&ldquo;Official Licensed&rdquo;</strong> on TRYBY Sports are sold under licence from the
              respective sports body, club, or rights holder. TRYBY Sports is an authorised reseller of such
              products and does not claim ownership of the underlying intellectual property (team logos, player
              likenesses, etc.), which remain the property of their respective owners.
            </p>
            <p className="mt-3">
              Products marked as <strong>&ldquo;Fan Edition&rdquo;</strong> are high-quality fan replica merchandise and are clearly
              distinguished from official licensed products. TRYBY makes no claim that Fan Edition products are
              endorsed by, affiliated with, or officially licensed by any sports organisation.
            </p>
          </Section>

          <Section title="4. Pricing &amp; Availability">
            <p>
              Prices displayed on TRYBY Sports are inclusive of applicable GST and are subject to change without
              notice. Despite our best efforts, errors in pricing may occasionally occur. In the event of a pricing
              error, we reserve the right to cancel the order and issue a full refund. We are not obligated to fulfil
              an order placed at an erroneous price.
            </p>
            <p className="mt-3">
              Product availability is subject to stock levels. TRYBY does not guarantee that any listed product
              will be available at the time of order.
            </p>
          </Section>

          <Section title="5. No Professional Advice">
            <p>
              Nothing on TRYBY Sports constitutes legal, financial, medical, fitness, or professional advice of any
              kind. Any fitness or sports-related tips or recommendations published as content are for general
              informational purposes only and are not a substitute for advice from a qualified professional.
            </p>
          </Section>

          <Section title="6. Third-Party Links &amp; Services">
            <p>
              TRYBY Sports may include links to external websites, services, or resources including Razorpay, courier
              tracking portals, or social media platforms. These links are provided solely for convenience. TRYBY
              does not endorse, control, or take responsibility for the content, privacy policies, or practices of
              any third-party website. We recommend reviewing the privacy policy and terms of each third-party site
              you visit.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable Indian law, TRYBY Sports, its founders, employees, and
              service providers shall not be liable for:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Any direct, indirect, incidental, special, or consequential damages arising from the use of this website</li>
              <li>Errors or inaccuracies in product descriptions or content</li>
              <li>Delays or failures in delivery caused by third-party courier partners or force majeure events</li>
              <li>Any loss or damage resulting from unauthorised access to your personal data where you have failed to safeguard your credentials</li>
              <li>Temporary unavailability or technical errors on the website</li>
            </ul>
            <p className="mt-3">
              Our total liability to any customer shall not exceed the value of the specific order in dispute. Nothing
              in this Disclaimer limits or excludes liability for fraud, death, personal injury caused by negligence,
              or any liability that cannot be excluded under applicable law including the Consumer Protection Act, 2019.
            </p>
          </Section>

          <Section title="8. Governing Law">
            <p>
              This Disclaimer is governed by the laws of India. Any disputes arising from or in connection with
              this Disclaimer shall be subject to the exclusive jurisdiction of the courts in Kerala, India.
            </p>
          </Section>

          <Section title="9. Updates">
            <p>
              TRYBY Sports reserves the right to update or modify this Disclaimer at any time without prior notice.
              Changes are effective immediately upon publication. Continued use of the website constitutes acceptance
              of the revised Disclaimer.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For questions regarding this Disclaimer, contact us at{" "}
              <a href="mailto:official@tryby.in" className="underline hover:text-[#F5C518]">official@tryby.in</a> or
              visit our <a href="/contact" className="underline hover:text-[#F5C518]">Contact page</a>.
            </p>
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
