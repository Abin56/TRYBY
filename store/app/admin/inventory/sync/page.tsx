"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Package, Clock, BarChart2, Zap, ChevronRight, X, Eye,
  Play, Store, TrendingUp, AlertCircle, Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SupplierHealth {
  id: string; companyName: string; tier: string;
  performance: number; totalMaps: number; healthScore: number;
  lastSyncedAt: string | null;
}

interface StatsData {
  suppliers:        SupplierHealth[];
  totalMappings:    number;
  unmappedVariants: number;
  lastSync:         { createdAt: string; syncSessionId: string; supplierId: string } | null;
  success30d:       number;
  failed30d:        number;
  noMapping30d:     number;
  lowStockMapped:   number;
  outOfStockMapped: number;
}

interface PreviewRow {
  supplierSku: string; variantId: string | null; variantSku: string | null;
  productName: string | null; supplierStock: number; currentStock: number | null;
  projectedStock: number | null; bufferApplied: number;
  status: "UPDATE" | "NO_CHANGE" | "NO_MAPPING" | "SKIP" | "OVERRIDE";
  note?: string;
}

interface PreviewData {
  preview: PreviewRow[];
  counts: { total: number; update: number; noChange: number; noMapping: number; skip: number; override: number };
  supplier: { id: string; companyName: string };
}

