"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, ShoppingBag, RotateCcw, Star, MessageSquare,
  StickyNote, Tag, Activity, Bell, Ban, UserCheck, Plus, X, Send,
  Crown, AlertTriangle, TrendingUp, IndianRupee,
} from "lucide-react";

interface CustomerDetail {
  user: { id: string; name: string | null; email: string | null; phone: string | null; createdAt: string; isActive: boolean; image: string | null };
  crmProfile: {
    segments: string[]; ltv: string; avgOrderValue: string; orderCount: number;
    refundRate: string; codUsageRate: string; riskScore: number; engagementScore: number;
    orderFrequency: string; daysSinceOrder: number; firstOrderAt: string | null;
    lastOrderAt: string | null; isBlocked: boolean; blockReason: string | null;
  } | null;
  riskProfile: { riskScore: number; riskLevel: string; isCodBlocked: boolean } | null;
  orders: { id: string; orderNumber: string; total: string; status: string; createdAt: string; payment: { method: string } | null }[];
  returns: { id: string; status: string; refundAmount: string | null; createdAt: string }[];
  reviews: { id: string; rating: number; createdAt: string; product: { name: string; slug: string } | null }[];
  tickets: { id: string; subject: string; status: string; priority: string; createdAt: string }[];
  notes: { id: string; note: string; adminId: string; createdAt: string }[];
  tags: { id: string; name: string; color: string }[];
  activity: { id: string; type: string; metadata: unknown; createdAt: string }[];
  loyaltyPoints: { id: string; type: string; points: number; balance: number; createdAt: string }[];
  notifications: { id: string; title: string; isRead: boolean; createdAt: string }[];
}

const SEGMENT_COLORS: Record<string, string> = {
  VIP: "#F5C518", HIGH_VALUE: "#A78BFA", REPEAT_BUYER: "#3B82F6",
  NEW_CUSTOMER: "#22C55E", LOYAL: "#06B6D4", WHOLESALE: "#8B5CF6",
  INACTIVE: "#6B7280", CHURNED: "#EF4444", REFUND_RISK: "#EC4899",
  COD_RISK: "#F97316", AT_RISK: "#EAB308",
};

const SEGMENT_LABELS: Record<string, string> = {
  VIP: "VIP", HIGH_VALUE: "High Value", REPEAT_BUYER: "Repeat Buyer",
  NEW_CUSTOMER: "New Customer", LOYAL: "Loyal", WHOLESALE: "Wholesale",
  INACTIVE: "Inactive", CHURNED: "Churned", REFUND_RISK: "Refund Risk",
  COD_RISK: "COD Risk", AT_RISK: "At Risk",
};

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22C55E", SHIPPED: "#3B82F6", CANCELLED: "#EF4444",
  PENDING: "#F97316", PROCESSING: "#EAB308", REFUNDED: "#A78BFA",
};

