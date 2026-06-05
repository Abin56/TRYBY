"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";

interface ImportResult {
  row: number;
  status: "created" | "skipped" | "error";
  name?: string;
  reason?: string;
}

interface ImportResponse {
  created: number;
  skipped: number;
  errors: number;
  total: number;
  results: ImportResult[];
}

const TEMPLATE_CSV = `name,sport,description,sku,price,mrp,stock,size,color,categoryId,teamName,leagueName,imageUrl,metaTitle,metaDescription,shippingCost,costPrice,isActive,isFeatured,isOfficialLicensed
MI Paltan Jersey 2025,CRICKET,Official Mumbai Indians IPL 2025 jersey with premium dry-fit fabric,MI-25-M,1299,1799,50,M,,,"Mumbai Indians",IPL 2025,https://example.com/mi-jersey.jpg,Buy MI Jersey 2025 | TRYBY,Official MI IPL jersey,49,600,true,false,true
CSK Jersey 2025,CRICKET,Official Chennai Super Kings IPL 2025 jersey,CSK-25-L,1299,1799,30,L,,,"Chennai Super Kings",IPL 2025,,,,,600,true,false,true`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) { setFile(f); setResult(null); setError(""); }
    else setError("Only .csv files are accepted");
  }, []);

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/products/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Import failed"); return; }
      setResult(data);
    } catch {
      setError("Network error — try again");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Bulk Product Import
          </h1>
          <p className="text-white/40 text-[12px]">Upload a CSV to create multiple products at once</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Download className="h-3.5 w-3.5" />
          Template CSV
        </button>
      </div>

      {/* CSV Format Guide */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-white font-black text-[13px] mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
          CSV FORMAT
        </h3>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
          {[
            ["name *", "Product name"],
            ["sport *", "CRICKET / FOOTBALL / GYM / RUNNING / RACKET / COMBAT / OTHER"],
            ["description *", "Product description text"],
            ["sku *", "Unique SKU for the default variant"],
            ["price *", "Selling price in ₹ (number)"],
            ["mrp", "MRP in ₹ (defaults to price)"],
            ["stock", "Inventory count (default 0)"],
            ["size", "Size label e.g. M, L, XL"],
            ["color", "Color label"],
            ["categoryId", "Category ID from admin (optional — uses first if blank)"],
            ["teamName", "Team e.g. Mumbai Indians"],
            ["leagueName", "League e.g. IPL 2025"],
            ["imageUrl", "Primary image URL"],
            ["metaTitle", "SEO title"],
            ["metaDescription", "SEO description"],
            ["shippingCost", "Shipping cost ₹ (default 0)"],
            ["costPrice", "Cost price for profit calc"],
            ["isActive", "true/false (default true)"],
            ["isFeatured", "true/false (default false)"],
            ["isOfficialLicensed", "true/false (default false)"],
          ].map(([field, desc]) => (
            <div key={field} className="flex gap-2 text-[11px]">
              <span className="font-mono font-bold text-[#F5C518] shrink-0 w-[130px]">{field}</span>
              <span className="text-white/40">{desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-white/25">* Required. Each row creates one product with one variant. Duplicate slugs or SKUs are skipped.</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className="rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all mb-4"
        style={{
          border: `2px dashed ${dragging ? "rgba(245,197,24,0.6)" : file ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`,
          background: dragging ? "rgba(245,197,24,0.04)" : file ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); setError(""); } }} />
        {file ? (
          <>
            <FileText className="h-10 w-10 text-[#4ADE80] mb-3" />
            <p className="text-[14px] font-bold text-white">{file.name}</p>
            <p className="text-[12px] text-white/40">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-white/20 mb-3" />
            <p className="text-[14px] font-semibold text-white/60">Drop your CSV here or click to browse</p>
            <p className="text-[12px] text-white/30 mt-1">Only .csv files accepted</p>
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#F87171]" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          {error}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={!file || importing}
        className="w-full h-12 rounded-xl font-black text-[#0D0D0D] text-[15px] transition-all disabled:opacity-40"
        style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
      >
        {importing ? "Importing..." : "Import Products"}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Created", count: result.created, color: "#4ADE80" },
              { label: "Skipped", count: result.skipped, color: "#F5C518" },
              { label: "Errors", count: result.errors, color: "#F87171" },
            ].map(({ label, count, color }) => (
              <div key={label} className="rounded-2xl p-4 text-center" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[28px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{count}</p>
                <p className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-[12px] font-bold text-white/50 uppercase tracking-widest">Row-by-row Results</p>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {result.results.map((r) => (
                <div key={r.row} className="flex items-center gap-3 px-5 py-3">
                  {r.status === "created" && <CheckCircle className="h-4 w-4 text-[#4ADE80] shrink-0" />}
                  {r.status === "skipped" && <AlertCircle className="h-4 w-4 text-[#F5C518] shrink-0" />}
                  {r.status === "error" && <XCircle className="h-4 w-4 text-[#F87171] shrink-0" />}
                  <span className="text-[11px] text-white/30 font-mono w-12 shrink-0">Row {r.row}</span>
                  <span className="text-[13px] text-white truncate flex-1">{r.name ?? "—"}</span>
                  {r.reason && <span className="text-[11px] text-white/40 truncate max-w-[200px]">{r.reason}</span>}
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    r.status === "created" ? "bg-[#4ADE80]/10 text-[#4ADE80]" :
                    r.status === "skipped" ? "bg-[#F5C518]/10 text-[#F5C518]" :
                    "bg-[#F87171]/10 text-[#F87171]"
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          {result.created > 0 && (
            <Link
              href="/admin/products"
              className="flex items-center justify-center h-10 rounded-xl text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              View All Products →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
