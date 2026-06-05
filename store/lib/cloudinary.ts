/**
 * Cloudinary integration — signed uploads, URL transforms, responsive helpers.
 * All uploads use server-side signed requests — no upload preset required.
 */

import crypto from "crypto";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const KEY   = process.env.CLOUDINARY_API_KEY    ?? "";
const SECRET = process.env.CLOUDINARY_API_SECRET ?? "";
const BASE   = `https://api.cloudinary.com/v1_1/${CLOUD}`;

export function isConfigured(): boolean {
  return !!(CLOUD && KEY && SECRET &&
    !CLOUD.includes("REPLACE") && !KEY.includes("REPLACE") && !SECRET.includes("REPLACE"));
}

// ── Folder conventions ──────────────────────────────────────────────────────

export const FOLDERS = {
  products:          "tryby/products",
  productImages:     (productId: string) => `tryby/products/${productId}`,
  categories:        "tryby/categories",
  banners:           "tryby/banners",
  homepage:          "tryby/homepage",
  supplierDocs:      (supplierId: string) => `tryby/suppliers/${supplierId}/docs`,
  reviewImages:      (orderId: string)    => `tryby/reviews/${orderId}`,
  media:             "tryby/media",
  misc:              "tryby/misc",
} as const;

// ── Signed upload ───────────────────────────────────────────────────────────

interface UploadOptions {
  folder:        string;
  publicId?:     string;
  /** Format the image will be delivered in — defaults to "auto" */
  fetchFormat?:  "auto" | "webp" | "avif" | "jpg" | "png";
  quality?:      "auto" | number;
  /** Maximum width/height in px — Cloudinary will not upscale */
  maxWidth?:     number;
  maxHeight?:    number;
  tags?:         string[];
  overwrite?:    boolean;
}

interface UploadResult {
  publicId:   string;
  url:        string;
  secureUrl:  string;
  width:      number;
  height:     number;
  format:     string;
  bytes:      number;
  resourceType: string;
}

function buildSignature(params: Record<string, string | number | boolean | string[]>): string {
  // Sort params alphabetically and join as key=value&key=value
  const str = Object.keys(params)
    .sort()
    .map(k => {
      const v = params[k];
      return `${k}=${Array.isArray(v) ? v.join(",") : v}`;
    })
    .join("&");

  return crypto.createHash("sha256").update(str + SECRET).digest("hex");
}

