import { getTrustBarContent } from "@/lib/content";
import type { TrustItem } from "@/lib/content";

// Server component — loads trust items from DB with fallback to defaults.
export async function TrustSection() {
  const items = await getTrustBarContent();
  return <TrustSectionUI items={items} />;
}

function TrustSectionUI({ items }: { items: TrustItem[] }) {
  return (
    <section
      aria-label="Trust features"
      style={{
        background: "#0D0D0D",
        borderTop: "1px solid rgba(245,197,24,0.15)",
        borderBottom: "1px solid rgba(245,197,24,0.15)",
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="trust-item group flex items-center justify-center gap-3 px-4 py-4 md:py-5 cursor-default"
              style={{
                borderRight: i < items.length - 1 ? "1px solid rgba(245,197,24,0.08)" : "none",
              }}
            >
              <div
                className="trust-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                style={{ border: "1px solid rgba(245,197,24,0.25)", background: "transparent", transition: "border-color 0.25s ease, box-shadow 0.25s ease" }}
              >
                {item.emoji}
              </div>
              <div>
                <p
                  className="text-white font-bold leading-tight tracking-wide"
                  style={{ fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif", fontSize: "14px", letterSpacing: "0.04em", textTransform: "uppercase" }}
                >
                  {item.title}
                </p>
                <p
                  className="leading-tight mt-0.5"
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif" }}
                >
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .trust-item { transition: transform 0.2s ease; }
        .trust-item:hover { transform: translateY(-2px); }
        .trust-item:hover .trust-icon { border-color: rgba(245,197,24,0.7) !important; box-shadow: 0 0 12px rgba(245,197,24,0.2); }
        @media (max-width: 767px) {
          .trust-item:nth-child(2n) { border-right: none !important; }
          .trust-item:nth-child(1), .trust-item:nth-child(2) { border-bottom: 1px solid rgba(245,197,24,0.08); }
        }
      `}</style>
    </section>
  );
}
