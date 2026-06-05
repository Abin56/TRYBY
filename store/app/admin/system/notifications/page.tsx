"use client";

import { useState, useEffect } from "react";
import { Bell, RefreshCw, AlertTriangle, CheckCircle2, CreditCard, Truck, Package, Zap, X } from "lucide-react";

interface SystemAlert {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  priority:  string;
  isRead:    boolean;
  createdAt: string;
}

interface AlertsData {
  notifications: SystemAlert[];
  total:         number;
  unread:        number;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: "rgba(248,113,113,0.12)", text: "#F87171" },
  HIGH:   { bg: "rgba(249,115,22,0.12)",  text: "#F97316" },
  NORMAL: { bg: "rgba(96,165,250,0.12)",  text: "#60A5FA" },
  LOW:    { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.3)" },
};

function alertIcon(type: string) {
  if (type.startsWith("payment"))  return <CreditCard  className="h-4 w-4 text-yellow-400" />;
  if (type.startsWith("shipping")) return <Truck       className="h-4 w-4 text-blue-400"   />;
  if (type.startsWith("order"))    return <Package     className="h-4 w-4 text-purple-400" />;
  if (type.startsWith("system"))   return <Zap         className="h-4 w-4 text-green-400"  />;
  return <Bell className="h-4 w-4 text-white/40" />;
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

export default function NotificationCenterPage() {
  const [data,    setData]    = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"all" | "unread">("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    // Fetch system notifications from admin notifications API with SYSTEM category
    const res = await fetch("/api/admin/notifications?category=SYSTEM&limit=100").catch(() => null);
    if (res?.ok) {
      const raw = await res.json();
      setData({
        notifications: raw.notifications ?? [],
        total:  raw.total  ?? 0,
        unread: raw.stats?.unread ?? 0,
      });
    }
    setLoading(false);
  }

  const shown = (data?.notifications ?? []).filter(n => filter === "all" || !n.isRead);

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Notification Center
          </h1>
          <p className="text-white/40 text-[13px]">
            System alerts · {data?.unread ?? 0} unread · platform-wide events
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter(f => f === "all" ? "unread" : "all")}
            className="h-9 px-3 rounded-xl text-[12px] font-bold border transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: filter === "unread" ? "#E8FF47" : "rgba(255,255,255,0.4)" }}>
            {filter === "all" ? "Show Unread" : "Show All"}
          </button>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Alert categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Payment Issues",   icon: CreditCard,  color: "#FBBF24" },
          { label: "Shipping Failures",icon: Truck,       color: "#60A5FA" },
          { label: "Supplier Issues",  icon: Package,     color: "#A78BFA" },
          { label: "System Alerts",    icon: Zap,         color: "#4ADE80" },
        ].map(({ label, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border p-3 text-center" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
            <Icon className="h-5 w-5 mx-auto mb-2" style={{ color }} />
            <p className="text-[11px] font-semibold text-white/50">{label}</p>
          </div>
        ))}
      </div>

      {/* Notifications list */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
        {!shown.length ? (
          <div className="flex flex-col items-center py-16">
            <CheckCircle2 className="h-8 w-8 text-green-400/30 mb-3" />
            <p className="text-white font-semibold text-[14px] mb-1">All clear!</p>
            <p className="text-white/30 text-[13px]">No {filter === "unread" ? "unread " : ""}system notifications</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {shown.map(n => {
              const ps = PRIORITY_STYLES[n.priority] ?? PRIORITY_STYLES.NORMAL;
              return (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3.5"
                  style={{ background: n.isRead ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <div className="mt-0.5 shrink-0">{alertIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-[13px] font-bold text-white">{n.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: ps.bg, color: ps.text }}>{n.priority}</span>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#E8FF47] shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] text-white/50">{n.body}</p>
                    <p className="text-[11px] text-white/25 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl p-3.5 border" style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.15)" }}>
        <p className="text-[11px] text-white/40 leading-relaxed">
          System notifications are generated automatically by payment failures, webhook errors, and shipping exceptions. Customer-facing notifications are managed separately in the customer notification system. Failed webhooks appear in <a href="/admin/payment-health" className="text-indigo-400 hover:underline">Payment Health</a>.
        </p>
      </div>
    </div>
  );
}
