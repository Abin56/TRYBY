/**
 * TRYBY Logo Asset Builder — Production
 *
 * Source of truth:
 *   public/brand/tryby-icon-original.png  — 1536×1024, RGBA, transparent bg, yellow shield
 *
 * Outputs:
 *   public/brand/tryby-icon.png              — transparent, all sizes
 *   public/brand/tryby-icon-[N].png          — 2048/1024/512/256/128/64/32/16
 *   public/brand/tryby-logo-light.png        — shield + white TRYBY + yellow SPORTS STORE (dark bg use)
 *   public/brand/tryby-logo-dark.png         — shield + dark TRYBY + dark SPORTS STORE (light bg use)
 *   public/favicon.ico
 *   public/favicon-{16,32}.png
 *   public/apple-touch-icon.png
 *   public/android-chrome-{192,512}.png
 *   app/icon.png
 *   app/apple-icon.png
 */

import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const sharp     = require("sharp");

const ROOT  = join(__dirname, "..");
const BRAND = join(ROOT, "public", "brand");
const PUB   = join(ROOT, "public");
const APP   = join(ROOT, "app");

mkdirSync(BRAND, { recursive: true });
mkdirSync(APP,   { recursive: true });

const SRC_ICON = join(BRAND, "tryby-icon-original.png");

console.log("\n🛡  TRYBY Logo Asset Builder — Production\n");

/* ─────────────────────────────────────────────────────────────────────
   STEP 1: Extract clean shield — tight crop from source
   Source content bbox: x=630, y=336, w=276, h=312 within 1536×1024
   Add 2% padding so anti-aliased edges don't clip
───────────────────────────────────────────────────────────────────── */

// Extract the shield content area with generous padding
const CROP_LEFT   = 616;
const CROP_TOP    = 322;
const CROP_WIDTH  = 304;
const CROP_HEIGHT = 340;

const shieldBuffer = await sharp(SRC_ICON)
  .extract({ left: CROP_LEFT, top: CROP_TOP, width: CROP_WIDTH, height: CROP_HEIGHT })
  .png()
  .toBuffer();

// Verify it extracted correctly — check a center pixel
{
  const { data, info } = await sharp(shieldBuffer).raw().toBuffer({ resolveWithObject: true });
  const cx = Math.floor(info.width / 2);
  const cy = Math.floor(info.height / 2);
  const i  = (cy * info.width + cx) * info.channels;
  // center of shield should be transparent (T cutout)
  console.log(`  Shield extracted: ${info.width}×${info.height}, center alpha=${data[i+3]} (expected ~0)`);
}

/* ─────────────────────────────────────────────────────────────────────
   STEP 2: Export all icon sizes — transparent background
───────────────────────────────────────────────────────────────────── */

const ICON_SIZES = [2048, 1024, 512, 256, 128, 64, 32, 16];

// Master 2048px version — resize the crop to square canvas
// The shield is ~276×312 — fit into square preserving aspect ratio
async function makeIconTransparent(destPath, size) {
  await sharp(shieldBuffer)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(destPath);
  console.log(`✓ ${destPath.replace(ROOT, "")}`);
}

// Master transparent icon (largest size = source quality)
await makeIconTransparent(join(BRAND, "tryby-icon.png"), 1024);

// All individual sizes
for (const size of ICON_SIZES) {
  await makeIconTransparent(join(BRAND, `tryby-icon-${size}.png`), size);
}

/* ─────────────────────────────────────────────────────────────────────
   STEP 3: Full logo — shield + TRYBY + SPORTS STORE
   Built as SVG text overlay composited with the shield PNG
   No background rectangle. Transparent output.

   Layout (all in canvas units):
     Canvas: 720 × 200
     Shield: left-aligned, 160px tall, vertically centered → ~142px wide
     TRYBY: Barlow Condensed 800, 96px, white, right of shield
     SPORTS STORE: Barlow Condensed 600, 28px, #F5C518, below TRYBY
───────────────────────────────────────────────────────────────────── */

// Shield dims at 160px height: 304/340 ratio = ~143px wide
const LOGO_H       = 200;
const SHIELD_H     = LOGO_H;          // 200px
const SHIELD_W     = Math.round(SHIELD_H * (CROP_WIDTH / CROP_HEIGHT)); // ~179px
const GAP          = 20;              // gap between shield and text
const CANVAS_W     = 720;

