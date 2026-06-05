/**
 * Processes the two approved TRYBY brand PNGs:
 *   - Removes white background (makes transparent)
 *   - Creates dark-background versions for navbar/footer/splash
 *   - Generates all favicon sizes from the icon PNG
 *   - Copies originals as-is for light-background use
 *
 * Run: node scripts/process-brand-assets.mjs
 */

import { createRequire } from "module";
import { writeFileSync, copyFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const sharp     = require("sharp");

const ROOT      = join(__dirname, "..");
const PUBLIC    = join(ROOT, "public");
const BRAND     = join(PUBLIC, "brand");
const APP       = join(ROOT, "app");
const DOWNLOADS = "C:\\Users\\anjel\\Downloads";

mkdirSync(BRAND, { recursive: true });
mkdirSync(APP,   { recursive: true });

const ICON_SRC = join(DOWNLOADS, "ChatGPT Image Jun 3, 2026, 10_09_40 PM.png");
const LOGO_SRC = join(DOWNLOADS, "ChatGPT Image Jun 3, 2026, 10_04_54 PM.png");

console.log("\n🛡  TRYBY Brand Asset Processor\n");

/* ── Step 1: Remove white background from both PNGs ─────────────── */
// Strategy: convert white (and near-white) pixels to transparent
// Threshold: pixels with R>240, G>240, B>240 become alpha=0

async function removeWhiteBg(srcPath, destPath, { trimFirst = false } = {}) {
  let pipeline = sharp(srcPath).ensureAlpha();

  if (trimFirst) {
    // Trim whitespace border before processing
    pipeline = sharp(await pipeline.toBuffer()).trim({ background: "#FFFFFF", threshold: 30 });
  }

  const { data, info } = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  const buf = Buffer.from(data);

  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    // White background removal: threshold 235 to keep anti-aliasing edges
    if (r > 235 && g > 235 && b > 235) {
      buf[i + 3] = 0; // fully transparent
    } else if (r > 200 && g > 200 && b > 200) {
      // Semi-transparent edge blending
      const brightness = (r + g + b) / 3;
      buf[i + 3] = Math.round(255 - ((brightness - 200) / 55) * 255);
    }
  }

  await sharp(buf, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(destPath);

  console.log("✓", destPath.replace(ROOT, ""));
}

/* ── Process icon (T shield) ─────────────────────────────────────── */
// Transparent version (works on any bg)
await removeWhiteBg(ICON_SRC, join(BRAND, "tryby-icon.png"), { trimFirst: true });

// Dark bg version (for splash, PWA)
{
  const transparent = await sharp(join(BRAND, "tryby-icon.png")).toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } } })
    .composite([{
      input: await sharp(transparent).resize(420, 420, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
      gravity: "center",
    }])
    .png()
    .toFile(join(BRAND, "tryby-icon-dark.png"));
  console.log("✓ public/brand/tryby-icon-dark.png");
}

/* ── Process full logo ───────────────────────────────────────────── */
await removeWhiteBg(LOGO_SRC, join(BRAND, "tryby-logo.png"), { trimFirst: true });

// Dark bg version for navbar/footer
{
  // Crop to content, resize to standard header height (80px tall)
  const { width, height } = await sharp(join(BRAND, "tryby-logo.png")).metadata();
  await sharp(join(BRAND, "tryby-logo.png"))
    .png()
    .toFile(join(BRAND, "tryby-logo-dark-bg.png"));
  console.log("✓ public/brand/tryby-logo-dark-bg.png");
}

// Also keep raw originals accessible
copyFileSync(ICON_SRC, join(BRAND, "tryby-icon-original.png"));
copyFileSync(LOGO_SRC, join(BRAND, "tryby-logo-original.png"));
console.log("✓ public/brand/tryby-icon-original.png");
console.log("✓ public/brand/tryby-logo-original.png");

