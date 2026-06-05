"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Send, Users, RefreshCw, Loader2, CheckCircle2,
  AlertTriangle, Filter, Search, Package, CreditCard,
  Truck, Star, Megaphone, BarChart3, Eye, MousePointer,
  XCircle, Plus, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "ORDER" | "PAYMENT" | "SHIPPING" | "RETURN" | "LOYALTY" | "REFERRAL" | "PROMOTION" | "SYSTEM" | "WISHLIST" | "STOCK";

interface NotifRecord {
  id:          string;
  userId:      string;
  category:    Category;
  type:        string;
  priority:    string;
  title:       string;
  body:        string;
  isRead:      boolean;
  sentByAdmin: boolean;
  createdAt:   string;
  user:        { id: string; name?: string; email?: string };
}

interface DeliveryStat {
  channel: string;
  status:  string;
  _count:  { _all: number };
}

// ─── Notification type options ────────────────────────────────────────────────

const NOTIF_TYPES = [
  { value: "system.announcement",   label: "Announcement",         category: "SYSTEM"    },
  { value: "promo.flash_sale",       label: "Flash Sale",           category: "PROMOTION" },
  { value: "promo.coupon_drop",      label: "Coupon Drop",          category: "PROMOTION" },
  { value: "promo.loyalty_campaign", label: "Loyalty Campaign",     category: "PROMOTION" },
  { value: "loyalty.earned",         label: "Loyalty Points Earned",category: "LOYALTY"   },
  { value: "referral.reward_earned", label: "Referral Reward",      category: "REFERRAL"  },
  { value: "stock.back_in_stock",    label: "Back In Stock",        category: "STOCK"     },
  { value: "wishlist.price_drop",    label: "Price Drop Alert",     category: "WISHLIST"  },
  { value: "promo.general",          label: "General Promo",        category: "PROMOTION" },
];

const SEGMENTS = [
  { value: "NEW_CUSTOMER",       label: "New Customers"       },
  { value: "RETURNING_CUSTOMER", label: "Returning Customers" },
  { value: "VIP",                label: "VIP Customers"       },
  { value: "HIGH_VALUE",         label: "High Value"          },
  { value: "AT_RISK",            label: "At Risk"             },
  { value: "CHURNED",            label: "Churned"             },
  { value: "LOYALTY_MEMBER",     label: "Loyalty Members"     },
  { value: "REFERRER",           label: "Referrers"           },
];

const CAT_COLOR: Record<string, string> = {
  ORDER: "#2563EB", PAYMENT: "#16A34A", SHIPPING: "#D97706", RETURN: "#7C3AED",
  LOYALTY: "#F59E0B", REFERRAL: "#10B981", PROMOTION: "#EF4444", SYSTEM: "#6B7280",
  WISHLIST: "#EC4899", STOCK: "#059669",
};

// ─── Send panel ───────────────────────────────────────────────────────────────