interface ApplyResult {
  sessionId: string; success: number; skipped: number;
  noMapping: number; failed: number; overridden: number;
  supplier: { companyName: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_COLOR: Record<string, string> = {
  BRONZE: "#CD7F32", SILVER: "#C0C0C0", GOLD: "#F5C518", PLATINUM: "#E5E4E2",
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)   return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function StatusBadge({ status }: { status: PreviewRow["status"] }) {
  const map = {
    UPDATE:     { label: "Will Update", bg: "rgba(96,165,250,0.12)",  color: "#60A5FA" },
    NO_CHANGE:  { label: "No Change",   bg: "rgba(255,255,255,0.05)", color: "#9CA3AF" },
    NO_MAPPING: { label: "No Mapping",  bg: "rgba(248,113,113,0.12)", color: "#F87171" },
    SKIP:       { label: "Skip",        bg: "rgba(245,197,24,0.12)",  color: "#F5C518" },
    OVERRIDE:   { label: "Overridden",  bg: "rgba(167,139,250,0.12)", color: "#A78BFA" },
  }[status];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black"
      style={{ background: map.bg, color: map.color }}>
      {map.label}
    </span>
  );
}

function KPICard({ label, value, sub, color = "#F5C518", icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <p className="text-white/40 text-[10px]">{label}</p>
      </div>
      <p className="font-black leading-none mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", color }}>
        {value}
      </p>
      {sub && <p className="text-white/30 text-[10px]">{sub}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SyncPage() {
  const [stats, setStats]   = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [file, setFile]     = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/sync-stats");
      if (res.ok) setStats(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function handleUploadPreview() {
    if (!file || !selectedSupplier) return;
    setUploading(true);
    setPreview(null);
    setApplyResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("supplierId", selectedSupplier);
      form.append("preview", "true");
      const res = await fetch("/api/admin/inventory/sync-upload", { method: "POST", body: form });
      if (res.ok) setPreview(await res.json());
    } finally { setUploading(false); }
  }

  async function handleApply() {
    if (!file || !selectedSupplier) return;
    setApplying(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("supplierId", selectedSupplier);
      form.append("preview", "false");
      const res = await fetch("/api/admin/inventory/sync-upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setApplyResult(data);
        setPreview(null);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        await loadStats();
      }
    } finally { setApplying(false); }
  }

  function resetUpload() {
    setFile(null);
    setPreview(null);
    setApplyResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const d = stats;

  return (
    <div className="p-4 lg:p-6 max-w-[1300px] space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Stock Sync Center
          </h1>
          <p className="text-white/35 text-[11px] mt-0.5">Keep TRYBY inventory in sync with supplier stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory/sync-logs"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <BarChart2 className="h-3.5 w-3.5" /> Sync Logs
          </Link>
          <Link href="/admin/products/supplier-sku"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-semibold text-[#F5C518]"
            style={{ border: "1px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.08)" }}>
            <Layers className="h-3.5 w-3.5" /> SKU Mappings
          </Link>
          <button onClick={loadStats}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      {d && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Total Mappings"    value={d.totalMappings}    color="#F5C518" icon={Zap} />
          <KPICard label="Unmapped Variants" value={d.unmappedVariants} color={d.unmappedVariants > 0 ? "#F87171" : "#4ADE80"} icon={AlertTriangle}
            sub={d.unmappedVariants > 0 ? "Need mapping" : "All mapped"} />
          <KPICard label="Synced (30d)"      value={d.success30d}       color="#4ADE80" icon={CheckCircle2} />
          <KPICard label="Failed (30d)"      value={d.failed30d}        color={d.failed30d > 0 ? "#F87171" : "#4ADE80"} icon={XCircle} />
          <KPICard label="Low Stock"         value={d.lowStockMapped}   color="#F5C518" icon={AlertTriangle} sub="mapped variants" />
          <KPICard label="Out of Stock"      value={d.outOfStockMapped} color={d.outOfStockMapped > 0 ? "#F87171" : "#4ADE80"} icon={Package} />
        </div>
      )}

      {/* Alerts */}
      {d && (d.unmappedVariants > 0 || d.outOfStockMapped > 0 || d.failed30d > 0) && (
        <div className="space-y-2">
          {d.unmappedVariants > 0 && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <AlertCircle className="h-4 w-4 text-[#F87171] shrink-0" />
              <p className="text-[12px] text-[#F87171] font-semibold">
                {d.unmappedVariants} active variant{d.unmappedVariants !== 1 ? "s" : ""} without supplier SKU mapping
              </p>
              <Link href="/admin/products/supplier-sku" className="ml-auto text-[11px] text-[#F87171] underline shrink-0">Fix →</Link>
            </div>
          )}
          {d.outOfStockMapped > 0 && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(245,197,24,0.07)", border: "1px solid rgba(245,197,24,0.2)" }}>
              <Package className="h-4 w-4 text-[#F5C518] shrink-0" />
              <p className="text-[12px] text-[#F5C518] font-semibold">
                {d.outOfStockMapped} mapped product{d.outOfStockMapped !== 1 ? "s are" : " is"} currently out of stock at supplier
              </p>
            </div>
          )}
          {d.failed30d > 0 && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.15)" }}>
              <XCircle className="h-4 w-4 text-[#F87171] shrink-0" />
              <p className="text-[12px] text-[#F87171] font-semibold">
                {d.failed30d} sync failure{d.failed30d !== 1 ? "s" : ""} in the last 30 days
              </p>
              <Link href="/admin/inventory/sync-logs?status=FAILED" className="ml-auto text-[11px] text-[#F87171] underline shrink-0">View →</Link>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* Left — CSV upload */}
        <div className="space-y-4">
          <h2 className="text-white font-black text-[13px]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>
            UPLOAD SUPPLIER STOCK CSV
          </h2>

          <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Supplier selector */}
            <div>
              <label className="block text-white/40 text-[10px] mb-1.5 font-semibold uppercase tracking-wider">Supplier</label>
              <select
                value={selectedSupplier}
                onChange={e => { setSelectedSupplier(e.target.value); resetUpload(); }}
                className="w-full h-10 rounded-xl border px-3 text-[13px] text-white bg-[#111] outline-none appearance-none"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <option value="">Select supplier…</option>
                {d?.suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.companyName} ({s.totalMaps} mappings)</option>
                ))}
              </select>
            </div>

            {/* File drop zone */}
            <div>
              <label className="block text-white/40 text-[10px] mb-1.5 font-semibold uppercase tracking-wider">Stock CSV File</label>
              <label
                className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
                  file ? "border-[#F5C518]" : "border-white/10 hover:border-white/20")}
                style={{ background: file ? "rgba(245,197,24,0.05)" : "rgba(255,255,255,0.02)" }}>
                <input
                  ref={fileRef}
                  type="file" accept=".csv,text/csv" className="sr-only"
                  onChange={e => { setFile(e.target.files?.[0] ?? null); setPreview(null); setApplyResult(null); }}
                />
                {file ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-[#F5C518]" />
                    <p className="text-[13px] font-semibold text-white">{file.name}</p>
                    <p className="text-[11px] text-white/30">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-white/20" />
                    <p className="text-[13px] font-semibold text-white/50">Drop CSV or click to browse</p>
                    <p className="text-[11px] text-white/25">Columns: supplierSku, stock</p>
                  </>
                )}
              </label>
            </div>

            {/* CSV format hint */}
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-white/30 font-mono leading-relaxed">
                supplierSku,stock<br />
                SUP-001-RED-XL,45<br />
                SUP-002-BLU-M,12<br />
                SUP-003-GRN-S,0
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUploadPreview}
                disabled={!file || !selectedSupplier || uploading}
                className="flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-[13px] text-white/70 disabled:opacity-40 hover:text-white transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}
              >
                {uploading ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                Preview Changes
              </button>
              {preview && (
                <button
                  onClick={handleApply}
                  disabled={applying || preview.counts.update === 0}
                  className="flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-[13px] text-[#0D0D0D] disabled:opacity-40 transition-all"
                  style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {applying ? <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Apply {preview.counts.update} Updates
                </button>
              )}
              {file && (
                <button onClick={resetUpload} className="flex h-10 w-10 items-center justify-center rounded-xl text-white/30 hover:text-white transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Apply result */}
          {applyResult && (
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
                <p className="text-[13px] font-bold text-[#4ADE80]">Sync complete — {applyResult.supplier.companyName}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                {[
                  ["Updated",   applyResult.success,    "#4ADE80"],
                  ["Skipped",   applyResult.skipped,    "#F5C518"],
                  ["No Mapping", applyResult.noMapping, "#F87171"],
                  ["Overridden", applyResult.overridden, "#A78BFA"],
                  ["Failed",    applyResult.failed,     "#F87171"],
                ].map(([label, val, color]) => (
                  <div key={String(label)} className="rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: String(color) }}>{String(val)}</p>
                    <p className="text-white/40">{String(label)}</p>
                  </div>
                ))}
              </div>
              <Link href={`/admin/inventory/sync-logs?sessionId=${applyResult.sessionId}`}
                className="flex items-center gap-1 text-[11px] text-[#4ADE80] hover:underline">
                View full log <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Preview table */}
          {preview && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <p className="text-white font-black text-[12px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Preview — {preview.supplier.companyName}
                </p>
                <div className="flex items-center gap-2 text-[10px]">
                  {Object.entries(preview.counts).filter(([k]) => k !== "total").map(([k, v]) => v > 0 ? (
                    <span key={k} className="rounded-full px-2 py-0.5 font-bold capitalize"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                      {v} {k}
                    </span>
                  ) : null)}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0" style={{ background: "#1A1A1A" }}>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Supplier SKU", "Product", "Supplier Stock", "Current", "After", "Buffer", "Status"].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-bold text-white/25 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {preview.preview.map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2 font-mono text-white/60">{row.supplierSku}</td>
                        <td className="px-3 py-2 text-white/70 max-w-[160px] truncate">{row.productName ?? <span className="text-white/20">—</span>}</td>
                        <td className="px-3 py-2 font-bold text-white">{row.supplierStock}</td>
                        <td className="px-3 py-2 text-white/50">{row.currentStock ?? "—"}</td>
                        <td className="px-3 py-2">
                          {row.projectedStock !== null ? (
                            <span className="font-bold" style={{ color: row.projectedStock === 0 ? "#F87171" : row.projectedStock <= 5 ? "#F5C518" : "#4ADE80" }}>
                              {row.projectedStock}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2 text-white/30">{row.bufferApplied > 0 ? `-${row.bufferApplied}` : "—"}</td>
                        <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right — Supplier health */}
        <div className="space-y-3">
          <h2 className="text-white font-black text-[13px]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>
            SUPPLIER SYNC HEALTH
          </h2>

          {d?.lastSync && (
            <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Clock className="h-3.5 w-3.5 text-white/30" />
              <p className="text-[11px] text-white/40">
                Last sync: <span className="text-white/70">{timeAgo(d.lastSync.createdAt)}</span>
              </p>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {!d || d.suppliers.length === 0 ? (
              <p className="py-8 text-center text-white/25 text-[12px]">No approved suppliers</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {d.suppliers.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
                    <Store className="h-4 w-4 text-white/20 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[12px] font-semibold text-white/80 truncate">{s.companyName}</p>
                        <span className="text-[9px] font-black shrink-0" style={{ color: TIER_COLOR[s.tier] }}>{s.tier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-white/[0.08]">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${s.healthScore}%`, background: s.healthScore > 70 ? "#4ADE80" : s.healthScore > 30 ? "#F5C518" : "#F87171" }} />
                        </div>
                        <span className="text-[10px] text-white/35 shrink-0">{s.healthScore}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-semibold text-white/40">{s.totalMaps} maps</p>
                      {s.lastSyncedAt && <p className="text-[9px] text-white/20">{timeAgo(s.lastSyncedAt)}</p>}
                    </div>
                    <button onClick={() => setSelectedSupplier(s.id)}
                      className="h-7 px-2 rounded-lg text-[10px] font-semibold text-[#F5C518] hover:bg-[#F5C518]/10 transition-colors shrink-0">
                      Sync
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/admin/inventory/sync-logs", icon: BarChart2, label: "All Sync Logs" },
              { href: "/admin/products/supplier-sku", icon: Layers, label: "SKU Mappings" },
              { href: "/admin/inventory", icon: Package, label: "Inventory" },
              { href: "/admin/suppliers", icon: TrendingUp, label: "Suppliers" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2 rounded-xl p-3 hover:bg-white/[0.03] transition-all"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Icon className="h-4 w-4 text-white/25 shrink-0" />
                <span className="text-[11px] font-semibold text-white/50 truncate">{label}</span>
                <ChevronRight className="h-3 w-3 text-white/15 ml-auto shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
