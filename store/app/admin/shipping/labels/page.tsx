"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, X, Download, FileText, Package, CheckSquare,
  Square, RefreshCw, ChevronDown, AlertTriangle, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShipmentRow {
  id: string;
  awbCode: string | null;
  courier: string | null;
  status: string;
  labelUrl: string | null;
  dispatchedAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    user: { name: string | null; email: string | null };
    shippingAddress: { city: string; state: string };
  };
}

const COURIER_LABELS: Record<string, string> = {
  SHIPROCKET: "Shiprocket", DELHIVERY: "Delhivery", DTDC: "DTDC",
  INDIA_POST: "India Post", BLUEDART: "BlueDart", XPRESSBEES: "Xpressbees",
  ECOM_EXPRESS: "Ecom Express", OTHER: "Other",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [dQ, setDQ]               = useState("");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [err, setErr]             = useState("");
  const [provider, setProvider]   = useState("SHIPROCKET");

  useEffect(() => { const t = setTimeout(() => setDQ(search), 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: "PICKED_UP" });
    if (dQ) params.set("q", dQ);
    try {
      const res = await fetch(`/api/admin/shipping?${params}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setShipments((data.shipments ?? []).filter((s: ShipmentRow) => s.awbCode));
      }
    } finally { setLoading(false); }
  }, [dQ]);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === shipments.length) setSelected(new Set());
    else setSelected(new Set(shipments.map(s => s.id)));
  }

  async function downloadSingle(awb: string, labelUrl: string | null) {
    if (labelUrl) { window.open(labelUrl, "_blank"); return; }
    // Fetch via our label API
    window.open(`/api/admin/shipping/label?awb=${awb}&provider=${provider}`, "_blank");
  }

  async function downloadBulk() {
    const selectedShipments = shipments.filter(s => selected.has(s.id) && s.awbCode);
    if (!selectedShipments.length) return;
    setDownloading(true); setErr("");
    try {
      const awbs = selectedShipments.map(s => s.awbCode!).join(",");
      window.open(`/api/admin/shipping/label?awbs=${awbs}&provider=${provider}`, "_blank");
    } catch { setErr("Failed to generate labels"); }
    finally { setDownloading(false); }
  }

  async function generateManifest() {
    const orderIds = shipments.filter(s => selected.has(s.id)).map(s => s.order.id);
    if (!orderIds.length) return;
    setDownloading(true); setErr("");
    try {
      const res = await fetch("/api/admin/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      for (const r of data.results ?? []) {
        if (r.url) window.open(r.url, "_blank");
      }
    } catch { setErr("Failed to generate manifest"); }
    finally { setDownloading(false); }
  }

  const allSelected = selected.size === shipments.length && shipments.length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Shipping Labels
          </h1>
          <p className="text-white/40 text-[13px]">Download labels · Generate manifests · Pickup sheets</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Provider selector */}
          <div className="relative">
            <select value={provider} onChange={e => setProvider(e.target.value)}
              className="rounded-xl pl-3.5 pr-9 text-[12px] font-bold text-white outline-none appearance-none"
              style={{ height: "40px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <option value="SHIPROCKET">Shiprocket</option>
              <option value="DELHIVERY">Delhivery</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          </div>
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number, AWB, customer..."
            className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"><X className="h-4 w-4" /></button>}
        </div>

        {selected.size > 0 && (
          <>
            <span className="text-[12px] text-white/40 font-semibold shrink-0">{selected.size} selected</span>
            <button onClick={downloadBulk} disabled={downloading}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-50"
              style={{ background: "#F5C518" }}>
              <Download className="h-4 w-4" />
              {downloading ? "Generating..." : `Download ${selected.size} Labels`}
            </button>
            <button onClick={generateManifest} disabled={downloading}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold text-white/60 hover:text-white disabled:opacity-50"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              <FileText className="h-4 w-4" /> Manifest
            </button>
          </>
        )}
      </div>

      {err && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-[12px] font-semibold text-[#F87171]"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Header row */}
        <div className="hidden lg:grid px-5 py-3 items-center gap-3 border-b text-[11px] font-bold uppercase tracking-widest text-white/30"
          style={{ gridTemplateColumns: "40px 1fr 160px 120px 100px 120px", borderColor: "rgba(255,255,255,0.05)" }}>
          <button onClick={toggleAll} className="flex items-center justify-center">
            {allSelected
              ? <CheckSquare className="h-4 w-4 text-[#F5C518]" />
              : <Square className="h-4 w-4 text-white/20" />}
          </button>
          <span>Order / Customer</span>
          <span>AWB Code</span>
          <span>Courier</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
          </div>
        ) : !shipments.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Package className="h-10 w-10 text-white/10" />
            <p className="text-[13px] text-white/30">No shipments with AWB codes found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {shipments.map(s => (
              <div key={s.id} className="hidden lg:grid px-5 py-3.5 items-center gap-3"
                style={{ gridTemplateColumns: "40px 1fr 160px 120px 100px 120px" }}>
                <button onClick={() => toggleSelect(s.id)} className="flex items-center justify-center">
                  {selected.has(s.id)
                    ? <CheckSquare className="h-4 w-4 text-[#F5C518]" />
                    : <Square className="h-4 w-4 text-white/20 hover:text-white/50" />}
                </button>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white/80">{s.order.orderNumber}</p>
                  <p className="text-[11px] text-white/35 truncate">{s.order.user.name ?? s.order.user.email}</p>
                  <p className="text-[10px] text-white/20">{s.order.shippingAddress.city}, {s.order.shippingAddress.state}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-mono font-bold text-white/70 truncate">{s.awbCode ?? "—"}</p>
                </div>
                <p className="text-[11px] text-white/50">{COURIER_LABELS[s.courier ?? ""] ?? s.courier ?? "—"}</p>
                <p className="text-[11px] text-white/40 capitalize">{s.status.replace(/_/g, " ").toLowerCase()}</p>
                <div className="flex items-center gap-1.5 justify-end">
                  {s.labelUrl ? (
                    <a href={s.labelUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold text-[#0D0D0D]"
                      style={{ background: "#F5C518" }}>
                      <Download className="h-3 w-3" /> Label
                    </a>
                  ) : s.awbCode ? (
                    <button onClick={() => downloadSingle(s.awbCode!, s.labelUrl)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold text-white/50 hover:text-white"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Download className="h-3 w-3" /> Fetch
                    </button>
                  ) : null}
                  <a href={`/admin/orders/${s.order.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 hover:text-white hover:bg-white/08 transition-all">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-white/25 leading-relaxed">
        Labels are fetched directly from the courier provider. Ensure your Shiprocket or Delhivery credentials are configured.
        Bulk downloads open the provider's consolidated PDF in a new tab.
      </p>
    </div>
  );
}
