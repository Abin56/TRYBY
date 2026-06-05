"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, Play, Pause, BarChart2, Package,
  TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ChevronUp, Loader2, FileText, Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SyncProfile {
  id: string;
  supplierId: string;
  syncEnabled: boolean;
  syncFrequency: string;
  marginPercent: number;
  minProfitAmount: number;
  autoHideOutOfStock: boolean;
  autoAdjustPrice: boolean;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  consecutiveFailures: number;
  supplier: { id: string; companyName: string; logoUrl: string | null };
}

interface KPI {
  totalSyncedSuppliers: number;
  stockChangesToday: number;
  priceChangesToday: number;
  failedSyncsToday: number;
  skippedToday: number;
}

interface StockLog {
  id: string;
  syncSessionId: string;
  supplierId: string;
  supplierSku: string;
  variantId: string | null;
  stockBefore: number | null;
  stockAfter: number | null;
  supplierStock: number;
  bufferApplied: number;
  status: string;
  errorReason: string | null;
  createdAt: string;
  supplier: { companyName: string };
}

interface PriceLog {
  id: string;
  supplierId: string;
  variantId: string;
  supplierSku: string;
  oldCostPrice: number | null;
  newCostPrice: number;
  oldSellPrice: number | null;
  newSellPrice: number;
  marginUsed: number;
  createdAt: string;
  supplier: { companyName: string };
}

interface ReportData {
  hiddenDueToOOS: { id: string; note: string | null; createdAt: string; product: { id: string; name: string; slug: string } }[];
  repriced: PriceLog[];
  supplierReliability: { supplierId: string; companyName: string; successRate: number; success: number; failed: number; skipped: number }[];
}

type Tab = "overview" | "profiles" | "logs" | "reports";
type LogTab = "stock" | "price";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<string, string> = {
  MINUTES_15: "Every 15 min",
  MINUTES_30: "Every 30 min",
  HOURS_1: "Every hour",
  HOURS_6: "Every 6 hours",
  DAILY: "Daily",
};

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    SUCCESS:    { bg: "rgba(52,211,153,0.12)",  text: "#34D399" },
    FAILED:     { bg: "rgba(248,113,113,0.12)", text: "#F87171" },
    SKIPPED:    { bg: "rgba(156,163,175,0.12)", text: "#9CA3AF" },
    NO_MAPPING: { bg: "rgba(245,197,24,0.12)",  text: "#F5C518" },
    OVERRIDDEN: { bg: "rgba(96,165,250,0.12)",  text: "#60A5FA" },
  };
  const s = map[status] ?? map.SKIPPED;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: s.bg, color: s.text }}>
      {status}
    </span>
  );
}

// ── Profile Edit Modal ────────────────────────────────────────────────────────

function ProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: SyncProfile | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    syncEnabled: profile?.syncEnabled ?? false,
    syncFrequency: profile?.syncFrequency ?? "HOURS_1",
    marginPercent: ((profile?.marginPercent ?? 0.3) * 100).toFixed(1),
    minProfitAmount: String(profile?.minProfitAmount ?? 0),
    autoHideOutOfStock: profile?.autoHideOutOfStock ?? true,
    autoAdjustPrice: profile?.autoAdjustPrice ?? false,
  });

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      await fetch("/api/admin/supplier-sync/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: profile.supplierId,
          ...form,
          marginPercent: parseFloat(form.marginPercent) / 100,
          minProfitAmount: parseFloat(form.minProfitAmount),
        }),
      });
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-white mb-4">
          Sync Profile — {profile?.supplier.companyName}
        </h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/70">Sync Enabled</span>
            <button
              onClick={() => setForm((f) => ({ ...f, syncEnabled: !f.syncEnabled }))}
              className={cn("relative w-11 h-6 rounded-full transition-colors", form.syncEnabled ? "bg-green-500" : "bg-white/20")}
            >
              <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform", form.syncEnabled && "translate-x-5")} />
            </button>
          </label>

          <div>
            <label className="text-sm text-white/60 mb-1 block">Sync Frequency</label>
            <select
              className="w-full rounded-lg px-3 py-2 text-sm text-white"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              value={form.syncFrequency}
              onChange={(e) => setForm((f) => ({ ...f, syncFrequency: e.target.value }))}
            >
              {Object.entries(FREQ_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Margin %</label>
              <input
                type="number" min="0" max="100" step="0.5"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                value={form.marginPercent}
                onChange={(e) => setForm((f) => ({ ...f, marginPercent: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Min Profit (₹)</label>
              <input
                type="number" min="0" step="1"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                value={form.minProfitAmount}
                onChange={(e) => setForm((f) => ({ ...f, minProfitAmount: e.target.value }))}
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/70">Auto-hide out-of-stock</span>
            <button
              onClick={() => setForm((f) => ({ ...f, autoHideOutOfStock: !f.autoHideOutOfStock }))}
              className={cn("relative w-11 h-6 rounded-full transition-colors", form.autoHideOutOfStock ? "bg-blue-500" : "bg-white/20")}
            >
              <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform", form.autoHideOutOfStock && "translate-x-5")} />
            </button>
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/70">Auto-adjust price</span>
            <button
              onClick={() => setForm((f) => ({ ...f, autoAdjustPrice: !f.autoAdjustPrice }))}
              className={cn("relative w-11 h-6 rounded-full transition-colors", form.autoAdjustPrice ? "bg-purple-500" : "bg-white/20")}
            >
              <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform", form.autoAdjustPrice && "translate-x-5")} />
            </button>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex-1 rounded-lg py-2 text-sm font-bold text-black transition-opacity disabled:opacity-50" style={{ background: "#F5C518" }}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SupplierSyncPage() {
  const [tab, setTab]                 = useState<Tab>("overview");
  const [logTab, setLogTab]           = useState<LogTab>("stock");
  const [kpi, setKpi]                 = useState<KPI | null>(null);
  const [profiles, setProfiles]       = useState<SyncProfile[]>([]);
  const [stockLogs, setStockLogs]     = useState<StockLog[]>([]);
  const [priceLogs, setPriceLogs]     = useState<PriceLog[]>([]);
  const [report, setReport]           = useState<ReportData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [syncing, setSyncing]         = useState<string | null>(null); // supplierId | "all"
  const [editProfile, setEditProfile] = useState<SyncProfile | null>(null);
  const [logPage, setLogPage]         = useState(1);
  const [logPages, setLogPages]       = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/supplier-sync");
      if (res.ok) {
        const d = await res.json();
        setKpi(d.kpi);
        setProfiles(d.profiles ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  const loadLogs = useCallback(async (type: LogTab, page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/supplier-sync/logs?type=${type}&page=${page}`);
      if (res.ok) {
        const d = await res.json();
        setLogPages(d.pages ?? 1);
        if (type === "stock") setStockLogs(d.logs ?? []);
        else setPriceLogs(d.logs ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/supplier-sync/reports?days=7");
      if (res.ok) setReport(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "overview" || tab === "profiles") loadOverview();
    if (tab === "logs") loadLogs(logTab, logPage);
    if (tab === "reports") loadReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === "logs") loadLogs(logTab, logPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logTab, logPage]);

  async function runSync(supplierId?: string) {
    const key = supplierId ?? "all";
    setSyncing(key);
    try {
      const body = supplierId ? { supplierId, feed: [] } : {};
      const res = await fetch("/api/admin/supplier-sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) await loadOverview();
    } finally { setSyncing(null); }
  }

  // ── KPI Cards ───────────────────────────────────────────────────────────────

  const kpiCards = kpi ? [
    { label: "Synced Suppliers", value: kpi.totalSyncedSuppliers, icon: <Package className="h-4 w-4" />, color: "#60A5FA" },
    { label: "Stock Changes (24h)", value: kpi.stockChangesToday, icon: <TrendingUp className="h-4 w-4" />, color: "#34D399" },
    { label: "Price Changes (24h)", value: kpi.priceChangesToday, icon: <BarChart2 className="h-4 w-4" />, color: "#A78BFA" },
    { label: "Failed Syncs (24h)", value: kpi.failedSyncsToday, icon: <AlertTriangle className="h-4 w-4" />, color: "#F87171" },
    { label: "Skipped (24h)", value: kpi.skippedToday, icon: <TrendingDown className="h-4 w-4" />, color: "#F5C518" },
  ] : [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Supplier Sync Engine</h1>
          <p className="text-sm text-white/40">Automated stock &amp; price synchronisation</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runSync()}
            disabled={syncing === "all"}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-black transition-opacity disabled:opacity-50"
            style={{ background: "#F5C518" }}
          >
            {syncing === "all" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync All
          </button>
          <button
            onClick={tab === "reports" ? loadReport : loadOverview}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {kpi && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {kpiCards.map((c) => (
            <div key={c.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: c.color }}>{c.icon}<span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{c.label}</span></div>
              <p className="text-2xl font-black text-white">{c.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["overview", "profiles", "logs", "reports"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all", tab === t ? "text-black" : "text-white/50 hover:text-white")}
            style={tab === t ? { background: "#F5C518" } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {profiles.length === 0 && !loading && (
            <p className="text-white/40 text-sm text-center py-12">No sync profiles configured yet. Go to Profiles tab to set up suppliers.</p>
          )}
          {profiles.map((p) => (
            <div key={p.id} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                {p.supplier.logoUrl ? <img src={p.supplier.logoUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-white/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{p.supplier.companyName}</p>
                <p className="text-xs text-white/40">{FREQ_LABELS[p.syncFrequency]} · Margin {(p.marginPercent * 100).toFixed(1)}%</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] text-white/40">Last sync</p>
                  <p className="text-xs text-white/70">{timeAgo(p.lastSyncAt)}</p>
                </div>
                {p.consecutiveFailures > 0 && (
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                    <AlertTriangle className="h-3 w-3" />{p.consecutiveFailures} fails
                  </span>
                )}
                <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", p.syncEnabled ? "text-green-400" : "text-white/30")} style={{ background: p.syncEnabled ? "rgba(52,211,153,0.10)" : "rgba(255,255,255,0.05)" }}>
                  {p.syncEnabled ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {p.syncEnabled ? "Active" : "Paused"}
                </span>
                <button
                  onClick={() => runSync(p.supplierId)}
                  disabled={!!syncing}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors disabled:opacity-40"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {syncing === p.supplierId ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Profiles Tab ── */}
      {tab === "profiles" && (
        <div className="space-y-3">
          <p className="text-sm text-white/40 mb-4">Configure automation rules per supplier. Click Edit to change settings.</p>
          {profiles.map((p) => (
            <div key={p.id} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white mb-1">{p.supplier.companyName}</p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#9CA3AF" }}>
                      {FREQ_LABELS[p.syncFrequency]}
                    </span>
                    <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "rgba(167,139,250,0.10)", color: "#A78BFA" }}>
                      Margin {(p.marginPercent * 100).toFixed(1)}%
                    </span>
                    <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "rgba(245,197,24,0.10)", color: "#F5C518" }}>
                      Min profit {fmt(p.minProfitAmount)}
                    </span>
                    {p.autoHideOutOfStock && <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "rgba(96,165,250,0.10)", color: "#60A5FA" }}>Auto-hide OOS</span>}
                    {p.autoAdjustPrice && <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "rgba(52,211,153,0.10)", color: "#34D399" }}>Auto-price</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[11px] font-bold px-2 py-1 rounded-full", p.syncEnabled ? "text-green-400" : "text-white/30")} style={{ background: p.syncEnabled ? "rgba(52,211,153,0.10)" : "rgba(255,255,255,0.05)" }}>
                    {p.syncEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={() => setEditProfile(p)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Settings className="h-3 w-3" /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
          {profiles.length === 0 && !loading && (
            <p className="text-white/40 text-sm text-center py-12">Supplier sync profiles will appear here once suppliers are onboarded.</p>
          )}
        </div>
      )}

      {/* ── Logs Tab ── */}
      {tab === "logs" && (
        <div>
          {/* Log type switcher */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["stock", "price"] as LogTab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setLogTab(t); setLogPage(1); }}
                className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-all", logTab === t ? "text-black" : "text-white/50 hover:text-white")}
                style={logTab === t ? { background: "#F5C518" } : {}}
              >
                {t === "stock" ? "Stock Logs" : "Price Logs"}
              </button>
            ))}
          </div>

          {/* Stock logs */}
          {logTab === "stock" && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Supplier", "SKU", "Stock Before→After", "Supplier Stock", "Status", "Time"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.map((log, i) => (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                        style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
                      >
                        <td className="px-4 py-3 text-white/80 font-medium">{log.supplier.companyName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-white/60">{log.supplierSku}</td>
                        <td className="px-4 py-3 text-white/70">
                          {log.stockBefore !== null ? `${log.stockBefore} → ${log.stockAfter}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-white/70">{log.supplierStock}</td>
                        <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                        <td className="px-4 py-3 text-white/40 text-xs">{timeAgo(log.createdAt)}</td>
                      </tr>
                      {expandedLog === log.id && log.errorReason && (
                        <tr key={`${log.id}-err`} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(248,113,113,0.04)" }}>
                          <td colSpan={6} className="px-4 py-2 text-xs text-red-400 font-mono">{log.errorReason}</td>
                        </tr>
                      )}
                    </>
                  ))}
                  {stockLogs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30 text-sm">No stock sync logs yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Price logs */}
          {logTab === "price" && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Supplier", "SKU", "Cost Change", "Price Change", "Margin", "Time"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priceLogs.map((log, i) => (
                    <tr key={log.id} className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                      <td className="px-4 py-3 text-white/80 font-medium">{log.supplier.companyName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white/60">{log.supplierSku}</td>
                      <td className="px-4 py-3 text-white/70">
                        {log.oldCostPrice != null ? fmt(log.oldCostPrice) : "—"} → {fmt(log.newCostPrice)}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {log.oldSellPrice != null ? fmt(log.oldSellPrice) : "—"} → {fmt(log.newSellPrice)}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{(log.marginUsed * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{timeAgo(log.createdAt)}</td>
                    </tr>
                  ))}
                  {priceLogs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30 text-sm">No price sync logs yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {logPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setLogPage((p) => Math.max(1, p - 1))} disabled={logPage === 1} className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:text-white disabled:opacity-30" style={{ background: "rgba(255,255,255,0.06)" }}>Prev</button>
              <span className="text-sm text-white/40">Page {logPage} of {logPages}</span>
              <button onClick={() => setLogPage((p) => Math.min(logPages, p + 1))} disabled={logPage === logPages} className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:text-white disabled:opacity-30" style={{ background: "rgba(255,255,255,0.06)" }}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* ── Reports Tab ── */}
      {tab === "reports" && report && (
        <div className="space-y-8">
          {/* Supplier Reliability */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Supplier Reliability (7 days)</h2>
            <div className="space-y-2">
              {report.supplierReliability.map((s) => (
                <div key={s.supplierId} className="flex items-center gap-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="flex-1 text-sm font-semibold text-white min-w-0 truncate">{s.companyName}</p>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="text-green-400">{s.success} ok</span>
                    <span className="text-red-400">{s.failed} failed</span>
                    <span>{s.skipped} skipped</span>
                  </div>
                  <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${s.successRate}%`, background: s.successRate >= 95 ? "#34D399" : s.successRate >= 80 ? "#F5C518" : "#F87171" }} />
                  </div>
                  <span className="text-sm font-bold w-10 text-right" style={{ color: s.successRate >= 95 ? "#34D399" : s.successRate >= 80 ? "#F5C518" : "#F87171" }}>
                    {s.successRate}%
                  </span>
                </div>
              ))}
              {report.supplierReliability.length === 0 && <p className="text-white/30 text-sm text-center py-8">No sync data in the last 7 days.</p>}
            </div>
          </section>

          {/* Hidden due to OOS */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-400" /> Products Hidden Due to Out-of-Stock (7 days)</h2>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Product", "Hidden At"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.hiddenDueToOOS.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                      <td className="px-4 py-3 text-white/80">{r.product?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{timeAgo(r.createdAt)}</td>
                    </tr>
                  ))}
                  {report.hiddenDueToOOS.length === 0 && (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-white/30 text-sm">No products hidden this week.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Repriced products */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-purple-400" /> Automatically Repriced (7 days)</h2>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Supplier", "SKU", "Old Price", "New Price", "When"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.repriced.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                      <td className="px-4 py-3 text-white/80">{r.supplier.companyName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white/60">{r.supplierSku}</td>
                      <td className="px-4 py-3 text-white/50">{r.oldSellPrice != null ? fmt(r.oldSellPrice) : "—"}</td>
                      <td className="px-4 py-3 text-white font-semibold">{fmt(r.newSellPrice)}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{timeAgo(r.createdAt)}</td>
                    </tr>
                  ))}
                  {report.repriced.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">No repricing events this week.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Edit Modal */}
      {editProfile && (
        <ProfileModal
          profile={editProfile}
          onClose={() => setEditProfile(null)}
          onSave={loadOverview}
        />
      )}
    </div>
  );
}
