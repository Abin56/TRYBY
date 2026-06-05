/**
 * Generates all favicon assets from the TRYBY shield SVG.
 * Uses sharp (bundled with Next.js) — no extra installs needed.
 *
 * Run:  node scripts/generate-favicons.mjs
 * Output: public/  (all PNG + ICO files)
 *         app/icon.png  (Next.js App Router auto-detection)
 */

import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// Resolve sharp from Next.js's own copy
let sharp;
try {
  sharp = require("sharp");
} catch {
  // Fallback: try local node_modules
  const { default: s } = await import(
    join(__dirname, "../node_modules/next/dist/server/lib/squoosh/../../../node_modules/sharp/lib/index.js")
  );
  sharp = s;
}

const ROOT   = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const APP    = join(ROOT, "app");

mkdirSync(PUBLIC, { recursive: true });
mkdirSync(APP,    { recursive: true });

// ── The canonical SVG source ────────────────────────────────────────
// Self-contained: 512×512 square canvas, #0D0D0D bg, yellow shield+T
const SIZE = 512;

// Shield scaled to fit 512×512 square with padding
// Original viewBox 0 0 100 116 → scale to ~420px height → width ~362px
// Center in 512×512 with equal padding
const PAD = 46; // padding each side
const SW  = SIZE - PAD * 2;        // 420
const SH  = Math.round(SW * 1.16); // 487 — taller than canvas, reduce
// Recalculate: fit height first
const SH2 = SIZE - PAD * 2;        // 420 height
const SW2 = Math.round(SH2 / 1.16);// 362 width
const OX  = Math.round((SIZE - SW2) / 2); // 75 offset x
const OY  = PAD;                          // 46 offset y

// Scale factor: original coords are on 0-100 / 0-116 grid
const scaleX = (x) => OX + (x / 100) * SW2;
const scaleY = (y) => OY + (y / 116) * SH2;

// Build path string scaled to 512×512
function scaledPath() {
  const pts = [
    // Shield outline
    `M${scaleX(50)} ${scaleY(2)}`,
    `L${scaleX(88)} ${scaleY(4)}`,
    `L${scaleX(96)} ${scaleY(10)}`,
    `L${scaleX(96)} ${scaleY(72)}`,
    `L${scaleX(50)} ${scaleY(112)}`,
    `L${scaleX(4)}  ${scaleY(72)}`,
    `L${scaleX(4)}  ${scaleY(10)}`,
    `L${scaleX(12)} ${scaleY(4)} Z`,
    // T crossbar
    `M${scaleX(10)} ${scaleY(24)} H${scaleX(90)} V${scaleY(38)} H${scaleX(10)} Z`,
    // T stem
    `M${scaleX(40)} ${scaleY(38)} H${scaleX(60)} V${scaleY(76)} H${scaleX(40)} Z`,
    // T foot left
    `M${scaleX(10)} ${scaleY(76)} H${scaleX(36)} V${scaleY(90)} H${scaleX(10)} Z`,
    // T foot right
    `M${scaleX(64)} ${scaleY(76)} H${scaleX(90)} V${scaleY(90)} H${scaleX(64)} Z`,
  ].join(" ");
  return pts;
}

function makeSVG(size, bgColor = "#0D0D0D", shieldColor = "#F5C518") {
  const pad  = Math.round(size * 0.09);
  const sh   = size - pad * 2;
  const sw   = Math.round(sh / 1.16);
  const ox   = Math.round((size - sw) / 2);
  const oy   = pad;
  const sx   = (x) => (ox + (x / 100) * sw).toFixed(2);
  const sy   = (y) => (oy + (y / 116) * sh).toFixed(2);

  const path = [
    `M${sx(50)} ${sy(2)} L${sx(88)} ${sy(4)} L${sx(96)} ${sy(10)}`,
    `L${sx(96)} ${sy(72)} L${sx(50)} ${sy(112)} L${sx(4)} ${sy(72)}`,
    `L${sx(4)} ${sy(10)} L${sx(12)} ${sy(4)} Z`,
    `M${sx(10)} ${sy(24)} H${sx(90)} V${sy(38)} H${sx(10)} Z`,
    `M${sx(40)} ${sy(38)} H${sx(60)} V${sy(76)} H${sx(40)} Z`,
    `M${sx(10)} ${sy(76)} H${sx(36)} V${sy(90)} H${sx(10)} Z`,
    `M${sx(64)} ${sy(76)} H${sx(90)} V${sy(90)} H${sx(64)} Z`,
  ].join(" ");

  const bg = bgColor
    ? `<rect width="${size}" height="${size}" fill="${bgColor}"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <path fill-rule="evenodd" clip-rule="evenodd" d="${path}" fill="${shieldColor}"/>
</svg>`;
}