/* ── Step 2: Generate all favicon sizes from icon ────────────────── */
const iconTransparent = join(BRAND, "tryby-icon.png");

// favicon-16x16.png
await sharp(iconTransparent).resize(16, 16, { fit: "contain", background: { r: 13, g: 13, b: 13, alpha: 1 } }).png().toFile(join(PUBLIC, "favicon-16x16.png"));
console.log("✓ public/favicon-16x16.png");

// favicon-32x32.png
await sharp(iconTransparent).resize(32, 32, { fit: "contain", background: { r: 13, g: 13, b: 13, alpha: 1 } }).png().toFile(join(PUBLIC, "favicon-32x32.png"));
console.log("✓ public/favicon-32x32.png");

// apple-touch-icon — 180×180 dark bg (iOS renders best with opaque icon)
await sharp(iconTransparent).resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
  .then(img =>
    sharp({ create: { width: 180, height: 180, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } } })
      .composite([{ input: img, gravity: "center" }])
      .png()
      .toFile(join(PUBLIC, "apple-touch-icon.png"))
  );
console.log("✓ public/apple-touch-icon.png");

// android-chrome-192x192
await sharp(iconTransparent).resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
  .then(img =>
    sharp({ create: { width: 192, height: 192, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } } })
      .composite([{ input: img, gravity: "center" }])
      .png()
      .toFile(join(PUBLIC, "android-chrome-192x192.png"))
  );
console.log("✓ public/android-chrome-192x192.png");

// android-chrome-512x512
await sharp(iconTransparent).resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
  .then(img =>
    sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } } })
      .composite([{ input: img, gravity: "center" }])
      .png()
      .toFile(join(PUBLIC, "android-chrome-512x512.png"))
  );
console.log("✓ public/android-chrome-512x512.png");

/* ── Step 3: app/icon.png for Next.js App Router ─────────────────── */
await sharp(iconTransparent).resize(28, 28, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
  .then(img =>
    sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } } })
      .composite([{ input: img, gravity: "center" }])
      .png()
      .toFile(join(APP, "icon.png"))
  );
console.log("✓ app/icon.png");

await sharp(iconTransparent).resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
  .then(img =>
    sharp({ create: { width: 180, height: 180, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } } })
      .composite([{ input: img, gravity: "center" }])
      .png()
      .toFile(join(APP, "apple-icon.png"))
  );
console.log("✓ app/apple-icon.png");

/* ── Step 4: favicon.ico (32×32 PNG-inside-ICO) ─────────────────── */
{
  const png32 = await sharp(iconTransparent)
    .resize(28, 28, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
    .then(img =>
      sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 13, g: 13, b: 13, alpha: 1 } } })
        .composite([{ input: img, gravity: "center" }])
        .png()
        .toBuffer()
    );

  const ICONDIR      = Buffer.alloc(6);
  ICONDIR.writeUInt16LE(0, 0);
  ICONDIR.writeUInt16LE(1, 2);
  ICONDIR.writeUInt16LE(1, 4);

  const ICONDIRENTRY = Buffer.alloc(16);
  ICONDIRENTRY.writeUInt8(32,            0);
  ICONDIRENTRY.writeUInt8(32,            1);
  ICONDIRENTRY.writeUInt8(0,             2);
  ICONDIRENTRY.writeUInt8(0,             3);
  ICONDIRENTRY.writeUInt16LE(1,          4);
  ICONDIRENTRY.writeUInt16LE(32,         6);
  ICONDIRENTRY.writeUInt32LE(png32.length, 8);
  ICONDIRENTRY.writeUInt32LE(6 + 16,    12);

  writeFileSync(join(PUBLIC, "favicon.ico"), Buffer.concat([ICONDIR, ICONDIRENTRY, png32]));
  console.log("✓ public/favicon.ico");
}

/* ── Step 5: site.webmanifest ───────────────────────────────────── */
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

console.log("\n✅  All brand assets processed.\n");
