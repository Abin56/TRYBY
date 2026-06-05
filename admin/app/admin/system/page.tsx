"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Database, Users, Package, ShoppingCart, FileText, Image,
  CheckCircle2, XCircle, RefreshCw, Clock, AlertTriangle,
  Shield, RotateCcw, Tag, Star, Megaphone, Activity,
  ChevronRight, Zap,
} from "lucide-react";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemData {
  status:    "healthy" | "error";
  queryMs:   number;
  checkedAt: string;
  error?:    string;
  counts: {
    users:    { total: number; admins: number; customers: number; suppliers: number; adminProfilesLinked: number };
    products: { total: number; active: number; inactive: number; variants: number; outOfStock: number; lowStock: number; categories: number };
    orders:   { total: number; pending: number };
    returns:  { total: number; pending: number };
    coupons:  { total: number; active: number };
    reviews:  { total: number; pending: number };
    content:  { blocks: number; published: number; draft: number; announcements: number; activeAnnouncements: number; siteSettings: number; media: number };
    audit:    { totalLogs: number };
  };
  migrations: { name: string; appliedAt: string; steps: number }[];
  recentAudit: { id: string; action: string; resourceType?: string; resourceName?: string; adminName?: string; createdAt: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("en-IN"); }

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={cn("inline-flex h-2 w-2 rounded-full", ok ? "bg-[#16A34A] animate-pulse" : "bg-[#DC2626]")} />
  );
}

function StatRow({ label, value, sub, warn }: { label: string; value: string | number; sub?: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F9FAFB] last:border-0">
      <div className="min-w-0">
        <span className="text-sm text-[#374151]">{label}</span>
        {sub && <span className="text-xs text-[#9CA3AF] ml-2">{sub}</span>}
      </div>
      <span className={cn("text-sm font-bold tabular-nums", warn ? "text-[#D97706]" : "text-[#111827]")}>
        {typeof value === "number" ? fmt(value) : value}
      </span>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
  badge?: { value: string | number; warn?: boolean };
}

function SectionCard({ title, icon, iconBg, children, badge }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: iconBg }}>
            {icon}
          </div>
          <span className="text-sm font-bold text-[#111827]">{title}</span>
        </div>
        {badge != null && (
          <span className={cn("text-sm font-extrabold", badge.warn ? "text-[#D97706]" : "text-[#111827]")}>
            {fmt(Number(badge.value))}
          </span>
        )}
      </div>
      <div className="px-5 py-1">{children}</div>
    </motion.div>
  );
}

