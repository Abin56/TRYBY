"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCw, Filter, Crown, AlertTriangle, Users, ChevronRight } from "lucide-react";

interface CrmCustomer {
  userId: string;
  ltv: string;
  avgOrderValue: string;
  orderCount: number;
  refundCount: number;
  refundRate: string;
  codOrderCount: number;
  riskScore: number;
  engagementScore: number;
  segments: string[];
  daysSinceOrder: number;
  lastOrderAt: string | null;
  isBlocked: boolean;
  user: { id: string; name: string | null; email: string | null; phone: string | null; createdAt: string } | null;
}

const SEGMENT_COLORS: Record<string, string> = {
  VIP: "#F5C518", HIGH_VALUE: "#A78BFA", REPEAT_BUYER: "#3B82F6",
  NEW_CUSTOMER: "#22C55E", LOYAL: "#06B6D4", WHOLESALE: "#8B5CF6",
  INACTIVE: "#6B7280", CHURNED: "#EF4444", REFUND_RISK: "#EC4899",
  COD_RISK: "#F97316", AT_RISK: "#EAB308",
};

const SEGMENT_LABELS: Record<string, string> = {
  VIP: "VIP", HIGH_VALUE: "High Value", REPEAT_BUYER: "Repeat", NEW_CUSTOMER: "New",
  LOYAL: "Loyal", WHOLESALE: "Wholesale", INACTIVE: "Inactive", CHURNED: "Churned",
  REFUND_RISK: "Refund Risk", COD_RISK: "COD Risk", AT_RISK: "At Risk",
};

export default function CrmCustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState(searchParams.get("segment") ?? "");
  const [sortBy, setSortBy] = useState("ltv");
  const [sortDir, setSortDir] = useState("desc");
  const [lastOrderDays, setLastOrderDays] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sortBy, sortDir });
    if (search) params.set("search", search);
    if (segment) params.set("segment", segment);
    if (lastOrderDays) params.set("lastOrderDays", lastOrderDays);
    const r = await fetch(`/api/admin/crm/customers?${params}`);
    const json = await r.json();
    setCustomers(json.data ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setLoading(false);
  }, [page, search, segment, sortBy, sortDir, lastOrderDays]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const segments = [
    { value: "", label: "All" },
    { value: "VIP", label: "VIP" },
    { value: "HIGH_VALUE", label: "High Value" },
    { value: "REPEAT_BUYER", label: "Repeat Buyer" },
    { value: "NEW_CUSTOMER", label: "New" },
    { value: "LOYAL", label: "Loyal" },
    { value: "AT_RISK", label: "At Risk" },
    { value: "CHURNED", label: "Churned" },
    { value: "REFUND_RISK", label: "Refund Risk" },
    { value: "COD_RISK", label: "COD Risk" },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            CRM — CUSTOMERS
          </h1>
          <p className="text-white/40 text-[13px]">{total.toLocaleString()} customers</p>
        </div>
        <Link href="/admin/crm" className="text-[12px] text-white/40 hover:text-white px-3 py-1.5 rounded-lg"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          ← CRM Center
        </Link>
      </div>

      {/* Segment filter chips */}
      <div className="flex flex-wrap gap-2">
        {segments.map((s) => (
          <button key={s.value} onClick={() => { setSegment(s.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: segment === s.value ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: segment === s.value ? "white" : "rgba(255,255,255,0.45)",
              border: `1px solid ${segment === s.value ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Search + Sort bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search className="h-4 w-4 text-white/30" />
          <input className="bg-transparent text-white text-[13px] outline-none flex-1 placeholder:text-white/25"
            placeholder="Name, email, phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl text-[13px] text-white outline-none"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="ltv">Sort: LTV</option>
          <option value="orderCount">Sort: Orders</option>
          <option value="lastOrderAt">Sort: Last Order</option>
          <option value="riskScore">Sort: Risk Score</option>
          <option value="engagementScore">Sort: Engagement</option>
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}
          className="px-3 py-2 rounded-xl text-[13px] text-white outline-none"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="desc">↓ Desc</option>
          <option value="asc">↑ Asc</option>
        </select>
        <select value={lastOrderDays} onChange={(e) => { setLastOrderDays(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-[13px] text-white outline-none"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="">Any order date</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button onClick={fetchData}
          className="px-3 py-2 rounded-xl text-white/60 hover:text-white flex items-center gap-1.5 text-[13px]"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Customer", "Segments", "LTV", "Orders", "AOV", "Refund Rate", "Risk", "Engagement", "Last Order", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-[11px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="text-center py-10 text-white/30">Loading…</td></tr>}
            {!loading && customers.length === 0 && (
              <tr><td colSpan={10} className="text-center py-10 text-white/30">No customers found</td></tr>
            )}
            {!loading && customers.map((c) => (
              <tr key={c.userId} className="border-t hover:bg-white/02 transition-colors" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.isBlocked && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">BLOCKED</span>}
                    <div>
                      <p className="text-white font-medium">{c.user?.name ?? "—"}</p>
                      <p className="text-white/40 text-[11px]">{c.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.segments.slice(0, 2).map((seg) => (
                      <span key={seg} className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{ color: SEGMENT_COLORS[seg], background: `${SEGMENT_COLORS[seg]}18` }}>
                        {SEGMENT_LABELS[seg] ?? seg}
                      </span>
                    ))}
                    {c.segments.length > 2 && <span className="text-[9px] text-white/30">+{c.segments.length - 2}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-white font-bold">₹{Number(c.ltv).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-white">{c.orderCount}</td>
                <td className="px-4 py-3 text-white/70">₹{Number(c.avgOrderValue).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span style={{ color: Number(c.refundRate) >= 0.3 ? "#EF4444" : Number(c.refundRate) >= 0.15 ? "#F97316" : "#9CA3AF" }}>
                    {(Number(c.refundRate) * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-1.5 rounded-full bg-white/08">
                      <div className="h-full rounded-full"
                        style={{ width: `${c.riskScore}%`, background: c.riskScore >= 75 ? "#EF4444" : c.riskScore >= 50 ? "#F97316" : "#22C55E" }} />
                    </div>
                    <span className="text-[11px]" style={{ color: c.riskScore >= 75 ? "#EF4444" : c.riskScore >= 50 ? "#F97316" : "#9CA3AF" }}>
                      {c.riskScore}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-1.5 rounded-full bg-white/08">
                      <div className="h-full rounded-full bg-blue-400" style={{ width: `${c.engagementScore}%` }} />
                    </div>
                    <span className="text-[11px] text-white/50">{c.engagementScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {c.lastOrderAt ? (
                    <div>
                      <p className="text-white/60 text-[12px]">{new Date(c.lastOrderAt).toLocaleDateString("en-IN")}</p>
                      <p className="text-white/30 text-[10px]">{c.daysSinceOrder}d ago</p>
                    </div>
                  ) : <span className="text-white/25">Never</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/crm/customers/${c.userId}`}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/08 transition-all">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
