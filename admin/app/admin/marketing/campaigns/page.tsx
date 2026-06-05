"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MessageCircle, Tag, Zap, Plus, Send, Eye, Pause, Play,
  XCircle, Trash2, RefreshCw, Loader2, Users, TrendingUp,
  ChevronDown, CheckCircle2, Clock, AlertTriangle, Filter,
} from "lucide-react";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignType   = "EMAIL" | "WHATSAPP" | "COUPON" | "LOYALTY";
type CampaignStatus = "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";

interface Campaign {
  id:               string;
  name:             string;
  description?:     string;
  type:             CampaignType;
  status:           CampaignStatus;
  targetSegments:   string[];
  targetAll:        boolean;
  estimatedAudience: number;
  subject?:         string;
  body?:            string;
  couponCode?:      string;
  loyaltyPoints?:   number;
  scheduledAt?:     string;
  startedAt?:       string;
  completedAt?:     string;
  sentCount:        number;
  openCount:        number;
  clickCount:       number;
  conversionCount:  number;
  revenueGenerated: number;
  couponUsedCount:  number;
  createdAt:        string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<CampaignType, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  EMAIL:    { label: "Email",    icon: Mail,           color: "#2563EB", bg: "#EFF6FF", desc: "Send personalised emails to segments" },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle,  color: "#16A34A", bg: "#F0FDF4", desc: "WhatsApp message campaigns" },
  COUPON:   { label: "Coupon",   icon: Tag,            color: "#D97706", bg: "#FFFBEB", desc: "Targeted coupon distribution" },
  LOYALTY:  { label: "Loyalty",  icon: Zap,            color: "#7C3AED", bg: "#F5F3FF", desc: "Bonus points campaigns" },
};

const STATUS_CFG: Record<CampaignStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  DRAFT:     { label: "Draft",     color: "#6B7280", bg: "#F9FAFB",  icon: Clock       },
  SCHEDULED: { label: "Scheduled", color: "#2563EB", bg: "#EFF6FF",  icon: Clock       },
  RUNNING:   { label: "Running",   color: "#16A34A", bg: "#F0FDF4",  icon: Play        },
  PAUSED:    { label: "Paused",    color: "#D97706", bg: "#FFFBEB",  icon: Pause       },
  COMPLETED: { label: "Completed", color: "#9CA3AF", bg: "#F3F4F6",  icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2",  icon: XCircle     },
};

const SEGMENTS = [
  { value: "NEW_CUSTOMER",      label: "New Customers"       },
  { value: "RETURNING_CUSTOMER",label: "Returning Customers" },
  { value: "VIP",               label: "VIP Customers"       },
  { value: "HIGH_VALUE",        label: "High Value"          },
  { value: "AT_RISK",           label: "At Risk"             },
  { value: "CHURNED",           label: "Churned"             },
  { value: "LOYALTY_MEMBER",    label: "Loyalty Members"     },
  { value: "REFERRER",          label: "Referrers"           },
];