type TabId = "overview" | "orders" | "returns" | "reviews" | "tickets" | "activity" | "notes";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [newTicket, setNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "OTHER", priority: "MEDIUM" });

  const load = useCallback(async () => {
    setLoading(true);
    const [detail, tags] = await Promise.all([
      fetch(`/api/admin/crm/customers/${id}`).then((r) => r.json()),
      fetch("/api/admin/crm/segments").then((r) => r.json()),
    ]);
    setData(detail);
    setAllTags(tags.tags ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function addNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    await fetch(`/api/admin/crm/customers/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, adminId: "admin" }),
    });
    setSavingNote(false);
    setNote("");
    load();
  }

  async function addTag(tagId: string) {
    await fetch(`/api/admin/crm/customers/${id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId, adminId: "admin" }),
    });
    setShowTagPicker(false);
    load();
  }

  async function removeTag(tagId: string) {
    await fetch(`/api/admin/crm/customers/${id}/tags`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    load();
  }

  async function toggleBlock() {
    if (!data) return;
    const isBlocked = data.crmProfile?.isBlocked || !data.user.isActive;
    setBlocking(true);
    await fetch(`/api/admin/crm/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isBlocked ? "unblock" : "block", performedBy: "admin" }),
    });
    setBlocking(false);
    load();
  }

  async function rescore() {
    setRescoring(true);
    await fetch(`/api/admin/crm/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rescore" }),
    });
    setRescoring(false);
    load();
  }

  async function createTicket() {
    await fetch("/api/admin/crm/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, ...ticketForm, createdBy: "admin" }),
    });
    setNewTicket(false);
    setTicketForm({ subject: "", description: "", category: "OTHER", priority: "MEDIUM" });
    load();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  if (!data) return <p className="text-white/40 p-8">Not found.</p>;

  const { user, crmProfile, riskProfile, orders, returns, reviews, tickets, notes, tags, activity, loyaltyPoints } = data;
  const isBlocked = crmProfile?.isBlocked || !user.isActive;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders", count: orders.length },
    { id: "returns", label: "Returns", count: returns.length },
    { id: "reviews", label: "Reviews", count: reviews.length },
    { id: "tickets", label: "Tickets", count: tickets.length },
    { id: "activity", label: "Activity", count: activity.length },
    { id: "notes", label: "Notes", count: notes.length },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/crm/customers" className="text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[16px] font-bold shrink-0"
          style={{ background: isBlocked ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.15)" }}>
          {(user.name ?? "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white font-black text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {user.name ?? "Unknown"}
            </h1>
            {isBlocked && <span className="text-[11px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">BLOCKED</span>}
          </div>
          <p className="text-white/40 text-[13px]">{user.email} · {user.phone ?? "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2 ml-auto">
          {crmProfile?.segments.slice(0, 3).map((seg) => (
            <span key={seg} className="text-[11px] px-2.5 py-1 rounded-lg font-bold uppercase"
              style={{ color: SEGMENT_COLORS[seg], background: `${SEGMENT_COLORS[seg]}18` }}>
              {SEGMENT_LABELS[seg]}
            </span>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={rescore} disabled={rescoring}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/60 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`h-3.5 w-3.5 ${rescoring ? "animate-spin" : ""}`} />
          Re-score
        </button>
        <button onClick={toggleBlock} disabled={blocking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            color: isBlocked ? "#22C55E" : "#EF4444",
          }}>
          {isBlocked ? <UserCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
          {isBlocked ? "Unblock" : "Block Customer"}
        </button>
        <button onClick={() => setShowTagPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/60 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <Tag className="h-3.5 w-3.5" />
          Add Tag
        </button>
        <button onClick={() => setNewTicket(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/60 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <MessageSquare className="h-3.5 w-3.5" />
          Create Ticket
        </button>
        <Link href={`/admin/fraud/customers/${id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/60 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <AlertTriangle className="h-3.5 w-3.5" />
          Risk Profile
        </Link>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px]"
              style={{ background: `${tag.color}18`, border: `1px solid ${tag.color}44`, color: tag.color }}>
              {tag.name}
              <button onClick={() => removeTag(tag.id)} className="ml-1 hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats strip */}
      {crmProfile && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Lifetime Value", value: `₹${Number(crmProfile.ltv).toLocaleString("en-IN")}`, color: "#A78BFA" },
            { label: "Total Orders", value: crmProfile.orderCount, color: "#3B82F6" },
            { label: "Avg Order", value: `₹${Number(crmProfile.avgOrderValue).toLocaleString("en-IN")}`, color: "#06B6D4" },
            { label: "Refund Rate", value: `${(Number(crmProfile.refundRate) * 100).toFixed(0)}%`, color: Number(crmProfile.refundRate) >= 0.3 ? "#EF4444" : "#9CA3AF" },
            { label: "Risk Score", value: `${crmProfile.riskScore}/100`, color: crmProfile.riskScore >= 75 ? "#EF4444" : "#9CA3AF" },
            { label: "Engagement", value: `${crmProfile.engagementScore}/100`, color: "#22C55E" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-3 text-center"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[18px] font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
              <p className="text-white/40 text-[10px] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderColor: tab === t.id ? "#E8FF47" : "transparent",
              color: tab === t.id ? "white" : "rgba(255,255,255,0.4)",
            }}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 space-y-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-bold text-[14px]">Personal Info</h3>
              <div className="space-y-2 text-[13px]">
                {[
                  { label: "Email", value: user.email },
                  { label: "Phone", value: user.phone ?? "—" },
                  { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-IN") },
                  { label: "First Order", value: crmProfile?.firstOrderAt ? new Date(crmProfile.firstOrderAt).toLocaleDateString("en-IN") : "—" },
                  { label: "Last Order", value: crmProfile?.lastOrderAt ? new Date(crmProfile.lastOrderAt).toLocaleDateString("en-IN") : "Never" },
                  { label: "Days Since Order", value: crmProfile?.daysSinceOrder ?? "—" },
                  { label: "Order Frequency", value: crmProfile ? `${Number(crmProfile.orderFrequency).toFixed(1)}/mo` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5 space-y-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-bold text-[14px]">Risk & Fraud Profile</h3>
              <div className="space-y-2 text-[13px]">
                {[
                  { label: "Risk Level", value: riskProfile?.riskLevel ?? "—" },
                  { label: "Risk Score", value: riskProfile?.riskScore ?? "—" },
                  { label: "COD Blocked", value: riskProfile?.isCodBlocked ? "Yes" : "No" },
                  { label: "COD Usage", value: crmProfile ? `${(Number(crmProfile.codUsageRate) * 100).toFixed(0)}%` : "—" },
                  { label: "Refund Rate", value: crmProfile ? `${(Number(crmProfile.refundRate) * 100).toFixed(0)}%` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
              <Link href={`/admin/fraud/customers/${id}`}
                className="block text-center text-[12px] py-2 rounded-lg mt-2"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                View Full Risk Profile →
              </Link>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Order #", "Date", "Amount", "Method", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-[11px] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-white/02" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="text-blue-400 hover:text-blue-300 font-medium">{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-white/50">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-white font-bold">₹{Number(o.total).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-white/60">{o.payment?.method ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium"
                        style={{ color: STATUS_COLORS[o.status] ?? "#9CA3AF", background: `${STATUS_COLORS[o.status] ?? "#9CA3AF"}18` }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Returns */}
        {tab === "returns" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Date", "Status", "Refund Amount"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-[11px] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3 text-white/50">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/08 text-white/60">{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white">
                      {r.refundAmount ? `₹${Number(r.refundAmount).toLocaleString("en-IN")}` : "—"}
                    </td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-white/30">No returns</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Reviews */}
        {tab === "reviews" && (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5" style={{ color: s <= r.rating ? "#F5C518" : "rgba(255,255,255,0.1)", fill: s <= r.rating ? "#F5C518" : "none" }} />
                  ))}
                </div>
                <p className="text-white text-[13px] flex-1">{r.product?.name ?? "—"}</p>
                <p className="text-white/40 text-[11px]">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-white/30 text-center py-8">No reviews</p>}
          </div>
        )}

        {/* Tickets */}
        {tab === "tickets" && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button onClick={() => setNewTicket(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                style={{ background: "#E8FF47", color: "#0D0D0D" }}>
                <Plus className="h-3.5 w-3.5" /> New Ticket
              </button>
            </div>
            {tickets.map((t) => (
              <Link key={t.id} href={`/admin/crm/tickets/${t.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/02 transition-colors"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <MessageSquare className="h-4 w-4 text-white/30 shrink-0" />
                <div className="flex-1">
                  <p className="text-white text-[13px]">{t.subject}</p>
                  <p className="text-white/40 text-[11px]">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/08 text-white/50">{t.status}</span>
                <span className="text-[11px]" style={{ color: t.priority === "URGENT" ? "#EF4444" : t.priority === "HIGH" ? "#F97316" : "#9CA3AF" }}>
                  {t.priority}
                </span>
              </Link>
            ))}
            {tickets.length === 0 && <p className="text-white/30 text-center py-8">No tickets</p>}
          </div>
        )}

        {/* Activity */}
        {tab === "activity" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="h-6 w-6 rounded-full bg-white/05 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="h-3 w-3 text-white/40" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[12px] font-medium">{a.type.replace(/_/g, " ")}</p>
                    <p className="text-white/30 text-[11px]">{new Date(a.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <p className="text-white/30 text-center py-8">No activity</p>}
            </div>
          </div>
        )}

        {/* Notes */}
        {tab === "notes" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this customer…"
                rows={3}
                className="flex-1 px-3 py-2 rounded-xl text-[13px] text-white outline-none resize-none placeholder:text-white/25"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button onClick={addNote} disabled={savingNote || !note.trim()}
                className="px-4 py-2 rounded-xl disabled:opacity-40 flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ background: "#E8FF47", color: "#0D0D0D" }}>
                <Send className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
            {notes.map((n) => (
              <div key={n.id} className="px-4 py-3 rounded-xl"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white/80 text-[13px]">{n.note}</p>
                <p className="text-white/30 text-[11px] mt-1">by {n.adminId} · {new Date(n.createdAt).toLocaleString("en-IN")}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-white/30 text-center py-4">No notes yet</p>}
          </div>
        )}
      </div>

      {/* Tag Picker Modal */}
      {showTagPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl p-5 w-80 space-y-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Add Tag</h3>
              <button onClick={() => setShowTagPicker(false)}><X className="h-4 w-4 text-white/40" /></button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {allTags.filter((t) => !tags.some((ct) => ct.id === t.id)).map((tag) => (
                <button key={tag.id} onClick={() => addTag(tag.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/05 text-left">
                  <div className="h-3 w-3 rounded-full" style={{ background: tag.color }} />
                  <span className="text-white text-[13px]">{tag.name}</span>
                </button>
              ))}
              {allTags.length === 0 && <p className="text-white/30 text-center py-4 text-[13px]">No tags yet. Create some in Segments.</p>}
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {newTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl p-5 w-full max-w-md space-y-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Create Support Ticket</h3>
              <button onClick={() => setNewTicket(false)}><X className="h-4 w-4 text-white/40" /></button>
            </div>
            <input value={ticketForm.subject} onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Subject"
              className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            <textarea value={ticketForm.description} onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description…" rows={4}
              className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none resize-none placeholder:text-white/25"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div className="flex gap-2">
              <select value={ticketForm.category} onChange={(e) => setTicketForm((p) => ({ ...p, category: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl text-[13px] text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                {["ORDER","RETURN","PAYMENT","SHIPPING","PRODUCT","ACCOUNT","FRAUD","OTHER"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={ticketForm.priority} onChange={(e) => setTicketForm((p) => ({ ...p, priority: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl text-[13px] text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                {["LOW","MEDIUM","HIGH","URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNewTicket(false)} className="flex-1 py-2.5 rounded-xl text-[13px] text-white/60"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
              <button onClick={createTicket} disabled={!ticketForm.subject || !ticketForm.description}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
                style={{ background: "#E8FF47", color: "#0D0D0D" }}>Create Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
