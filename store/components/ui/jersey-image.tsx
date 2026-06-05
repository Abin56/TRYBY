"use client";

import { useState } from "react";

/* ── Colour palette per club/country ────────────────────────── */

const PALETTE: Record<string, { bg: string; stripe: string; text: string }> = {
  // Football clubs
  "barcelona":       { bg: "#A50044", stripe: "#004D98", text: "#fff" },
  "real-madrid":     { bg: "#FFFFFF", stripe: "#00529F", text: "#00529F" },
  "manchester-united":{ bg: "#DA291C", stripe: "#FFE500", text: "#fff" },
  "chelsea":         { bg: "#034694", stripe: "#034694", text: "#fff" },
  "arsenal":         { bg: "#EF0107", stripe: "#EF0107", text: "#fff" },
  "liverpool":       { bg: "#C8102E", stripe: "#00B2A9", text: "#fff" },
  "ac-milan":        { bg: "#FB090B", stripe: "#000000", text: "#fff" },
  // National teams
  "portugal":        { bg: "#006600", stripe: "#FF0000", text: "#fff" },
  "argentina":       { bg: "#75AADB", stripe: "#FFFFFF",  text: "#002d78" },
  "brazil":          { bg: "#FFDF00", stripe: "#009C3B",  text: "#002776" },
  "france":          { bg: "#002395", stripe: "#ED2939",  text: "#fff" },
  "germany":         { bg: "#FFFFFF", stripe: "#000000",  text: "#000" },
  "india":           { bg: "#0033A0", stripe: "#FF671F",  text: "#fff" },
  // IPL clubs
  "csk":             { bg: "#F9CD05", stripe: "#0081E9",  text: "#000" },
  "mumbai-indians":  { bg: "#004BA0", stripe: "#D1AB3E",  text: "#fff" },
  "rcb":             { bg: "#2B2A29", stripe: "#EC1C24",  text: "#fff" },
};

function getColors(slug: string) {
  // Try direct match
  for (const [key, val] of Object.entries(PALETTE)) {
    if (slug.includes(key)) return val;
  }
  // Fallback
  return { bg: "#1A1A2E", stripe: "#F5C518", text: "#fff" };
}

/* ── SVG Jersey Silhouette ───────────────────────────────────── */

function JerseySVG({ bg, stripe, text: _text, label }: {
  bg: string; stripe: string; text: string; label: string;
}) {
  return (
    <svg
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label={label}
    >
      {/* Background */}
      <rect width="200" height="220" fill="#F8F8F8" />

      {/* Jersey body */}
      <path
        d="M60 50 L20 80 L35 95 L55 80 L55 170 L145 170 L145 80 L165 95 L180 80 L140 50 Q130 40 115 38 Q108 55 100 55 Q92 55 85 38 Q70 40 60 50Z"
        fill={bg}
      />

      {/* Centre stripe */}
      <path
        d="M93 38 Q100 55 107 38 L107 170 L93 170Z"
        fill={stripe}
        opacity="0.6"
      />

      {/* Collar */}
      <ellipse cx="100" cy="38" rx="14" ry="7" fill={stripe} opacity="0.9" />

      {/* Subtle shadow at bottom */}
      <rect x="55" y="168" width="90" height="4" rx="2" fill="#00000015" />
    </svg>
  );
}

/* ── Public component ────────────────────────────────────────── */

type Props = {
  src: string;
  alt: string;
  slug?: string;
  className?: string;
};

export function JerseyImage({ src, alt, slug = "", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const colors = getColors(slug);

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-[#F8F8F8] ${className}`}>
        <JerseySVG {...colors} label={alt} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
