/**
 * Fix favicon sizes — make icon fill more of each canvas.
 * The source PNG has heavy padding; we trim it first.
 */
import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const sharp     = require("sharp");

const ROOT   = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const APP    = join(ROOT, "app");

// Trim the transparent-bg icon tightly first
const ICON_SRC = join(PUBLIC, "brand", "tryby-icon.png");

async function makeIcon(destPath, canvasSize, iconSize, bg = { r: 13, g: 13, b: 13, alpha: 1 }) {
  // 1. Trim transparent padding from source
  const trimmed = await sharp(ICON_SRC)
    .trim({ threshold: 10 })
    .resize(iconSize, iconSize, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 2. Composite onto canvas
  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: bg },
  })
    .composite([{ input: trimmed, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(destPath);

  console.log("✓", destPath.replace(ROOT, ""));
}

console.log("\n🔧  Fixing favicon sizes...\n");

// favicon sizes — icon fills ~80% of canvas
await makeIcon(join(PUBLIC, "favicon-16x16.png"),          16,  13);
await makeIcon(join(PUBLIC, "favicon-32x32.png"),          32,  26);
await makeIcon(join(PUBLIC, "apple-touch-icon.png"),       180, 144);
await makeIcon(join(PUBLIC, "android-chrome-192x192.png"), 192, 154);
await makeIcon(join(PUBLIC, "android-chrome-512x512.png"), 512, 410);
await makeIcon(join(APP,    "icon.png"),                   32,  26);
await makeIcon(join(APP,    "apple-icon.png"),             180, 144);

// Also remake the dark brand asset at better size
await makeIcon(join(PUBLIC, "brand", "tryby-icon-dark.png"), 512, 410);

// favicon.ico from 32px
{
  const png32 = await sharp(join(PUBLIC, "favicon-32x32.png")).toBuffer();
  const ICONDIR = Buffer.alloc(6);
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

console.log("\n✅  Done.\n");