// Resize shield to logo height
const shieldForLogo = await sharp(shieldBuffer)
  .resize(SHIELD_W, SHIELD_H, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

// Text x-start
const textX = SHIELD_W + GAP;

function makeSvgText(trybyColor, sportsColor) {
  return `<svg width="${CANVAS_W}" height="${LOGO_H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    @font-face {
      font-family: 'BarlowCondensed';
      /* Use system fallback — Barlow Condensed not available in Node */
    }
  </style>
  <!-- TRYBY -->
  <text
    x="${textX}"
    y="128"
    font-family="'Arial Black', 'Impact', 'Helvetica Neue', Arial, sans-serif"
    font-size="108"
    font-weight="900"
    letter-spacing="8"
    fill="${trybyColor}"
    dominant-baseline="auto"
  >TRYBY</text>
  <!-- SPORTS STORE -->
  <text
    x="${textX + 4}"
    y="172"
    font-family="'Arial', 'Helvetica Neue', Arial, sans-serif"
    font-size="30"
    font-weight="600"
    letter-spacing="7"
    fill="${sportsColor}"
    dominant-baseline="auto"
  >SPORTS STORE</text>
</svg>`;
}

async function buildFullLogo(destPath, trybyColor, sportsColor) {
  const svgBuf = Buffer.from(makeSvgText(trybyColor, sportsColor));

  await sharp({
    create: {
      width:      CANVAS_W,
      height:     LOGO_H,
      channels:   4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent
    },
  })
    .composite([
      { input: shieldForLogo, left: 0, top: 0 },
      { input: svgBuf,        left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(destPath);

  console.log(`✓ ${destPath.replace(ROOT, "")}`);
}

// Light variant — for dark backgrounds (navbar, footer, splash)
// White TRYBY + yellow SPORTS STORE
await buildFullLogo(join(BRAND, "tryby-logo-light.png"), "#FFFFFF", "#F5C518");

// Dark variant — for light backgrounds (print, light UI)
// Dark charcoal TRYBY + dark yellow SPORTS STORE
await buildFullLogo(join(BRAND, "tryby-logo-dark.png"), "#0D0D0D", "#B8900A");

/* ─────────────────────────────────────────────────────────────────────
   STEP 4: Favicon set — from clean transparent icon
   All favicons: dark background (#0D0D0D) so the yellow reads in browser tab
───────────────────────────────────────────────────────────────────── */

async function makeFaviconPng(destPath, canvasSize, iconFillSize) {
  const iconBuf = await sharp(shieldBuffer)
    .resize(iconFillSize, iconFillSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width:    canvasSize,
      height:   canvasSize,
      channels: 4,
      background: { r: 13, g: 13, b: 13, alpha: 255 }, // #0D0D0D
    },
  })
    .composite([{ input: iconBuf, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(destPath);

  console.log(`✓ ${destPath.replace(ROOT, "")}`);
}

// favicon-16x16 — icon fills 12px of 16px canvas
await makeFaviconPng(join(PUB, "favicon-16x16.png"),          16,  12);
// favicon-32x32 — icon fills 26px of 32px canvas
await makeFaviconPng(join(PUB, "favicon-32x32.png"),          32,  26);
// apple-touch-icon 180×180 — icon fills 144px
await makeFaviconPng(join(PUB, "apple-touch-icon.png"),       180, 144);
// android 192×192 — icon fills 154px
await makeFaviconPng(join(PUB, "android-chrome-192x192.png"), 192, 154);
// android 512×512 — icon fills 412px
await makeFaviconPng(join(PUB, "android-chrome-512x512.png"), 512, 412);
// app/icon.png for Next.js App Router
await makeFaviconPng(join(APP, "icon.png"),                   32,  26);
await makeFaviconPng(join(APP, "apple-icon.png"),             180, 144);

/* ─────────────────────────────────────────────────────────────────────
   STEP 5: favicon.ico — 32×32 PNG-in-ICO
───────────────────────────────────────────────────────────────────── */
{
  const png32 = await sharp(join(PUB, "favicon-32x32.png")).toBuffer();

  const ICONDIR = Buffer.alloc(6);
  ICONDIR.writeUInt16LE(0, 0);  // reserved
  ICONDIR.writeUInt16LE(1, 2);  // type: ICO
  ICONDIR.writeUInt16LE(1, 4);  // count: 1

  const ENTRY = Buffer.alloc(16);
  ENTRY.writeUInt8(32,             0);  // width
  ENTRY.writeUInt8(32,             1);  // height
  ENTRY.writeUInt8(0,              2);  // color count
  ENTRY.writeUInt8(0,              3);  // reserved
  ENTRY.writeUInt16LE(1,           4);  // planes
  ENTRY.writeUInt16LE(32,          6);  // bpp
  ENTRY.writeUInt32LE(png32.length, 8); // data size
  ENTRY.writeUInt32LE(22,         12);  // data offset (6 + 16)

  writeFileSync(join(PUB, "favicon.ico"), Buffer.concat([ICONDIR, ENTRY, png32]));
  console.log(`✓ public/favicon.ico`);
}

console.log("\n✅  All production logo assets built.\n");
