"use client";

import { useState } from "react";
import { Download, Package, ShoppingBag, Users, Store, Star, Loader2, CheckCircle2 } from "lucide-react";

interface Dataset {
  key:         string;
  label:       string;
  description: string;
  icon:        React.ElementType;
  color:       string;
  rowHint:     string;
}

const DATASETS: Dataset[] = [
  { key: "users",     label: "Users",     description: "All registered customers and admin accounts", icon: Users,     color: "#60A5FA", rowHint: "id, name, email, phone, role, status, createdAt" },
  { key: "orders",    label: "Orders",    description: "Full order history with customer and payment info", icon: ShoppingBag, color: "#FBBF24", rowHint: "id, orderNumber, status, total, customer, payment, createdAt" },
  { key: "products",  label: "Products",  description: "Product catalog with variants, pricing, and stock", icon: Package,   color: "#A78BFA", rowHint: "id, name, slug, sport, category, sku, price, stock, createdAt" },
  { key: "suppliers", label: "Suppliers", description: "All supplier accounts with tier and SLA data", icon: Store,     color: "#4ADE80", rowHint: "id, company, contact, email, status, tier, slaScore" },
  { key: "reviews",   label: "Reviews",   description: "Approved customer reviews with ratings", icon: Star,      color: "#F97316", rowHint: "id, rating, title, product, customer, verified, createdAt" },
];

export default function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [done,      setDone]      = useState<string | null>(null);
  const [limit,     setLimit]     = useState(10000);

  async function exportDataset(key: string) {
    setExporting(key);
    setDone(null);
    try {
      const res = await fetch("/api/admin/export", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dataset: key, limit, format: "csv" }),
      });
      if (!res.ok) {
        alert("Export failed: " + await res.text());
        return;
      }
      const rowCount = res.headers.get("X-Row-Count") ?? "?";
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tryby-${key}-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(key);
      setTimeout(() => setDone(null), 3000);
      console.log(`[export] ${key}: ${rowCount} rows`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">
      <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Data Export Center</h1>
      <p className="text-white/40 text-[13px] mb-6">Export platform data as CSV. All exports are logged in the audit trail.</p>

      {/* Row limit */}
      <div className="rounded-2xl border p-4 mb-6 flex items-center gap-4" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-[13px] font-semibold text-white/60 shrink-0">Max rows per export</p>
        <div className="flex gap-2">
          {[1000, 10000, 50000, 100000].map(n => (
            <button key={n} onClick={() => setLimit(n)}
              className="h-7 px-3 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: limit === n ? "rgba(232,255,71,0.12)" : "rgba(255,255,255,0.06)",
                color: limit === n ? "#E8FF47" : "rgba(255,255,255,0.4)",
              }}>
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset cards */}
      <div className="space-y-3">
        {DATASETS.map(ds => (
          <div key={ds.key} className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${ds.color}15` }}>
              <ds.icon className="h-5 w-5" style={{ color: ds.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white">{ds.label}</p>
              <p className="text-[12px] text-white/40">{ds.description}</p>
              <p className="font-mono text-[10px] text-white/20 mt-1">{ds.rowHint}</p>
            </div>
            <button onClick={() => exportDataset(ds.key)}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-60 transition-all shrink-0"
              style={{
                background: done === ds.key ? "#4ADE80" : "#E8FF47",
                color: "#0D0D0D",
              }}>
              {exporting === ds.key
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Exporting…</>
                : done === ds.key
                ? <><CheckCircle2 className="h-4 w-4" /> Done!</>
                : <><Download className="h-4 w-4" /> Export CSV</>
              }
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl p-3.5 border" style={{ background: "rgba(245,197,24,0.04)", borderColor: "rgba(245,197,24,0.12)" }}>
        <p className="text-[11px] text-white/40 leading-relaxed">
          <strong className="text-yellow-400/80">Privacy notice:</strong> Exports contain personal data (email addresses, phone numbers).
          Handle exported files according to your privacy policy. All exports are recorded in the audit log.
          Maximum {limit.toLocaleString()} rows per export — increase the limit above for larger datasets.
        </p>
      </div>
    </div>
  );
}
