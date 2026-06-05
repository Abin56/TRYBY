"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Search, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, ArrowUpCircle,
  X, Send, Crown, Trophy, Medal, Award,
} from "lucide-react";
import Link from "next/link";

const TIER_ICON: Record<string, React.ElementType> = {
  PLATINUM: Crown, GOLD: Trophy, SILVER: Medal, BRONZE: Award,
};
const TIER_COLOR: Record<string, string> = {
  PLATINUM: "#E8D5B7", GOLD: "#F5C518", SILVER: "#9CA3AF", BRONZE: "#CD7C3A",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN:          "#F5C518",
  PENDING_REPLY: "#60A5FA",
  IN_PROGRESS:   "#A78BFA",
  ESCALATED:     "#F87171",
  RESOLVED:      "#4ADE80",
  CLOSED:        "rgba(255,255,255,0.25)",
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#4ADE80", MEDIUM: "#F5C518", HIGH: "#F87171", URGENT: "#FF4444",
};

type Reply = { id: string; authorId: string; isAdmin: boolean; body: string; createdAt: string };
type Ticket = {
  id: string; ticketNumber: string; category: string; priority: string; status: string;
  subject: string; body: string; createdAt: string; resolvedAt: string | null;
  supplier: { id: string; companyName: string; tier: string; user: { name: string | null; email: string | null } };
  replies: Reply[];
  _count?: { replies: number };
};