// ─── Action labels ────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  PRODUCT_CREATED: "Created product",   PRODUCT_UPDATED: "Updated product",   PRODUCT_DELETED: "Deleted product",
  ORDER_STATUS_CHANGED: "Changed order status",
  RETURN_APPROVED: "Approved return",   RETURN_REJECTED: "Rejected return",   RETURN_REFUNDED: "Processed refund",
  CONTENT_PUBLISHED: "Published content", CONTENT_UPDATED: "Updated content",
  ADMIN_CREATED: "Created admin",       ADMIN_UPDATED: "Updated admin",       ADMIN_DISABLED: "Disabled admin",
  LOGIN: "Logged in",                   SETTINGS_UPDATED: "Updated settings",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SystemPage() {
  const [data,     setData]    = useState<SystemData | null>(null);
  const [loading,  setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${STORE_API}/api/admin/system`, { credentials: "include" });
      const d   = await res.json();
      setData(d);
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 s
  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const c = data?.counts;
  const isHealthy = data?.status === "healthy";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">System Health</h1>
          <p className="text-sm text-[#9CA3AF]">Database status, row counts and recent activity</p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatRelative(lastFetch.toISOString())}
            </span>
          )}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── DB Status banner ── */}
      {loading && !data ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 flex items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin text-[#9CA3AF]" />
          <span className="text-sm text-[#9CA3AF]">Connecting to database…</span>
        </div>
      ) : data?.status === "error" ? (
        <div className="rounded-xl border border-[#FECDD3] bg-[#FFF1F2] px-5 py-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#DC2626]">Database Unreachable</p>
            <p className="text-xs text-[#DC2626]/80 mt-0.5 font-mono">{data.error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
            <div>
              <p className="text-sm font-bold text-[#16A34A]">Database Healthy — Neon PostgreSQL</p>
              <p className="text-xs text-[#16A34A]/70 mt-0.5">
                1 migration applied · Query responded in {data.queryMs}ms
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold">
            <StatusDot ok={true} /> Live
          </div>
        </div>
      ) : null}

      {/* ── Attention items ── */}
      {data && isHealthy && (() => {
        const alerts = [
          c!.products.outOfStock   > 0  && { msg: `${fmt(c!.products.outOfStock)} variant${c!.products.outOfStock > 1 ? "s" : ""} out of stock`,         color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" },
          c!.products.lowStock     > 0  && { msg: `${fmt(c!.products.lowStock)} variant${c!.products.lowStock > 1 ? "s" : ""} at low stock (≤5 units)`,   color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
          c!.orders.pending        > 0  && { msg: `${fmt(c!.orders.pending)} order${c!.orders.pending > 1 ? "s" : ""} pending`,                           color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          c!.returns.pending       > 0  && { msg: `${fmt(c!.returns.pending)} return request${c!.returns.pending > 1 ? "s" : ""} awaiting action`,        color: "#BE185D", bg: "#FDF2F8", border: "#FBCFE8" },
          c!.reviews.pending       > 0  && { msg: `${fmt(c!.reviews.pending)} review${c!.reviews.pending > 1 ? "s" : ""} pending moderation`,             color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
          c!.users.adminProfilesLinked < c!.users.admins && { msg: `${c!.users.admins - c!.users.adminProfilesLinked} admin user${c!.users.admins - c!.users.adminProfilesLinked > 1 ? "s" : ""} missing AdminProfile — cannot log in`, color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" },
        ].filter(Boolean) as { msg: string; color: string; bg: string; border: string }[];

        if (!alerts.length) return null;
        return (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5"
                style={{ borderColor: a.border, background: a.bg }}>
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: a.color }} />
                <span className="text-xs font-semibold" style={{ color: a.color }}>{a.msg}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── KPI strip ── */}
      {data && isHealthy && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Users",      value: c!.users.total,          icon: Users,       bg: "#EFF6FF", color: "#2563EB" },
            { label: "Products",   value: c!.products.total,       icon: Package,     bg: "#F0FDF4", color: "#16A34A" },
            { label: "Variants",   value: c!.products.variants,    icon: Package,     bg: "#F0FDF4", color: "#059669" },
            { label: "Orders",     value: c!.orders.total,         icon: ShoppingCart,bg: "#F5F3FF", color: "#7C3AED" },
            { label: "CMS Blocks", value: c!.content.blocks,       icon: FileText,    bg: "#FEF3C7", color: "#D97706" },
            { label: "Media",      value: c!.content.media,        icon: Image,       bg: "#FDF2F8", color: "#BE185D" },
            { label: "Audit Logs", value: c!.audit.totalLogs,      icon: Activity,    bg: "#ECFEFF", color: "#0891B2" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-3" style={{ background: item.bg }}>
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
                <p className="text-xl font-extrabold text-[#111827]">{fmt(item.value)}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{item.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Detail sections ── */}
      {data && isHealthy && (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* Users & Access */}
          <SectionCard title="Users & Access" icon={<Users className="h-4 w-4 text-[#2563EB]" />} iconBg="#EFF6FF" badge={{ value: c!.users.total }}>
            <StatRow label="Total users"       value={c!.users.total} />
            <StatRow label="Admins"            value={c!.users.admins} />
            <StatRow label="Admin profiles"    value={c!.users.adminProfilesLinked}
              warn={c!.users.adminProfilesLinked < c!.users.admins}
              sub={c!.users.adminProfilesLinked < c!.users.admins ? "⚠ mismatch" : undefined} />
            <StatRow label="Customers"         value={c!.users.customers} />
            <StatRow label="Suppliers"         value={c!.users.suppliers} />
          </SectionCard>

          {/* Products */}
          <SectionCard title="Products & Inventory" icon={<Package className="h-4 w-4 text-[#16A34A]" />} iconBg="#F0FDF4" badge={{ value: c!.products.total }}>
            <StatRow label="Active products"   value={c!.products.active} />
            <StatRow label="Inactive products" value={c!.products.inactive} />
            <StatRow label="Total variants"    value={c!.products.variants} />
            <StatRow label="Out of stock"      value={c!.products.outOfStock}   warn={c!.products.outOfStock > 0} />
            <StatRow label="Low stock (≤5)"    value={c!.products.lowStock}     warn={c!.products.lowStock > 0} />
            <StatRow label="Categories"        value={c!.products.categories} />
          </SectionCard>

          {/* Orders & Returns */}
          <SectionCard title="Orders & Returns" icon={<ShoppingCart className="h-4 w-4 text-[#7C3AED]" />} iconBg="#F5F3FF" badge={{ value: c!.orders.total }}>
            <StatRow label="Total orders"      value={c!.orders.total} />
            <StatRow label="Pending orders"    value={c!.orders.pending}  warn={c!.orders.pending > 0} />
            <StatRow label="Total returns"     value={c!.returns.total} />
            <StatRow label="Pending returns"   value={c!.returns.pending} warn={c!.returns.pending > 0} />
            <StatRow label="Total coupons"     value={c!.coupons.total} />
            <StatRow label="Active coupons"    value={c!.coupons.active} />
          </SectionCard>

          {/* Content CMS */}
          <SectionCard title="Content & CMS" icon={<FileText className="h-4 w-4 text-[#D97706]" />} iconBg="#FEF3C7" badge={{ value: c!.content.blocks }}>
            <StatRow label="Content blocks"        value={c!.content.blocks} />
            <StatRow label="Published"             value={c!.content.published} />
            <StatRow label="Draft"                 value={c!.content.draft}     warn={c!.content.draft > 0} />
            <StatRow label="Announcements"         value={c!.content.announcements} />
            <StatRow label="Active announcements"  value={c!.content.activeAnnouncements} />
            <StatRow label="SEO settings"          value={c!.content.siteSettings} />
            <StatRow label="Media assets"          value={c!.content.media} />
          </SectionCard>

          {/* Reviews */}
          <SectionCard title="Reviews & Moderation" icon={<Star className="h-4 w-4 text-[#0891B2]" />} iconBg="#ECFEFF">
            <StatRow label="Total reviews"     value={c!.reviews.total} />
            <StatRow label="Pending review"    value={c!.reviews.pending} warn={c!.reviews.pending > 0} />
            <StatRow label="Approved"          value={c!.reviews.total - c!.reviews.pending} />
          </SectionCard>

          {/* Database */}
          <SectionCard title="Database & Migrations" icon={<Database className="h-4 w-4 text-[#059669]" />} iconBg="#F0FDF4">
            <StatRow label="DB provider"     value="Neon PostgreSQL" />
            <StatRow label="Query latency"   value={`${data.queryMs}ms`} warn={data.queryMs > 1000} />
            <StatRow label="Audit log rows"  value={c!.audit.totalLogs} />
            {data.migrations.slice(0, 3).map((m, i) => (
              <div key={m.name} className="py-2.5 border-b border-[#F9FAFB] last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#6B7280] truncate max-w-[200px]">{m.name.replace(/^\d{14}_/, "")}</span>
                  <span className="text-[10px] font-semibold text-[#16A34A] shrink-0 ml-2">✓ applied</span>
                </div>
                <span className="text-[10px] text-[#9CA3AF]">{new Date(m.appliedAt).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </SectionCard>
        </div>
      )}

      {/* ── Recent audit activity ── */}
      {data && isHealthy && data.recentAudit.length > 0 && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFEFF]">
                <Activity className="h-4 w-4 text-[#0891B2]" />
              </div>
              <span className="text-sm font-bold text-[#111827]">Recent Admin Activity</span>
            </div>
            <a href="/admin/audit" className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </a>
          </div>
          <div className="divide-y divide-[#F9FAFB]">
            {data.recentAudit.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[10px] font-bold text-[#374151]">
                  {log.adminName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#374151]">
                    <span className="font-semibold">{log.adminName}</span>
                    {" — "}
                    <span>{ACTION_LABELS[log.action] ?? log.action.replace(/_/g, " ").toLowerCase()}</span>
                    {log.resourceName && <span className="text-[#9CA3AF]"> · {log.resourceName}</span>}
                  </p>
                </div>
                <span className="text-[10px] text-[#9CA3AF] shrink-0 whitespace-nowrap">{formatRelative(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Checklist ── */}
      {data && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F3F4F6]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F3FF]">
              <Shield className="h-4 w-4 text-[#7C3AED]" />
            </div>
            <span className="text-sm font-bold text-[#111827]">System Verification Checklist</span>
          </div>
          <div className="px-5 py-3 grid sm:grid-cols-2 gap-x-8">
            {[
              { label: "Database connected",                     pass: isHealthy },
              { label: "Migration applied",                      pass: (data.migrations?.length ?? 0) > 0 },
              { label: "Admin user seeded",                      pass: (c?.users.admins ?? 0) >= 1 },
              { label: "SuperAdmin profile linked",              pass: (c?.users.adminProfilesLinked ?? 0) >= 1 },
              { label: "Categories seeded (≥4)",                pass: (c?.products.categories ?? 0) >= 4 },
              { label: "Coupons seeded (≥2)",                   pass: (c?.coupons.total ?? 0) >= 2 },
              { label: "Announcements seeded (≥1)",             pass: (c?.content.announcements ?? 0) >= 1 },
              { label: "Content blocks published (≥4)",         pass: (c?.content.published ?? 0) >= 4 },
              { label: "SEO settings created",                  pass: (c?.content.siteSettings ?? 0) >= 1 },
              { label: "Sample product exists",                  pass: (c?.products.total ?? 0) >= 1 },
              { label: "No critical inventory issues",           pass: (c?.products.outOfStock ?? 0) === 0 },
              { label: "Query latency < 2s",                    pass: (data.queryMs ?? 9999) < 2000 },
            ].map((check) => (
              <div key={check.label} className="flex items-center gap-2.5 py-2 border-b border-[#F9FAFB] last:border-0">
                {check.pass
                  ? <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  : <XCircle      className="h-4 w-4 text-[#DC2626] shrink-0" />
                }
                <span className={cn("text-xs", check.pass ? "text-[#374151]" : "text-[#DC2626] font-semibold")}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
