import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "#0D0D0D",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Grid texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(232,255,71,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,255,71,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow blobs */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,255,71,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,255,71,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #E8FF47 0%, #F5C518 50%, #E8FF47 100%)",
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 80px",
            flex: 1,
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "36px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "#E8FF47",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 900,
                color: "#0D0D0D",
                letterSpacing: "-1px",
              }}
            >
              T
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "42px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "6px",
                  lineHeight: 1,
                }}
              >
                TRYBY
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "4px",
                  marginTop: "4px",
                }}
              >
                SPORTS STORE
              </span>
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 0.9,
              letterSpacing: "-2px",
              marginBottom: "8px",
            }}
          >
            India&apos;s Sports
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#E8FF47",
              lineHeight: 0.9,
              letterSpacing: "-2px",
              marginBottom: "32px",
            }}
          >
            Marketplace
          </div>

          {/* Product tags */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "40px",
            }}
          >
            {["Cricket Jerseys", "Football Kits", "Gym Wear", "Sports Accessories"].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "8px 18px",
                  borderRadius: "100px",
                  border: "1px solid rgba(232,255,71,0.35)",
                  background: "rgba(232,255,71,0.08)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                {tag}
              </div>
            ))}
          </div>

          {/* Trust stats row */}
          <div style={{ display: "flex", gap: "32px" }}>
            {[
              { val: "25K+", label: "Orders Delivered" },
              { val: "7-Day", label: "Easy Returns" },
              { val: "100%", label: "Secure Payments" },
            ].map(({ val, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#E8FF47",
                    lineHeight: 1,
                  }}
                >
                  {val}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.5)",
                    marginTop: "4px",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom domain bar */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            right: "60px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#E8FF47",
            }}
          />
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "1px",
            }}
          >
            www.tryby.in
          </span>
        </div>

        {/* Right decorative sport icons panel */}
        <div
          style={{
            position: "absolute",
            right: "60px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            opacity: 0.25,
          }}
        >
          {["🏏", "⚽", "🏋️", "🏆", "🎽"].map((emoji, i) => (
            <div
              key={i}
              style={{
                fontSize: "52px",
                lineHeight: 1,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