function SendPanel({ onSent }: { onSent: () => void }) {
  const [type,       setType]      = useState("system.announcement");
  const [title,      setTitle]     = useState("");
  const [body,       setBody]      = useState("");
  const [actionUrl,  setActionUrl] = useState("");
  const [actionLabel,setActionLabel]= useState("");
  const [targetAll,  setTargetAll] = useState(false);
  const [segments,   setSegments]  = useState<string[]>([]);
  const [loading,    setLoading]   = useState(false);
  const [result,     setResult]    = useState<{ succeeded: number; failed: number; targetCount: number } | null>(null);
  const [error,      setError]     = useState("");

  const toggle = (v: string) => setSegments(p => p.includes(v) ? p.filter(s => s !== v) : [...p, v]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and body are required"); return; }
    if (!targetAll && segments.length === 0) { setError("Select at least one segment or target all"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${STORE_API}/api/admin/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, title: title.trim(), body: body.trim(), actionUrl: actionUrl || undefined, actionLabel: actionLabel || undefined, segments, targetAll }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.formErrors?.[0] ?? "Send failed");
      setResult(d);
      setTitle(""); setBody(""); setActionUrl(""); setActionLabel("");
      setSegments([]); setTargetAll(false);
      onSent();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const INPUT = "w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white transition-all";

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F3F4F6]">
        <Send className="h-4 w-4 text-[#2563EB]" />
        <h2 className="text-sm font-bold text-[#111827]">Send Notification</h2>
      </div>
      <div className="px-5 py-5 space-y-4">
        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Notification Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className={cn(INPUT, "appearance-none")}>
            {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Target */}
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-2">Target Audience</label>
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input type="checkbox" checked={targetAll} onChange={e => { setTargetAll(e.target.checked); if (e.target.checked) setSegments([]); }} className="rounded" />
            <span className="text-sm font-medium text-[#374151]">All active customers</span>
          </label>
          {!targetAll && (
            <div className="flex flex-wrap gap-1.5">
              {SEGMENTS.map(s => (
                <button key={s.value} onClick={() => toggle(s.value)}
                  className={cn("rounded-full px-3 py-1 text-xs font-semibold border transition-all",
                    segments.includes(s.value)
                      ? "bg-[#111827] text-white border-[#111827]"
                      : "border-[#E5E7EB] text-[#6B7280] hover:border-[#374151]")}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title + body */}
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Flash Sale — 20% Off Today Only!" maxLength={200} className={INPUT} />
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#374151]">Message *</label>
            <span className={cn("text-[10px] font-medium", body.length > 900 ? "text-[#DC2626]" : "text-[#9CA3AF]")}>{body.length}/1000</span>
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} maxLength={1000}
            placeholder="Write your notification message…"
            className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white resize-none transition-all" />
        </div>

        {/* CTA (optional) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Action URL</label>
            <input value={actionUrl} onChange={e => setActionUrl(e.target.value)} placeholder="/products" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Button Label</label>
            <input value={actionLabel} onChange={e => setActionLabel(e.target.value)} placeholder="Shop Now" maxLength={50} className={INPUT} />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />
            <p className="text-xs text-[#DC2626]">{error}</p>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#16A34A] font-semibold">
              Sent to {result.succeeded.toLocaleString("en-IN")} / {result.targetCount.toLocaleString("en-IN")} customers
              {result.failed > 0 && ` · ${result.failed} failed`}
            </p>
          </motion.div>
        )}

        <button onClick={handleSend} disabled={loading}
          className="flex w-full items-center justify-center gap-2 h-9 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {loading ? "Sending…" : "Send Notification"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const [notifs,  setNotifs]  = useState<NotifRecord[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState<{ category: string; _count: { _all: number } }[]>([]);
  const [delivStats, setDelivStats] = useState<DeliveryStat[]>([]);
  const [q,       setQ]       = useState("");
  const [category,setCategory]= useState<Category | "ALL">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "ALL") params.set("category", category);
      if (q.trim()) params.set("q", q.trim());
      const res  = await fetch(`${STORE_API}/api/admin/notifications?${params}`, { credentials: "include" });
      const d    = await res.json();
      setNotifs(d.notifications ?? []);
      setTotal(d.total ?? 0);
      setStats(d.stats ?? []);
      setDelivStats(d.deliveryStats ?? []);
    } finally {
      setLoading(false);
    }
  }, [q, category]);

  useEffect(() => { load(); }, [load]);

  // Delivery analytics
  const inAppSent     = delivStats.filter(d => d.channel === "IN_APP"  && d.status === "DELIVERED").reduce((a, d) => a + d._count._all, 0);
  const emailSent     = delivStats.filter(d => d.channel === "EMAIL"   && d.status === "SENT").reduce((a, d) => a + d._count._all, 0);
  const emailOpened   = delivStats.filter(d => d.channel === "EMAIL"   && d.status === "OPENED").reduce((a, d) => a + d._count._all, 0);
  const emailClicked  = delivStats.filter(d => d.channel === "EMAIL"   && d.status === "CLICKED").reduce((a, d) => a + d._count._all, 0);
  const waSent        = delivStats.filter(d => d.channel === "WHATSAPP"&& d.status === "SENT").reduce((a, d) => a + d._count._all, 0);

  const openRate  = emailSent > 0 ? ((emailOpened / emailSent) * 100).toFixed(1) : "—";
  const clickRate = emailOpened > 0 ? ((emailClicked / emailOpened) * 100).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Notification Center</h1>
          <p className="text-sm text-[#9CA3AF]">Send targeted notifications · Track delivery · Manage history</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-all">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Left: Send panel */}
        <div className="space-y-4">
          <SendPanel onSent={load} />

          {/* Delivery analytics */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-[#9CA3AF]" />
              <p className="text-sm font-bold text-[#111827]">Delivery Analytics (30d)</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "In-App Delivered", value: inAppSent.toLocaleString("en-IN"),  icon: Bell,          color: "#2563EB" },
                { label: "Email Sent",        value: emailSent.toLocaleString("en-IN"),  icon: Send,          color: "#16A34A" },
                { label: "Email Open Rate",   value: `${openRate}%`,                    icon: Eye,           color: "#D97706" },
                { label: "Email Click Rate",  value: `${clickRate}%`,                   icon: MousePointer,  color: "#7C3AED" },
                { label: "WhatsApp Sent",     value: waSent > 0 ? waSent.toLocaleString("en-IN") : "—", icon: Send, color: "#10B981" },
              ].map(({ label, value, icon: I, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <I className="h-3.5 w-3.5" style={{ color }} />
                    {label}
                  </div>
                  <span className="font-bold text-[#111827]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By category */}
          {stats.length > 0 && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <p className="text-sm font-bold text-[#111827] mb-3">By Category (30d)</p>
              <div className="space-y-2">
                {stats.slice(0, 8).map(s => (
                  <div key={s.category} className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: CAT_COLOR[s.category] ?? "#9CA3AF" }} />
                    <span className="flex-1 text-[#6B7280] capitalize">{s.category.toLowerCase()}</span>
                    <span className="font-bold text-[#111827]">{s._count._all.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Notification history */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title, email…"
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white pl-8 pr-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value as Category | "ALL")}
              className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:border-[#2563EB] transition-all">
              <option value="ALL">All categories</option>
              {["ORDER","PAYMENT","SHIPPING","RETURN","LOYALTY","REFERRAL","PROMOTION","SYSTEM"].map(c => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">Notification History</p>
              <p className="text-xs text-[#9CA3AF]">{total.toLocaleString("en-IN")} total</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Bell className="h-7 w-7 text-[#D1D5DB] mb-2" />
                <p className="text-sm text-[#9CA3AF]">No notifications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Customer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Notification</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {notifs.map(n => (
                      <tr key={n.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-[#111827] truncate max-w-[120px]">{n.user.name ?? "Customer"}</p>
                          <p className="text-[10px] text-[#9CA3AF] truncate max-w-[120px]">{n.user.email}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-xs font-semibold text-[#111827] line-clamp-1">{n.title}</p>
                          <p className="text-[10px] text-[#9CA3AF] line-clamp-1">{n.body}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: CAT_COLOR[n.category] ?? "#6B7280", background: `${CAT_COLOR[n.category] ?? "#6B7280"}15` }}>
                            {n.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {n.isRead
                            ? <span className="text-[10px] font-bold text-[#16A34A] flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Read</span>
                            : <span className="text-[10px] font-bold text-[#D97706] flex items-center gap-1"><Bell className="h-3 w-3" /> Unread</span>}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-[#9CA3AF] whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