// ─── Field component ──────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] mb-1.5">
        {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all";
const TEXTAREA = "w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] resize-none transition-all";

// ─── Create drawer ────────────────────────────────────────────────────────────

interface CreateDrawerProps { open: boolean; onClose: () => void; onCreated: () => void; }

function CreateDrawer({ open, onClose, onCreated }: CreateDrawerProps) {
  const [type,       setType]       = useState<CampaignType>("EMAIL");
  const [name,       setName]       = useState("");
  const [subject,    setSubject]    = useState("");
  const [body,       setBody]       = useState("");
  const [coupon,     setCoupon]     = useState("");
  const [points,     setPoints]     = useState("");
  const [segments,   setSegments]   = useState<string[]>([]);
  const [targetAll,  setTargetAll]  = useState(false);
  const [schedDate,  setSchedDate]  = useState("");
  const [schedTime,  setSchedTime]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [estAudience,setEst]        = useState<number | null>(null);

  // Estimate audience when segments change
  useEffect(() => {
    if (targetAll) { setEst(null); return; }
    if (segments.length === 0) { setEst(0); return; }
    fetch(`${STORE_API}/api/admin/campaigns?page=1`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { segmentCounts?: { tags: string[]; _count: { _all: number } }[] }) => {
        const counts = d.segmentCounts ?? [];
        const n = counts.filter(s => s.tags.some((t: string) => segments.includes(t)))
          .reduce((acc, s) => acc + s._count._all, 0);
        setEst(n);
      })
      .catch(() => {});
  }, [segments, targetAll]);

  const toggleSegment = (v: string) => {
    setSegments(prev => prev.includes(v) ? prev.filter(s => s !== v) : [...prev, v]);
  };

  const reset = () => {
    setType("EMAIL"); setName(""); setSubject(""); setBody(""); setCoupon("");
    setPoints(""); setSegments([]); setTargetAll(false); setSchedDate(""); setSchedTime(""); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async (asDraft = false) => {
    if (!name.trim()) { setError("Campaign name is required"); return; }
    if (!targetAll && segments.length === 0) { setError("Select at least one target segment, or target all customers"); return; }
    if (!asDraft) {
      if ((type === "EMAIL" || type === "WHATSAPP") && !body.trim()) { setError("Message body is required"); return; }
      if (type === "COUPON" && !coupon.trim()) { setError("Coupon code is required"); return; }
      if (type === "LOYALTY" && !points) { setError("Points amount is required"); return; }
    }
    setLoading(true); setError("");
    try {
      const scheduledAt = schedDate && schedTime ? new Date(`${schedDate}T${schedTime}`).toISOString() : undefined;
      const res = await fetch(`${STORE_API}/api/admin/campaigns`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:            name.trim(),
          type,
          targetSegments:  segments,
          targetAll,
          subject:         subject.trim() || undefined,
          body:            body.trim() || undefined,
          couponCode:      coupon.trim().toUpperCase() || undefined,
          loyaltyPoints:   points ? parseInt(points) : undefined,
          scheduledAt,
          estimatedAudience: estAudience ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? "Failed to create campaign");
      onCreated(); handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
          <div>
            <h2 className="text-base font-extrabold text-[#111827]">Create Campaign</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Email · WhatsApp · Coupon · Loyalty</p>
          </div>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all">
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Campaign type */}
          <Field label="Campaign Type" required>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(TYPE_CFG) as [CampaignType, typeof TYPE_CFG[CampaignType]][]).map(([t, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all text-left",
                      type === t
                        ? "border-[#2563EB] text-[#2563EB]"
                        : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]"
                    )}
                    style={{ background: type === t ? cfg.bg : "white" }}
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p>{cfg.label}</p>
                      <p className="text-[10px] font-normal text-[#9CA3AF] mt-0.5">{cfg.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Name */}
          <Field label="Campaign Name" required>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monsoon Sale — VIP Drop" className={INPUT} />
          </Field>

          {/* Target */}
          <Field label="Target Audience" required hint={estAudience !== null ? `~${estAudience.toLocaleString("en-IN")} customers match` : undefined}>
            <div className="mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={targetAll} onChange={e => { setTargetAll(e.target.checked); if (e.target.checked) setSegments([]); }}
                  className="rounded" />
                <span className="text-sm font-medium text-[#374151]">All customers</span>
              </label>
            </div>
            {!targetAll && (
              <div className="flex flex-wrap gap-1.5">
                {SEGMENTS.map(s => (
                  <button key={s.value} onClick={() => toggleSegment(s.value)}
                    className={cn("rounded-full px-3 py-1 text-xs font-semibold border transition-all",
                      segments.includes(s.value)
                        ? "bg-[#111827] text-white border-[#111827]"
                        : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]"
                    )}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </Field>

          {/* Type-specific fields */}
          {(type === "EMAIL" || type === "WHATSAPP") && (
            <>
              <Field label="Subject / Title">
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder={type === "EMAIL" ? "Your email subject line" : "WhatsApp header text"}
                  className={INPUT} />
              </Field>
              <Field label="Message Body" required>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
                  placeholder={`Write your ${type === "EMAIL" ? "email" : "WhatsApp"} message…\nYou can use {name}, {coupon}, {points} placeholders.`}
                  className={TEXTAREA} />
              </Field>
            </>
          )}

          {type === "COUPON" && (
            <Field label="Coupon Code" required hint="The coupon must already exist in the Coupons section">
              <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                placeholder="e.g. MONSOON25" className={cn(INPUT, "font-mono uppercase")} />
            </Field>
          )}

          {type === "LOYALTY" && (
            <Field label="Bonus Points to Award" required hint="Points awarded to each qualifying customer">
              <input type="number" value={points} onChange={e => setPoints(e.target.value)}
                min={1} max={5000} placeholder="e.g. 100" className={INPUT} />
            </Field>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Schedule Date">
              <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Schedule Time (IST)">
              <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} className={INPUT} />
            </Field>
          </div>
          {!schedDate && <p className="text-[11px] text-[#9CA3AF] -mt-3">Leave blank to save as draft</p>}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />
              <p className="text-xs text-[#DC2626]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA]">
          <button onClick={() => handleSave(true)} disabled={loading}
            className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-white transition-all disabled:opacity-50">
            Save as Draft
          </button>
          <button onClick={() => handleSave(false)} disabled={loading}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[#111827] text-xs font-semibold text-white hover:bg-[#1F2937] transition-all disabled:opacity-50">
            {loading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            {schedDate ? "Schedule Campaign" : "Create Campaign"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onAction }: {
  campaign: Campaign;
  onAction: (id: string, action: "start" | "pause" | "resume" | "complete" | "cancel") => void;
}) {
  const tm  = TYPE_CFG[campaign.type];
  const sm  = STATUS_CFG[campaign.status];
  const Icon = tm.icon;
  const SIcon = sm.icon;

  const openRate  = campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : null;
  const convRate  = campaign.sentCount > 0 ? ((campaign.conversionCount / campaign.sentCount) * 100).toFixed(2) : null;
  const revenue   = Number(campaign.revenueGenerated);
  const fmt       = (n: number) => "₹" + n.toLocaleString("en-IN");

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="rounded-xl border border-[#E5E7EB] bg-white p-5 flex flex-col gap-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: tm.bg }}>
          <Icon className="h-5 w-5" style={{ color: tm.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#111827] truncate">{campaign.name}</p>
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0"
              style={{ background: sm.bg, color: sm.color }}>
              <SIcon className="h-2.5 w-2.5" />
              {sm.label}
            </span>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            {tm.label}
            {campaign.targetAll ? " · All Customers" : campaign.targetSegments.length > 0 ? ` · ${campaign.targetSegments.join(", ")}` : ""}
            {campaign.estimatedAudience > 0 && ` · ~${campaign.estimatedAudience.toLocaleString("en-IN")} reach`}
          </p>
        </div>
      </div>

      {/* Content preview */}
      {campaign.subject && (
        <p className="text-[11px] text-[#6B7280] italic line-clamp-1 border-l-2 border-[#E5E7EB] pl-2">&ldquo;{campaign.subject}&rdquo;</p>
      )}
      {campaign.couponCode && (
        <div className="flex items-center gap-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2">
          <Tag className="h-3.5 w-3.5 text-[#D97706]" />
          <span className="text-xs font-mono font-bold text-[#92400E]">{campaign.couponCode}</span>
          {campaign.couponUsedCount > 0 && (
            <span className="ml-auto text-[10px] text-[#D97706] font-semibold">{campaign.couponUsedCount} used</span>
          )}
        </div>
      )}
      {campaign.loyaltyPoints && (
        <div className="flex items-center gap-2 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-2">
          <Zap className="h-3.5 w-3.5 text-[#7C3AED]" />
          <span className="text-xs font-bold text-[#6D28D9]">+{campaign.loyaltyPoints} bonus points per customer</span>
        </div>
      )}

      {/* Metrics */}
      {campaign.sentCount > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#F3F4F6]">
          {[
            { icon: Users,     label: "Sent",   value: campaign.sentCount.toLocaleString("en-IN") },
            { icon: Eye,       label: "Opens",  value: openRate ? `${openRate}%` : "—" },
            { icon: TrendingUp,label: "Conv.",  value: convRate ? `${convRate}%` : "—" },
            { icon: Tag,       label: "Revenue",value: revenue > 0 ? fmt(revenue) : "—" },
          ].map(({ icon: I, label, value }) => (
            <div key={label} className="text-center">
              <I className="h-3 w-3 text-[#9CA3AF] mx-auto mb-1" />
              <p className="text-sm font-bold text-[#111827]">{value}</p>
              <p className="text-[10px] text-[#9CA3AF]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
          <Clock className="h-3 w-3" />
          Scheduled {new Date(campaign.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </div>
      )}

      {/* Revenue highlight */}
      {revenue > 0 && (
        <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#16A34A]">Revenue generated</span>
          <span className="text-sm font-extrabold text-[#16A34A]">{fmt(revenue)}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        {campaign.status === "DRAFT" && (
          <button onClick={() => onAction(campaign.id, "start")}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-[#111827] text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
            <Send className="h-3 w-3" /> Send Now
          </button>
        )}
        {campaign.status === "SCHEDULED" && (
          <button onClick={() => onAction(campaign.id, "start")}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-[#2563EB] text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors">
            <Send className="h-3 w-3" /> Send Now
          </button>
        )}
        {campaign.status === "RUNNING" && (
          <button onClick={() => onAction(campaign.id, "pause")}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
            <Pause className="h-3 w-3" /> Pause
          </button>
        )}
        {campaign.status === "PAUSED" && (
          <button onClick={() => onAction(campaign.id, "resume")}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-[#2563EB] text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors">
            <Play className="h-3 w-3" /> Resume
          </button>
        )}
        {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && (
          <button onClick={() => onAction(campaign.id, "cancel")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:text-[#DC2626] hover:border-[#FECACA] transition-colors"
            title="Cancel">
            <XCircle className="h-3.5 w-3.5" />
          </button>
        )}
        {campaign.status === "RUNNING" && (
          <button onClick={() => onAction(campaign.id, "complete")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:text-[#16A34A] hover:border-[#BBF7D0] transition-colors"
            title="Mark complete">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [typeFilter,setTypeFilter]= useState<CampaignType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL")   params.set("type",   typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res  = await fetch(`${STORE_API}/api/admin/campaigns?${params}`, { credentials: "include" });
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
      setTotal(data.total ?? 0);
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  }, [typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = useCallback(async (id: string, action: string) => {
    setActionLoading(id);
    try {
      await fetch(`${STORE_API}/api/admin/campaigns/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      load();
    } finally {
      setActionLoading(null);
    }
  }, [load]);

  // KPIs
  const kpiSent     = campaigns.reduce((a, c) => a + c.sentCount, 0);
  const kpiRevenue  = campaigns.reduce((a, c) => a + Number(c.revenueGenerated), 0);
  const kpiConv     = campaigns.reduce((a, c) => a + c.conversionCount, 0);
  const kpiRunning  = campaigns.filter(c => c.status === "RUNNING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Campaigns</h1>
          <p className="text-sm text-[#9CA3AF]">{total} campaigns · Email · WhatsApp · Coupon · Loyalty</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-all disabled:opacity-40">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
            <Plus className="h-3.5 w-3.5" /> Create Campaign
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue Generated", value: "₹" + kpiRevenue.toLocaleString("en-IN"), color: "#16A34A", bg: "#F0FDF4", icon: TrendingUp },
          { label: "Total Sent",         value: kpiSent.toLocaleString("en-IN"),          color: "#2563EB", bg: "#EFF6FF", icon: Send      },
          { label: "Conversions",        value: kpiConv.toLocaleString("en-IN"),           color: "#D97706", bg: "#FFFBEB", icon: Tag       },
          { label: "Running Now",        value: String(kpiRunning),                        color: "#7C3AED", bg: "#F5F3FF", icon: Play      },
        ].map(({ label, value, color, bg, icon: I }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
              <I className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-[#111827]">{value}</p>
              <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-1">
          {(["ALL", "EMAIL", "WHATSAPP", "COUPON", "LOYALTY"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                typeFilter === t ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#374151]")}>
              {t === "ALL" ? "All Types" : TYPE_CFG[t].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-1">
          {(["ALL", "DRAFT", "SCHEDULED", "RUNNING", "COMPLETED"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                statusFilter === s ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#374151]")}>
              {s === "ALL" ? "All Status" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#9CA3AF]" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-[#E5E7EB]">
          <Megaphone className="h-8 w-8 text-[#D1D5DB] mb-3" />
          <p className="text-sm font-semibold text-[#9CA3AF]">No campaigns yet</p>
          <p className="text-xs text-[#D1D5DB] mb-4">Create your first campaign to reach customers</p>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 h-8 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white">
            <Plus className="h-3 w-3" /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {campaigns.map(c => (
              <div key={c.id} style={{ opacity: actionLoading === c.id ? 0.6 : 1 }}>
                <CampaignCard campaign={c} onAction={handleAction} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create drawer */}
      <AnimatePresence>
        {creating && (
          <CreateDrawer open={creating} onClose={() => setCreating(false)} onCreated={load} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Megaphone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v2a9 9 0 009 9 9 9 0 009-9V9" /><path d="M11 3L8 6H5a1 1 0 00-1 1v4a1 1 0 001 1h3l3 3" /><line x1="15" y1="9" x2="19" y2="5" />
    </svg>
  );
}
