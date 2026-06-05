"use client";

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Product {
  name: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  teamName?: string;
  images: { url: string; isPrimary: boolean }[];
  variants: { sku: string; price: number; mrp: number; stock: number; costPrice?: number }[];
}

interface CheckItem {
  label: string;
  pass: boolean;
  warn?: boolean;
  tip?: string;
}

function evaluate(product: Product): CheckItem[] {
  const imgs = product.images ?? [];
  const variants = product.variants ?? [];
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const hasCost = variants.some(v => v.costPrice && Number(v.costPrice) > 0);

  return [
    {
      label: "Product name",
      pass: product.name?.trim().length >= 5,
      tip: "Name should be at least 5 characters",
    },
    {
      label: "Description (50+ chars)",
      pass: product.description?.trim().length >= 50,
      tip: "Write at least 50 characters for better SEO and conversions",
    },
    {
      label: "Primary image set",
      pass: imgs.some(i => i.isPrimary) || imgs.length > 0,
      tip: "Upload at least one product image",
    },
    {
      label: "Multiple images (3+)",
      pass: imgs.length >= 3,
      warn: imgs.length > 0 && imgs.length < 3,
      tip: "3+ images improves conversion rate significantly",
    },
    {
      label: "At least one variant",
      pass: variants.length >= 1,
      tip: "Add sizes/colors as variants with SKU and price",
    },
    {
      label: "All variants have stock",
      pass: totalStock > 0,
      warn: totalStock > 0 && totalStock < 5,
      tip: "Low stock — consider restocking before publishing",
    },
    {
      label: "Cost price entered",
      pass: hasCost,
      warn: !hasCost,
      tip: "Enter cost price in Variants & Images to enable profit tracking",
    },
    {
      label: "Meta title (SEO)",
      pass: !!(product.metaTitle?.trim()),
      warn: !product.metaTitle,
      tip: "Add a meta title for better Google rankings (e.g. Buy MI Jersey | TRYBY)",
    },
    {
      label: "Meta description (SEO)",
      pass: !!(product.metaDescription?.trim()),
      warn: !product.metaDescription,
      tip: "Add a 120-160 char meta description for search snippets",
    },
    {
      label: "Meta description length",
      pass: !product.metaDescription || (product.metaDescription.length >= 120 && product.metaDescription.length <= 160),
      warn: !!(product.metaDescription && (product.metaDescription.length < 120 || product.metaDescription.length > 160)),
      tip: `Ideal: 120-160 chars. Current: ${product.metaDescription?.length ?? 0}`,
    },
  ];
}

export function ProductQualityChecklist({ product }: { product: Product }) {
  const checks = evaluate(product);
  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const scoreColor = score >= 80 ? "#4ADE80" : score >= 60 ? "#F5C518" : "#F87171";

  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
          Quality Checklist
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: scoreColor }}>
            {score}%
          </span>
          <span className="text-[10px] text-white/30 font-semibold">{passed}/{checks.length}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: scoreColor }}
        />
      </div>

      <div className="space-y-1.5 pt-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-start gap-2.5">
            {c.pass ? (
              <CheckCircle className="h-3.5 w-3.5 text-[#4ADE80] mt-0.5 shrink-0" />
            ) : c.warn ? (
              <AlertCircle className="h-3.5 w-3.5 text-[#F5C518] mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-[#F87171] mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <span className={`text-[12px] font-semibold ${c.pass ? "text-white/70" : c.warn ? "text-[#F5C518]/80" : "text-white/80"}`}>
                {c.label}
              </span>
              {!c.pass && c.tip && (
                <p className="text-[10px] text-white/30 mt-0.5">{c.tip}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