async function svgToPng(svgStr, outPath) {
  const buf = await sharp(Buffer.from(svgStr)).png().toBuffer();
  writeFileSync(outPath, buf);
  console.log("✓", outPath.replace(ROOT, ""));
}

// ── Generate all PNG sizes ──────────────────────────────────────────

const sizes = [
  { file: "favicon-16x16.png",          size: 16,  bg: "#0D0D0D" },
  { file: "favicon-32x32.png",          size: 32,  bg: "#0D0D0D" },
  { file: "apple-touch-icon.png",       size: 180, bg: "#0D0D0D" },
  { file: "android-chrome-192x192.png", size: 192, bg: "#0D0D0D" },
  { file: "android-chrome-512x512.png", size: 512, bg: "#0D0D0D" },
];

console.log("\n🛡  TRYBY Favicon Generator\n");

for (const { file, size, bg } of sizes) {
  const svg = makeSVG(size, bg);
  await svgToPng(svg, join(PUBLIC, file));
}

// ── app/icon.png — Next.js App Router auto-detection (32×32) ───────
{
  const svg = makeSVG(32, "#0D0D0D");
  await svgToPng(svg, join(APP, "icon.png"));
  // Also write icon.svg for modern browsers
  writeFileSync(join(APP, "icon.svg"), makeSVG(32, "#0D0D0D"));
  console.log("✓ app/icon.svg");
}

// ── app/apple-icon.png — Next.js apple touch icon ──────────────────
{
  const svg = makeSVG(180, "#0D0D0D");
  await svgToPng(svg, join(APP, "apple-icon.png"));
}

// ── favicon.ico — 16px + 32px multi-size ICO ───────────────────────
// ICO format: simple single-image 32×32 PNG wrapped in ICO container
// Modern browsers accept PNG-inside-ICO (ICO v1 with PNG data)
{
  const svg32 = makeSVG(32, "#0D0D0D");
  const png32 = await sharp(Buffer.from(svg32)).png().toBuffer();

  // ICO file structure: ICONDIR + ICONDIRENTRY + PNG data
  const ICONDIR = Buffer.alloc(6);
  ICONDIR.writeUInt16LE(0,    0); // reserved
  ICONDIR.writeUInt16LE(1,    2); // type: 1 = ICO
  ICONDIR.writeUInt16LE(1,    4); // count: 1 image

  const ICONDIRENTRY = Buffer.alloc(16);
  ICONDIRENTRY.writeUInt8(32,           0); // width  (0 = 256)
  ICONDIRENTRY.writeUInt8(32,           1); // height (0 = 256)
  ICONDIRENTRY.writeUInt8(0,            2); // color count
  ICONDIRENTRY.writeUInt8(0,            3); // reserved
  ICONDIRENTRY.writeUInt16LE(1,         4); // color planes
  ICONDIRENTRY.writeUInt16LE(32,        6); // bits per pixel
  ICONDIRENTRY.writeUInt32LE(png32.length, 8);  // image size
  ICONDIRENTRY.writeUInt32LE(6 + 16,   12); // offset to image data

  const ico = Buffer.concat([ICONDIR, ICONDIRENTRY, png32]);
  writeFileSync(join(PUBLIC, "favicon.ico"), ico);
  console.log("✓ public/favicon.ico");
}

// ── site.webmanifest ────────────────────────────────────────────────
const manifest = {
  name:             "TRYBY Sports Store",
  short_name:       "TRYBY",
  description:      "India's Premium Jersey Destination",
  start_url:        "/",
  display:          "standalone",
  background_color: "#0D0D0D",
  theme_color:      "#F5C518",
  icons: [
    { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};
writeFileSync(join(PUBLIC, "site.webmanifest"), JSON.stringify(manifest, null, 2));
console.log("✓ public/site.webmanifest");

console.log("\n✅  All favicon assets generated.\n");