export async function uploadFile(
  file: File | Buffer | Blob,
  opts: UploadOptions
): Promise<UploadResult> {
  if (!isConfigured()) throw new Error("Cloudinary not configured — fill CLOUDINARY_* env vars");

  const timestamp = Math.floor(Date.now() / 1000);

  const signParams: Record<string, string | number | boolean | string[]> = {
    folder:       opts.folder,
    timestamp,
    quality:      opts.quality ?? "auto",
    fetch_format: opts.fetchFormat ?? "auto",
  };
  if (opts.publicId)  signParams.public_id = opts.publicId;
  if (opts.maxWidth)  signParams.width     = opts.maxWidth;
  if (opts.maxHeight) signParams.height    = opts.maxHeight;
  if (opts.overwrite) signParams.overwrite = true;
  if (opts.tags?.length) signParams.tags   = opts.tags;

  const signature = buildSignature(signParams);

  const form = new FormData();
  if (file instanceof File || file instanceof Blob) {
    form.append("file", file);
  } else {
    // Buffer — convert to Blob
    form.append("file", new Blob([file]));
  }
  form.append("folder",       opts.folder);
  form.append("timestamp",    String(timestamp));
  form.append("api_key",      KEY);
  form.append("signature",    signature);
  form.append("quality",      String(signParams.quality));
  form.append("fetch_format", String(signParams.fetch_format));

  if (opts.publicId)  form.append("public_id", opts.publicId);
  if (opts.overwrite) form.append("overwrite", "true");
  if (opts.maxWidth)  form.append("width",     String(opts.maxWidth));
  if (opts.maxHeight) form.append("height",    String(opts.maxHeight));
  if (opts.tags?.length) form.append("tags",   opts.tags.join(","));

  const res = await fetch(`${BASE}/image/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    publicId:     data.public_id,
    url:          data.url,
    secureUrl:    data.secure_url,
    width:        data.width,
    height:       data.height,
    format:       data.format,
    bytes:        data.bytes,
    resourceType: data.resource_type,
  };
}

// ── Raw file upload (for API routes receiving FormData) ─────────────────────

export async function uploadFromRequest(
  file: File,
  opts: UploadOptions
): Promise<UploadResult> {
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("File too large (max 10 MB)");

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowed.includes(file.type)) throw new Error("Invalid file type — use JPG, PNG, WebP, or AVIF");

  return uploadFile(file, opts);
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteAsset(publicId: string): Promise<void> {
  if (!isConfigured()) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = { public_id: publicId, timestamp };
  const signature = crypto
    .createHash("sha256")
    .update(`public_id=${publicId}&timestamp=${timestamp}${SECRET}`)
    .digest("hex");

  await fetch(`${BASE}/image/destroy`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ public_id: publicId, signature, api_key: KEY, timestamp }),
  }).catch(() => null); // deletion failure is non-fatal
}

// ── URL transform helpers ───────────────────────────────────────────────────

type CloudinaryFit = "fill" | "fit" | "crop" | "scale" | "thumb" | "pad";
type CloudinaryGravity = "auto" | "face" | "center" | "north" | "south" | "east" | "west";

interface TransformOptions {
  width?:    number;
  height?:   number;
  fit?:      CloudinaryFit;
  gravity?:  CloudinaryGravity;
  quality?:  "auto" | number;
  format?:   "auto" | "webp" | "avif" | "jpg" | "png";
  /** Additional raw transformation string appended verbatim */
  extra?:    string;
}

/**
 * Build an optimized Cloudinary delivery URL from a public_id.
 * Use this on the frontend for all image rendering.
 */
export function buildUrl(publicId: string, opts: TransformOptions = {}): string {
  if (!CLOUD) return "";

  const transforms: string[] = [];

  if (opts.width || opts.height) {
    const parts: string[] = [];
    if (opts.width)   parts.push(`w_${opts.width}`);
    if (opts.height)  parts.push(`h_${opts.height}`);
    if (opts.fit)     parts.push(`c_${opts.fit}`);
    if (opts.gravity) parts.push(`g_${opts.gravity}`);
    transforms.push(parts.join(","));
  }

  const qualityPart = `q_${opts.quality ?? "auto"}`;
  const formatPart  = `f_${opts.format ?? "auto"}`;
  transforms.push(`${qualityPart},${formatPart}`);

  if (opts.extra) transforms.push(opts.extra);

  const t = transforms.join("/");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t}/${publicId}`;
}

/**
 * Build a srcSet string for responsive images — calls buildUrl at each breakpoint.
 */
export function buildSrcSet(
  publicId: string,
  widths: number[] = [320, 640, 960, 1280, 1920],
  baseOpts: Omit<TransformOptions, "width"> = {}
): string {
  return widths
    .map(w => `${buildUrl(publicId, { ...baseOpts, width: w })} ${w}w`)
    .join(", ");
}

/** Pre-built transforms for common storefront use cases */
export const TRANSFORMS = {
  /** Product card thumbnail 400×400 */
  productThumb: (publicId: string) =>
    buildUrl(publicId, { width: 400, height: 400, fit: "fill", gravity: "auto", quality: "auto", format: "webp" }),

  /** PDP hero — 960px wide, auto height */
  pdpHero: (publicId: string) =>
    buildUrl(publicId, { width: 960, fit: "scale", quality: "auto", format: "webp" }),

  /** Homepage banner — full width */
  banner: (publicId: string) =>
    buildUrl(publicId, { width: 1920, fit: "scale", quality: "auto", format: "webp" }),

  /** Category grid tile 640×480 */
  categoryTile: (publicId: string) =>
    buildUrl(publicId, { width: 640, height: 480, fit: "fill", gravity: "auto", quality: "auto", format: "webp" }),

  /** Admin thumbnail 80×80 */
  adminThumb: (publicId: string) =>
    buildUrl(publicId, { width: 80, height: 80, fit: "fill", gravity: "auto", quality: "auto", format: "webp" }),

  /** Supplier document (no transforms — must be original for legal purposes) */
  document: (publicId: string) =>
    `https://res.cloudinary.com/${CLOUD}/image/upload/${publicId}`,

  /** Review image 600×600 */
  reviewImage: (publicId: string) =>
    buildUrl(publicId, { width: 600, height: 600, fit: "fill", gravity: "auto", quality: "auto", format: "webp" }),
} as const;

// ── Usage info (for dashboard) ──────────────────────────────────────────────

interface CloudinaryUsage {
  plan:           string;
  storage:        { usage: number; limit: number; used_percent: number };
  bandwidth:      { usage: number; limit: number; used_percent: number };
  transformations:{ usage: number; limit: number; used_percent: number };
  requests:       { usage: number; limit: number; used_percent: number };
}

export async function getUsage(): Promise<CloudinaryUsage | null> {
  if (!isConfigured()) return null;
  try {
    const credentials = Buffer.from(`${KEY}:${SECRET}`).toString("base64");
    const res = await fetch(`${BASE}/usage`, {
      headers: { Authorization: `Basic ${credentials}` },
      signal:  AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
