"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, RefreshCw, Filter, Shield, Package, ShoppingCart,
  RotateCcw, FileText, Settings, Users, Tag, ScrollText, Loader2,
} from "lucide-react";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id:            string;
  action:        string;
  resourceType?: string;
  resourceId?:   string;
  resourceName?: string;
  ipAddress?:    string;
  oldValue?:     unknown;
  newValue?:     unknown;
  createdAt:     string;
  admin: {
    id:    string;
    user:  { id: string; name?: string; email?: string; image?: string };
    adminRole?: string;
  };
}

interface AuditData { logs: AuditLog[]; total: number; pages: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_GROUPS = [
  { label: "Products",  actions: ["PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED"], icon: Package },
  { label: "Orders",    actions: ["ORDER_STATUS_CHANGED", "ORDER_REFUNDED"],                 icon: ShoppingCart },
  { label: "Returns",   actions: ["RETURN_APPROVED", "RETURN_REJECTED", "RETURN_REFUNDED"],  icon: RotateCcw },
  { label: "Content",   actions: ["CONTENT_PUBLISHED", "CONTENT_UPDATED", "CONTENT_DELETED"], icon: FileText },
  { label: "Team",      actions: ["ADMIN_CREATED", "ADMIN_UPDATED", "ADMIN_DISABLED", "ADMIN_ENABLED"], icon: Users },
  { label: "Settings",  actions: ["SETTINGS_UPDATED"],                                        icon: Settings },
  { label: "Coupons",   actions: ["COUPON_CREATED", "COUPON_UPDATED", "COUPON_DELETED"],      icon: Tag },
  { label: "Auth",      actions: ["LOGIN", "LOGOUT", "PASSWORD_RESET"],                      icon: Shield },
];

const ACTION_LABELS: Record<string, string> = {
  PRODUCT_CREATED: "Created product",      PRODUCT_UPDATED: "Updated product",   PRODUCT_DELETED: "Deleted product",
  ORDER_STATUS_CHANGED: "Changed order",   ORDER_REFUNDED: "Refunded order",
  RETURN_APPROVED: "Approved return",      RETURN_REJECTED: "Rejected return",   RETURN_REFUNDED: "Refunded return",
  CONTENT_PUBLISHED: "Published content",  CONTENT_UPDATED: "Updated content",   CONTENT_DELETED: "Deleted content",
  ADMIN_CREATED: "Created admin",          ADMIN_UPDATED: "Updated admin",        ADMIN_DISABLED: "Disabled admin", ADMIN_ENABLED: "Enabled admin",
  SETTINGS_UPDATED: "Updated settings",    COUPON_CREATED: "Created coupon",      COUPON_UPDATED: "Updated coupon", COUPON_DELETED: "Deleted coupon",
  LOGIN: "Logged in",                      LOGOUT: "Logged out",                  PASSWORD_RESET: "Reset password",
  SUPPLIER_APPROVED: "Approved supplier",  SUPPLIER_SUSPENDED: "Suspended supplier",
};

const ACTION_COLORS: Record<string, string> = {
  PRODUCT_CREATED: "#16A34A", PRODUCT_UPDATED: "#2563EB", PRODUCT_DELETED: "#DC2626",
  ORDER_STATUS_CHANGED: "#7C3AED", ORDER_REFUNDED: "#DC2626",
  RETURN_APPROVED: "#16A34A", RETURN_REJECTED: "#DC2626", RETURN_REFUNDED: "#059669",
  CONTENT_PUBLISHED: "#059669", CONTENT_UPDATED: "#2563EB", CONTENT_DELETED: "#DC2626",
  ADMIN_CREATED: "#D97706", ADMIN_UPDATED: "#D97706", ADMIN_DISABLED: "#DC2626", ADMIN_ENABLED: "#16A34A",
  SETTINGS_UPDATED: "#6B7280", LOGIN: "#6B7280", LOGOUT: "#9CA3AF",
  COUPON_CREATED: "#059669", COUPON_DELETED: "#DC2626",
};

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] ?? "#6B7280";
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ background: color + "18", color }}>
      {ACTION_LABELS[action] ?? action.replace(/_/g, " ")}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [data,    setData]    = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [resource,setResource]= useState("");
  const [page,    setPage]    = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search)   params.set("q", search);
      if (resource) params.set("resource", resource);
      const res = await fetch(`${STORE_API}/api/admin/audit?${params}`, { credentials: "include" });
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, search, resource]);

  useEffect(() => { load(); }, [load]);

  const RESOURCE_OPTS = [
    { value: "",        label: "All" },
    { value: "product", label: "Products" },
    { value: "order",   label: "Orders" },
    { value: "return",  label: "Returns" },
    { value: "content", label: "Content" },
    { value: "admin",   label: "Admins" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Audit Log</h1>
          <p className="text-sm text-[#9CA3AF]">Immutable trail of all admin actions</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by resource name…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-all" />
        </div>
        <div className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] bg-white px-2">
          <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
          <select value={resource} onChange={e => { setResource(e.target.value); setPage(1); }}
            className="text-sm text-[#374151] bg-transparent outline-none">
            {RESOURCE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Log entries */}
      {loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white h-14 animate-pulse" />
          ))}
        </div>
      ) : (data?.logs ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[#E5E7EB] bg-white text-center">
          <ScrollText className="h-10 w-10 text-[#D1D5DB]" />
          <p className="text-sm font-semibold text-[#374151]">No audit events yet</p>
          <p className="text-xs text-[#9CA3AF]">Events are recorded automatically as admins take actions</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <span className="text-xs font-semibold text-[#6B7280]">Action</span>
            <span className="text-xs font-semibold text-[#6B7280]">Admin</span>
            <span className="text-xs font-semibold text-[#6B7280]">IP</span>
            <span className="text-xs font-semibold text-[#6B7280]">When</span>
          </div>

          <div className="divide-y divide-[#F9FAFB]">
            {(data?.logs ?? []).map((log, i) => (
              <div key={log.id}>
                <motion.button
                  initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 w-full text-left hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ActionBadge action={log.action} />
                    {log.resourceName && (
                      <span className="text-xs text-[#6B7280] truncate">— {log.resourceName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F3F4F6] text-[9px] font-bold text-[#374151] shrink-0">
                      {log.admin.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-xs text-[#374151] hidden md:block">{log.admin.user.name ?? log.admin.user.email}</span>
                  </div>
                  <span className="text-xs text-[#9CA3AF] font-mono shrink-0">{log.ipAddress ?? "—"}</span>
                  <span className="text-xs text-[#9CA3AF] shrink-0 whitespace-nowrap">{formatRelative(log.createdAt)}</span>
                </motion.button>

                {/* Expanded detail */}
                {expanded === log.id && (
                  <div className="px-5 pb-4 bg-[#F9FAFB] border-t border-[#F3F4F6] space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                      <div>
                        <p className="text-[#9CA3AF] mb-0.5">Full timestamp</p>
                        <p className="font-mono text-[#374151]">{formatDate(log.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-[#9CA3AF] mb-0.5">Resource</p>
                        <p className="text-[#374151]">{log.resourceType ?? "—"} {log.resourceId ? `· ${log.resourceId}` : ""}</p>
                      </div>
                      <div>
                        <p className="text-[#9CA3AF] mb-0.5">Admin</p>
                        <p className="text-[#374151]">{log.admin.user.name ?? "—"} · {log.admin.user.email}</p>
                      </div>
                    </div>

                    {(log.oldValue || log.newValue) && (
                      <div className="grid grid-cols-2 gap-3">
                        {log.oldValue && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">Before</p>
                            <pre className="text-[10px] text-[#374151] bg-white rounded-lg border border-[#E5E7EB] px-3 py-2 overflow-auto max-h-32">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase mb-1">After</p>
                            <pre className="text-[10px] text-[#374151] bg-white rounded-lg border border-[#E5E7EB] px-3 py-2 overflow-auto max-h-32">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 1) > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: data!.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={cn("h-8 w-8 rounded-lg text-xs font-semibold transition-colors",
                p === page ? "bg-[#111827] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
