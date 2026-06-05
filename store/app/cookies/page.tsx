import type { Metadata } from "next";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Cookie Policy | TRYBY Sports",
  description: "TRYBY Sports Cookie Policy — what cookies we use, why, and how you can control them.",
  alternates: { canonical: `${BASE}/cookies` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Cookie Policy | TRYBY Sports",
    description: "What cookies TRYBY Sports uses, why we use them, and how you can control your preferences.",
    url: `${BASE}/cookies`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "TRYBY Sports Cookie Policy" }],
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy | TRYBY Sports",
    description: "What cookies TRYBY Sports uses and how to control them.",
    site: "@trybysports",
  },
};

const COOKIE_TABLE = [
  {
    name: "session_token",
    type: "Essential",
    purpose: "Keeps you logged in during your visit",
    duration: "Session (deleted when browser closes)",
    provider: "TRYBY Sports",
  },
  {
    name: "cart_id",
    type: "Essential",
    purpose: "Remembers your shopping cart contents",
    duration: "30 days",
    provider: "TRYBY Sports",
  },
  {
    name: "__rzp_*",
    type: "Essential",
    purpose: "Razorpay payment gateway — fraud detection and session management",
    duration: "Session",
    provider: "Razorpay",
  },
  {
    name: "_vercel_*",
    type: "Functional",
    purpose: "Vercel Edge Network — performance routing and analytics",
    duration: "Session / 24 hours",
    provider: "Vercel Inc.",
  },
  {
    name: "pref_theme",
    type: "Functional",
    purpose: "Remembers your display preferences",
    duration: "1 year",
    provider: "TRYBY Sports",
  },
  {
    name: "_ga, _gid",
    type: "Analytics",
    purpose: "Google Analytics — anonymised site usage and traffic analysis",
    duration: "2 years / 24 hours",
    provider: "Google LLC",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[760px] mx-auto px-4 py-16">
        <h1 className="text-[32px] font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Cookie Policy
        </h1>
        <p className="text-[13px] text-[#888] mb-10">Last updated: 4 June 2025</p>

        <div className="space-y-8 text-[14px] text-[#555] leading-relaxed">
          <Section title="1. What Are Cookies?">
            <p>
              Cookies are small text files that a website places on your device (computer, smartphone, or tablet) when
              you visit it. They are widely used to make websites work efficiently, provide functionality, and give
              website owners information about how users interact with their site.
            </p>
            <p className="mt-3">
              Similar technologies include web beacons, pixels, local storage, and session storage. This policy covers
              all such technologies collectively referred to as &ldquo;cookies&rdquo;.
            </p>
          </Section>

          <Section title="2. How We Use Cookies">
            <p className="mb-4">TRYBY Sports uses cookies for the following purposes:</p>

            <div className="space-y-4">
              {[
                {
                  type: "Essential Cookies",
                  color: "#DC2626",
                  bg: "#FEF2F2",
                  border: "#FECACA",
                  desc: "These cookies are strictly necessary for the website to function and cannot be switched off. They are set in response to actions you take, such as logging in or adding items to your cart. Without these cookies, the services you request cannot be provided.",
                },
                {
                  type: "Functional Cookies",
                  color: "#D97706",
                  bg: "#FFFBEB",
                  border: "#FDE68A",
                  desc: "These cookies allow the website to remember choices you make (such as display preferences) and provide enhanced, personalised features. Disabling them may affect some website functionality.",
                },
                {
                  type: "Analytics Cookies",
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  border: "#BFDBFE",
                  desc: "These cookies collect information about how visitors use our website — which pages are visited most often, where users come from, and how they interact with the site. All data is aggregated and anonymised. This helps us improve our website. We use Google Analytics for this purpose.",
                },
              ].map(({ type, color, bg, border, desc }) => (
                <div key={type} className="rounded-xl px-5 py-4" style={{ background: bg, border: `1px solid ${border}` }}>
                  <p className="font-bold mb-1" style={{ color }}>{type}</p>
                  <p className="text-[13px] text-[#555]">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="3. Cookies We Use">
            <p className="mb-4">Below is a list of the main cookies set on TRYBY Sports:</p>
            <div className="overflow-x-auto rounded-xl border border-[#E0E0E0]">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#F0F0F0] text-[#0D0D0D] font-semibold">
                    <th className="text-left px-3 py-2.5">Cookie Name</th>
                    <th className="text-left px-3 py-2.5">Type</th>
                    <th className="text-left px-3 py-2.5">Purpose</th>
                    <th className="text-left px-3 py-2.5">Duration</th>
                    <th className="text-left px-3 py-2.5">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECEC]">
                  {COOKIE_TABLE.map((row) => (
                    <tr key={row.name} className="bg-white">
                      <td className="px-3 py-2.5 font-mono text-[11px]">{row.name}</td>
                      <td className="px-3 py-2.5 font-semibold text-[#0D0D0D]">{row.type}</td>
                      <td className="px-3 py-2.5">{row.purpose}</td>
                      <td className="px-3 py-2.5">{row.duration}</td>
                      <td className="px-3 py-2.5">{row.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Third-Party Cookies">
            <p>
              Some cookies are placed by third-party services that appear on our pages. These include:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Razorpay:</strong> Payment security and fraud prevention. Governed by{" "}
                <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F5C518]">Razorpay&apos;s Privacy Policy</a>.
              </li>
              <li>
                <strong>Google Analytics:</strong> Anonymised usage analytics. Governed by{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F5C518]">Google&apos;s Privacy Policy</a>.
                You can opt out using{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F5C518]">Google Analytics Opt-out Browser Add-on</a>.
              </li>
              <li>
                <strong>Vercel:</strong> Edge performance and routing. Governed by{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F5C518]">Vercel&apos;s Privacy Policy</a>.
              </li>
            </ul>
          </Section>

          <Section title="5. How to Control Cookies">
            <p className="mb-3">
              You have the right to accept or decline non-essential cookies. Here is how you can manage them:
            </p>
            <div className="space-y-3">
              {[
                {
                  title: "Browser Settings",
                  desc: "Most browsers allow you to view, manage, and delete cookies via settings. Common paths: Chrome → Settings → Privacy & Security → Cookies; Firefox → Preferences → Privacy & Security; Safari → Preferences → Privacy.",
                },
                {
                  title: "Opt Out of Google Analytics",
                  desc: "Install the Google Analytics Opt-out Browser Add-on available at tools.google.com/dlpage/gaoptout to prevent your data from being used by Google Analytics.",
                },
                {
                  title: "Do Not Track",
                  desc: "Some browsers have a 'Do Not Track' (DNT) setting. TRYBY Sports respects DNT signals where technically feasible, though not all third-party services honour them.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-xl border border-[#E0E0E0] bg-white px-4 py-3">
                  <p className="font-semibold text-[#0D0D0D] mb-1">{title}</p>
                  <p className="text-[13px]">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px]">
              <strong>Note:</strong> Disabling essential cookies will prevent core website functionality including
              login and the shopping cart from working correctly.
            </p>
          </Section>

          <Section title="6. Updates to This Policy">
            <p>
              We may update this Cookie Policy from time to time. Changes will be reflected on this page with a
              revised &ldquo;Last Updated&rdquo; date. We encourage you to review this page periodically.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              For questions about our use of cookies, email{" "}
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