export default function AdminTicketsPage() {
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [q, setQ]                 = useState("");
  const [statusFilter, setSF]     = useState("OPEN");
  const [counts, setCounts]       = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmit]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q });
    if (statusFilter) params.set("status", statusFilter);
    const res  = await fetch(`/api/admin/tickets?${params}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setTotal(data.total   ?? 0);
    setPages(data.pages   ?? 1);
    setCounts(data.counts ?? {});
    setLoading(false);
  }, [page, q, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function loadTicket(id: string) {
    const res = await fetch(`/api/admin/tickets/${id}`);
    const data = await res.json();
    setSelected(data);
  }

  async function doAction(ticketId: string, action: string, body?: string) {
    setSubmit(true);
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, body }),
    });
    setSubmit(false);
    setReplyText("");
    load();
    if (selected?.id === ticketId) loadTicket(ticketId);
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const STATUS_TABS = ["OPEN", "PENDING_REPLY", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
          Support Tickets
        </h1>
        <p className="text-white/40 text-[13px] mt-0.5">{total} ticket{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Status tab strip */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto">
        {STATUS_TABS.map(s => {
          const color = STATUS_COLOR[s] ?? "#9CA3AF";
          return (
            <button key={s} onClick={() => { setSF(s); setPage(1); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all"
              style={{
                background: statusFilter === s ? `${color}20` : "rgba(255,255,255,0.04)",
                color:      statusFilter === s ? color          : "rgba(255,255,255,0.35)",
                border:     `1px solid ${statusFilter === s ? color + "40" : "transparent"}`,
              }}>
              {s.replace("_", " ")}
              {counts[s] ? (
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black"
                  style={{ background: color, color: "#0D0D0D" }}>{counts[s]}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-4 mb-5"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", height: "44px" }}>
        <Search className="h-4 w-4 text-white/30 shrink-0" />
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search ticket number, subject, supplier…"
          className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">

        {/* Ticket list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <MessageSquare className="h-8 w-8 text-white/15 mb-2" />
              <p className="text-white/40 text-[13px]">No tickets</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map(t => {
                const TierIcon = TIER_ICON[t.supplier.tier];
                const tierColor = TIER_COLOR[t.supplier.tier];
                const statusColor = STATUS_COLOR[t.status];
                const priorityColor = PRIORITY_COLOR[t.priority];
                const isSelected = selected?.id === t.id;
                return (
                  <button key={t.id} onClick={() => loadTicket(t.id)}
                    className="w-full text-left rounded-2xl p-4 transition-all hover:brightness-110"
                    style={{
                      background: "#1A1A1A",
                      border: `1px solid ${isSelected ? "#F5C518" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-white/30">{t.ticketNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${priorityColor}20`, color: priorityColor }}>
                          {t.priority}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${statusColor}20`, color: statusColor }}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold text-white/85 truncate mb-1">{t.subject}</p>
                    <div className="flex items-center gap-2">
                      <TierIcon className="h-3 w-3 shrink-0" style={{ color: tierColor }} />
                      <span className="text-[11px] text-white/40 truncate">{t.supplier.companyName}</span>
                      <span className="text-[10px] text-white/25 ml-auto shrink-0">{fmtDate(t.createdAt)}</span>
                    </div>
                    {t._count && t._count.replies > 0 && (
                      <p className="text-[10px] text-white/25 mt-1">{t._count.replies} repl{t._count.replies === 1 ? "y" : "ies"}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[11px] text-white/30">Page {page} of {pages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/06 disabled:opacity-30">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/06 disabled:opacity-30">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ticket detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-96 rounded-2xl"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <MessageSquare className="h-10 w-10 text-white/10 mb-3" />
              <p className="text-white/30 text-[13px]">Select a ticket to view</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Ticket header */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-white/30">{selected.ticketNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${STATUS_COLOR[selected.status]}20`, color: STATUS_COLOR[selected.status] }}>
                        {selected.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${PRIORITY_COLOR[selected.priority]}20`, color: PRIORITY_COLOR[selected.priority] }}>
                        {selected.priority}
                      </span>
                    </div>
                    <h3 className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {selected.subject}
                    </h3>
                    <p className="text-[12px] text-white/40 mt-0.5">
                      <Link href={`/admin/suppliers/${selected.supplier.id}`} className="hover:text-white transition-colors">
                        {selected.supplier.companyName}
                      </Link> · {fmtDate(selected.createdAt)}
                    </p>
                  </div>
                  {/* Action buttons */}
                  {!["RESOLVED", "CLOSED"].includes(selected.status) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selected.status !== "ESCALATED" && (
                        <button onClick={() => doAction(selected.id, "escalate")} disabled={submitting}
                          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                          style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                          <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
                        </button>
                      )}
                      <button onClick={() => doAction(selected.id, "resolve")} disabled={submitting}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                        style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                      </button>
                      <button onClick={() => doAction(selected.id, "close")} disabled={submitting}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/06 transition-all disabled:opacity-40">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {selected.status === "RESOLVED" && (
                    <button onClick={() => doAction(selected.id, "close")} disabled={submitting}
                      className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 text-white/40 hover:text-white hover:bg-white/06">
                      Close
                    </button>
                  )}
                </div>
                <div className="mt-3 px-3 py-2.5 rounded-xl text-[13px] text-white/70 leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  {selected.body}
                </div>
              </div>

              {/* Reply thread */}
              <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {selected.replies.map(r => (
                  <div key={r.id} className="flex gap-3 px-5 py-3"
                    style={{ background: r.isAdmin ? "rgba(245,197,24,0.03)" : "transparent" }}>
                    <div
                      className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                      style={{
                        background: r.isAdmin ? "rgba(245,197,24,0.15)" : "rgba(255,255,255,0.07)",
                        color:      r.isAdmin ? "#F5C518"                : "rgba(255,255,255,0.40)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                      }}
                    >
                      {r.isAdmin ? "A" : "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold" style={{ color: r.isAdmin ? "#F5C518" : "rgba(255,255,255,0.50)" }}>
                          {r.isAdmin ? "Admin" : "Supplier"}
                        </span>
                        <span className="text-[10px] text-white/25">{fmtDate(r.createdAt)}</span>
                      </div>
                      <p className="text-[13px] text-white/70 leading-relaxed">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {!["CLOSED"].includes(selected.status) && (
                <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Write a reply…"
                    className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none mb-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <button
                    onClick={() => replyText.trim() && doAction(selected.id, "reply", replyText)}
                    disabled={submitting || !replyText.trim()}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[12px] transition-all disabled:opacity-40 hover:brightness-110"
                    style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    <Send className="h-3.5 w-3.5" /> {submitting ? "Sending…" : "Send Reply"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
