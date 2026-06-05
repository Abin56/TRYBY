"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Megaphone, Plus, Search, RefreshCw, Play, Pause, CheckCircle,
  Clock, X, ChevronRight, Zap, Mail, Gift, Tag,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  targetSegments: string[];
  targetAll: boolean;
  estimatedAudience: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  conversionCount: number;
  revenueGenerated: string;
  subject: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  EMAIL: Mail, WHATSAPP: Megaphone, COUPON: Tag, LOYALTY: Gift,
};

const TYPE_COLORS: Record<string, string> = {
  EMAIL: "#3B82F6", WHATSAPP: "#22C55E", COUPON: "#F5C518", LOYALTY: "#A78BFA",
};

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "#22C55E", SCHEDULED: "#3B82F6", PAUSED: "#EAB308",
  COMPLETED: "#6B7280", DRAFT: "#9CA3AF", CANCELLED: "#EF4444",
};

const SEGMENTS = [
  "VIP", "HIGH_VALUE", "RETURNING_CUSTOMER", "NEW_CUSTOMER",
  "AT_RISK", "CHURNED", "LOYALTY_MEMBER", "REFERRER",
];

const CAMPAIGN_TYPES: { value: string; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "EMAIL",     label: "Email Campaign",     desc: "Newsletter / promo email via Resend", icon: Mail },
  { value: "WHATSAPP",  label: "WhatsApp Blast",     desc: "WhatsApp message to customers",       icon: Megaphone },
  { value: "COUPON",    label: "Coupon Campaign",    desc: "Push a coupon code to a segment",     icon: Tag },
  { value: "LOYALTY",   label: "Loyalty Campaign",   desc: "Grant bonus loyalty points",          icon: Gift },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", description: "", type: "EMAIL",
    subject: "", body: "", ctaText: "", ctaUrl: "", imageUrl: "",
    targetAll: true, targetSegments: [] as string[],
    couponCode: "", loyaltyPoints: "", scheduledAt: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (search) params.set("q", search);
    const r = await fetch(`/api/admin/campaigns?${params}`);
    const json = await r.json();
    setCampaigns(json.campaigns ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setLoading(false);
  }, [page, status, type, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createCampaign() {
    if (!form.name || !form.type) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      targetAll: form.targetAll,
      targetSegments: form.targetSegments,
      subject: form.subject || undefined,
      body: form.body || undefined,
      ctaText: form.ctaText || undefined,
      ctaUrl: form.ctaUrl || undefined,
      imageUrl: form.imageUrl || undefined,
      couponCode: form.couponCode || undefined,
      scheduledAt: form.scheduledAt || undefined,
    };
    if (form.loyaltyPoints) body.loyaltyPoints = parseInt(form.loyaltyPoints);

    await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setShowCreate(false);
    setForm({ name: "", description: "", type: "EMAIL", subject: "", body: "", ctaText: "", ctaUrl: "", imageUrl: "", targetAll: true, targetSegments: [], couponCode: "", loyaltyPoints: "", scheduledAt: "" });
    fetchData();
  }

  async function doAction(id: string, action: string) {
    setActing(id + action);
    await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    fetchData();
  }

  const statuses = ["", "DRAFT", "SCHEDULED", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            CAMPAIGN MANAGER
          </h1>
          <p className="text-white/40 text-[13px]">{total} campaigns</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/marketing" className="text-[12px] text-white/40 hover:text-white px-3 py-1.5 rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>← Marketing</Link>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <Plus className="h-4 w-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: status === s ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              color: status === s ? "white" : "rgba(255,255,255,0.45)",
              border: `1px solid ${status === s ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
            }}>
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[180px]"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search className="h-4 w-4 text-white/30" />
          <input className="bg-transparent text-white text-[13px] outline-none flex-1 placeholder:text-white/25"
            placeholder="Search campaigns…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-[13px] text-white outline-none"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="">All Types</option>
          {CAMPAIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={fetchData} className="px-3 py-2 rounded-xl text-white/60 hover:text-white flex items-center gap-1.5 text-[13px]"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Campaign cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && <p className="text-white/30 col-span-3 text-center py-10">Loading…</p>}
        {!loading && campaigns.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <Megaphone className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No campaigns found</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-3 px-4 py-2 rounded-xl text-[13px] font-bold"
              style={{ background: "#E8FF47", color: "#0D0D0D" }}>
              Create your first campaign
            </button>
          </div>
        )}
        {!loading && campaigns.map((c) => {
          const TypeIcon = TYPE_ICONS[c.type] ?? Megaphone;
          const openRate = c.sentCount > 0 ? ((c.openCount / c.sentCount) * 100).toFixed(1) : "0";
          const convRate = c.sentCount > 0 ? ((c.conversionCount / c.sentCount) * 100).toFixed(1) : "0";
          return (
            <div key={c.id} className="rounded-xl p-5 space-y-4 flex flex-col"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${TYPE_COLORS[c.type] ?? "#6B7280"}18` }}>
                  <TypeIcon className="h-4 w-4" style={{ color: TYPE_COLORS[c.type] ?? "#9CA3AF" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[14px] truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                      style={{ color: STATUS_COLORS[c.status], background: `${STATUS_COLORS[c.status]}18` }}>
                      {c.status}
                    </span>
                    <span className="text-[11px] text-white/30">{c.type}</span>
                  </div>
                </div>
                <Link href={`/admin/marketing/campaigns/${c.id}`}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/08">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Description */}
              {c.description && (
                <p className="text-white/40 text-[12px] line-clamp-2">{c.description}</p>
              )}

              {/* Audience */}
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <span>{c.targetAll ? "All customers" : c.targetSegments.join(", ")}</span>
                <span>·</span>
                <span>{c.estimatedAudience.toLocaleString()} audience</span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Sent", value: c.sentCount.toLocaleString() },
                  { label: "Opens", value: `${openRate}%` },
                  { label: "Clicks", value: c.clickCount.toLocaleString() },
                  { label: "Conv.", value: `${convRate}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-white font-bold text-[14px]">{value}</p>
                    <p className="text-white/30 text-[10px]">{label}</p>
                  </div>
                ))}
              </div>

              {/* Revenue */}
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-white font-bold">₹{Number(c.revenueGenerated).toLocaleString("en-IN")}</p>
                  <p className="text-white/30 text-[10px]">Revenue generated</p>
                </div>
                {/* Action buttons */}
                <div className="flex gap-1">
                  {c.status === "DRAFT" && (
                    <button onClick={() => doAction(c.id, "start")}
                      disabled={acting === c.id + "start"}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                      <Play className="h-3 w-3" /> Start
                    </button>
                  )}
                  {c.status === "RUNNING" && (
                    <button onClick={() => doAction(c.id, "pause")}
                      disabled={acting === c.id + "pause"}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      style={{ background: "rgba(234,179,8,0.15)", color: "#EAB308" }}>
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  )}
                  {c.status === "PAUSED" && (
                    <button onClick={() => doAction(c.id, "resume")}
                      disabled={acting === c.id + "resume"}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                  {(c.status === "RUNNING" || c.status === "PAUSED") && (
                    <button onClick={() => doAction(c.id, "complete")}
                      disabled={acting === c.id + "complete"}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      style={{ background: "rgba(107,114,128,0.15)", color: "#9CA3AF" }}>
                      <CheckCircle className="h-3 w-3" /> Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className="h-8 w-8 rounded-lg text-[13px]"
              style={{ background: p === page ? "#E8FF47" : "#111111", color: p === page ? "#0D0D0D" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", fontWeight: p === page ? 700 : 400 }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
              style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)", zIndex: 10 }}>
              <h2 className="text-white font-bold text-[16px]">Create Campaign</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-white/40" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Campaign type selector */}
              <div>
                <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {CAMPAIGN_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.value} onClick={() => setForm(p => ({ ...p, type: t.value }))}
                        className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: form.type === t.value ? `${TYPE_COLORS[t.value]}15` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${form.type === t.value ? TYPE_COLORS[t.value] + "44" : "rgba(255,255,255,0.08)"}`,
                        }}>
                        <Icon className="h-4 w-4 shrink-0" style={{ color: TYPE_COLORS[t.value] }} />
                        <div>
                          <p className="text-white text-[12px] font-semibold">{t.label}</p>
                          <p className="text-white/30 text-[10px]">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name + description */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">Campaign Name *</label>
                  <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Diwali Flash Sale"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Internal notes…"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none resize-none placeholder:text-white/25"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>

              {/* Email-specific fields */}
              {(form.type === "EMAIL" || form.type === "WHATSAPP") && (
                <div className="space-y-3">
                  <div>
                    <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">Subject Line</label>
                    <input value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Email subject or message headline"
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
                      style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">Body / Message</label>
                    <textarea value={form.body} onChange={(e) => setForm(p => ({ ...p, body: e.target.value }))}
                      rows={4} placeholder="Campaign message content…"
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none resize-none placeholder:text-white/25"
                      style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">CTA Text</label>
                      <input value={form.ctaText} onChange={(e) => setForm(p => ({ ...p, ctaText: e.target.value }))}
                        placeholder="Shop Now"
                        className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
                        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">CTA URL</label>
                      <input value={form.ctaUrl} onChange={(e) => setForm(p => ({ ...p, ctaUrl: e.target.value }))}
                        placeholder="https://tryby.in/..."
                        className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
                        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon code */}
              {form.type === "COUPON" && (
                <div>
                  <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">Coupon Code</label>
                  <input value={form.couponCode} onChange={(e) => setForm(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))}
                    placeholder="DIWALI30"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white font-mono outline-none placeholder:text-white/25"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              )}

              {/* Loyalty points */}
              {form.type === "LOYALTY" && (
                <div>
                  <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">Bonus Points to Award</label>
                  <input value={form.loyaltyPoints} onChange={(e) => setForm(p => ({ ...p, loyaltyPoints: e.target.value }))}
                    type="number" placeholder="100"
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              )}

              {/* Audience */}
              <div>
                <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-2">Target Audience</label>
                <div className="flex gap-3 mb-3">
                  <button onClick={() => setForm(p => ({ ...p, targetAll: true, targetSegments: [] }))}
                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{ background: form.targetAll ? "#E8FF47" : "rgba(255,255,255,0.04)", color: form.targetAll ? "#0D0D0D" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    All Customers
                  </button>
                  <button onClick={() => setForm(p => ({ ...p, targetAll: false }))}
                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{ background: !form.targetAll ? "#E8FF47" : "rgba(255,255,255,0.04)", color: !form.targetAll ? "#0D0D0D" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    Select Segments
                  </button>
                </div>
                {!form.targetAll && (
                  <div className="flex flex-wrap gap-2">
                    {SEGMENTS.map((seg) => {
                      const selected = form.targetSegments.includes(seg);
                      return (
                        <button key={seg} onClick={() => setForm(p => ({
                          ...p,
                          targetSegments: selected
                            ? p.targetSegments.filter(s => s !== seg)
                            : [...p.targetSegments, seg]
                        }))}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            background: selected ? "rgba(232,255,71,0.15)" : "rgba(255,255,255,0.04)",
                            color: selected ? "#E8FF47" : "rgba(255,255,255,0.45)",
                            border: `1px solid ${selected ? "rgba(232,255,71,0.3)" : "rgba(255,255,255,0.08)"}`,
                          }}>
                          {seg.replace(/_/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div>
                <label className="text-white/50 text-[11px] uppercase tracking-wide block mb-1.5">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduledAt}
                  onChange={(e) => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white/70 outline-none"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
                <p className="text-white/25 text-[11px] mt-1">Leave blank to save as Draft</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl text-[13px] text-white/60"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Cancel
                </button>
                <button onClick={createCampaign} disabled={saving || !form.name}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: "#E8FF47", color: "#0D0D0D" }}>
                  <Zap className="h-4 w-4" />
                  {saving ? "Creating…" : "Create Campaign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
