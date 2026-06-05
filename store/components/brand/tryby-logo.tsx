/**
 * TRYBY Official Logo System
 *
 * Variants:
 *   "horizontal" — [Shield+T]  TRYBY / SPORTS STORE  (navbar, footer, desktop)
 *   "stacked"    — Shield+T above TRYBY / SPORTS STORE (splash, auth, maintenance)
 *   "icon"       — Shield+T only (favicon, mobile menu badge, PWA)
 *
 * Theme:
 *   "dark"       — yellow shield, white wordmark  (dark backgrounds)
 *   "light"      — yellow shield, black wordmark  (white backgrounds)
 *   "yellow"     — all yellow  (monochrome lockup)
 */

import { cn } from "@/lib/cn";

/* ── Types ───────────────────────────────────────────────────────── */

export type LogoVariant = "horizontal" | "stacked" | "icon";
export type LogoTheme   = "dark" | "light" | "yellow";

interface TRYBYLogoProps {
  variant?:      LogoVariant;
  theme?:        LogoTheme;
  /** Shield icon size in px. Wordmark scales proportionally. */
  size?:         number;
  showSubtitle?: boolean;
  className?:    string;
  /** Extra class for the wordmark text */
  wordmarkClass?: string;
}

/* ── Master component ────────────────────────────────────────────── */

export function TRYBYLogo({
  variant      = "horizontal",
  theme        = "dark",
  size         = 36,
  showSubtitle = true,
  className,
  wordmarkClass,
}: TRYBYLogoProps) {
  const wordmarkColor  = theme === "dark"   ? "#FFFFFF"
                       : theme === "light"  ? "#0D0D0D"
                       : "#F5C518";
  const subtitleColor  = theme === "dark"   ? "rgba(255,255,255,0.5)"
                       : theme === "light"  ? "rgba(13,13,13,0.45)"
                       : "rgba(245,197,24,0.65)";

  const wordmarkSize   = size * 0.47;          // ~17px at size=36
  const subtitleSize   = size * 0.22;          // ~8px at size=36
  const gap            = size * 0.22;          // gap between icon and text

  if (variant === "icon") {
    return (
      <span className={cn("inline-flex", className)} aria-label="TRYBY Sports Store">
        <ShieldT size={size} />
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <div
        className={cn("inline-flex flex-col items-center", className)}
        aria-label="TRYBY Sports Store"
      >
        <ShieldT size={size} />
        <span
          className={cn("block text-center font-black uppercase leading-none tracking-widest mt-2", wordmarkClass)}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize:   size * 0.62,
            letterSpacing: "0.14em",
            color: wordmarkColor,
            lineHeight: 1,
          }}
        >
          TRYBY
        </span>
        {showSubtitle && (
          <span
            className="block text-center font-semibold uppercase tracking-[0.28em] mt-1"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize:   subtitleSize,
              color:      subtitleColor,
              letterSpacing: "0.28em",
            }}
          >
            SPORTS STORE
          </span>
        )}
      </div>
    );
  }

  /* ── horizontal (default) ── */
  return (
    <div
      className={cn("inline-flex items-center", className)}
      style={{ gap }}
      aria-label="TRYBY Sports Store"
    >
      <ShieldT size={size} />
      <div className="flex flex-col leading-none">
        <span
          className={cn("block font-black uppercase leading-none", wordmarkClass)}
          style={{
            fontFamily:    "'Barlow Condensed', sans-serif",
            fontSize:      wordmarkSize,
            letterSpacing: "0.12em",
            color:         wordmarkColor,
            lineHeight:    1,
          }}
        >
          TRYBY
        </span>
        {showSubtitle && (
          <span
            className="block font-semibold uppercase mt-[3px]"
            style={{
              fontFamily:    "'Barlow Condensed', sans-serif",
              fontSize:      subtitleSize,
              letterSpacing: "0.22em",
              color:         subtitleColor,
              lineHeight:    1,
            }}
          >
            SPORTS STORE
          </span>
        )}
      </div>
    </div>
  );
}

/* ── ShieldT SVG — official mark ────────────────────────────────── */
/**
 * Solid filled shield with T as SVG clip/cutout (even-odd rule).
 *
 * Reference image analysis:
 *   - Shield: solid fill, flat angled top corners, straight sides, pointed bottom
 *   - T: NEGATIVE SPACE cut from the solid shield (even-odd fill rule)
 *   - T crossbar: full width, touches both inner shield walls
 *   - T stem: thick, centered
 *   - T feet: two square blocks flanking the stem base (athletic flare)
 *   - No rounded corners — sharp/athletic geometry throughout
 *
 * Theming via `color` prop:
 *   shieldColor  — fill of the shield shape
 *   bgColor      — fill of the T cutout (must match background for "solid" look)
 *                  leave undefined for true SVG knockout (transparent cutout)
 */
export function ShieldT({
  size        = 36,
  shieldColor = "#F5C518",
  bgColor,          // if set, T is drawn as filled shapes in bgColor; else knockout via even-odd
  className,
}: {
  size?:        number;
  shieldColor?: string;
  bgColor?:     string;
  className?:   string;
}) {
  // Native canvas: 100 × 116 — clean integer grid, easy to reason about at all sizes
  const W = 100;
  const H = 116;
  const aspect = H / W; // 1.16

  // ── Shield path ──────────────────────────────────────────────────
  // Flat top with chamfered inner corners, straight sides, pointed tip
  //   Top-left corner:   (12, 4)  — chamfer to (4, 10)
  //   Top-right corner:  (88, 4)  — chamfer to (96, 10)
  //   Sides run to ~y=72 then converge to tip at (50, 112)
  const shield =
    "M50 2 L88 4 L96 10 L96 72 L50 112 L4 72 L4 10 L12 4 Z";

  // ── T mark paths (cutout / or opaque overlay) ────────────────────
  // Crossbar: y=24→38, full inner width x=10→90
  const tCrossbar = "M10 24 H90 V38 H10 Z";

  // Stem: x=40→60, y=38→76 (thick — 20 units wide on 100 grid)
  const tStem = "M40 38 H60 V76 H40 Z";

  // Left foot block: x=10→36, y=76→90
  const tFootL = "M10 76 H36 V90 H10 Z";

  // Right foot block: x=64→90, y=76→90
  const tFootR = "M64 76 H90 V90 H64 Z";

  if (bgColor) {
    // Opaque variant: solid shield + T shapes drawn on top in bgColor
    // Use this when you need "Black on White" or "White on Black"
    return (
      <svg
        width={size}
        height={size * aspect}
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <path d={shield} fill={shieldColor} />
        <path d={tCrossbar} fill={bgColor} />
        <path d={tStem}     fill={bgColor} />
        <path d={tFootL}    fill={bgColor} />
        <path d={tFootR}    fill={bgColor} />
      </svg>
    );
  }

  // Transparent knockout — even-odd fill rule punches T out of shield
  // Works perfectly on any background color
  return (
    <svg
      width={size}
      height={size * aspect}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={`${shield} ${tCrossbar} ${tStem} ${tFootL} ${tFootR}`}
        fill={shieldColor}
      />
    </svg>
  );
}

/* ── Legacy named exports (backwards compat for old imports) ─────── */
/** @deprecated Use <TRYBYLogo variant="icon" /> instead */
export function TRYBYShield({ size = 40 }: { size?: number }) {
  return <ShieldT size={size} />;
}
/** @deprecated Use <TRYBYLogo variant="horizontal" /> instead */
export function TRYBYWordmark({ className = "" }: { className?: string }) {
  return <TRYBYLogo variant="horizontal" theme="dark" size={36} className={className} />;
}
