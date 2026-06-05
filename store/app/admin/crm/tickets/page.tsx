"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Search, RefreshCw, Plus, ChevronRight, X } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
  replies: { id: string; message: string; isAdmin: boolean; createdAt: string }[];
}

interface ByStatus { status: string; _count: number }

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#EF4444", PENDING: "#F97316", IN_PROGRESS: "#3B82F6",
  RESOLVED: "#22C55E", CLOSED: "#6B7280",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#9CA3AF",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [byStatus, setByStatus] = useState<ByStatus[]>([]);
  const [status, setStatus] = useState("OPEN");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (search) params.set("search", search);
    const r = await fetch(`/api/admin/crm/tickets?${params}`);
    const json = await r.json();
    setTickets(json.data ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setByStatus(json.byStatus ?? []);
    setLoading(false);
  }, [page, status, priority, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function doAction(ticketId: string, action: string, extra?: Record<string, unknown>) {
    setReplying(true);
    await fetch(`/api/admin/crm/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, message: reply, adminId: "admin", ...extra }),
    });
    setReplying(false);
    setReply("");
    fetchData();
    if (selected?.id === ticketId) {
      const r = await fetch(`/api/admin/crm/tickets/${ticketId}`);
      const json = await r.json();
      setSelected({ ...json.ticket, user: json.user });
    }
  }

  const statusGroups = [
    { value: "", label: "All" },
    { value: "OPEN", label: "Open" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            SUPPORT TICKETS
          </h1>
          <p className="text-white/40 text-[13px]">{total} tickets</p>
        </div>
        <Link href="/admin/crm" className="text-[12px] text-white/40 hover:text-white px-3 py-1.5 rounded-lg"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          ← CRM Center
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {statusGroups.map((s) => {
          const count = byStatus.find((b) => b.status === s.value)?._count ?? 0;
          return (
            <button key={s.value} onClick={() => { setStatus(s.value); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
              style={{
                background: status === s.value ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                color: status === s.value ? "white" : "rgba(255,255,255,0.45)",
                border: `1px solid ${status === s.value ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              }}>
              {s.label}
              {s.value && count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{ background: STATUS_COLORS[s.value] ? `${STATUS_COLORS[s.value]}22` : "rgba(255,255,255,0.08)", color: STATUS_COLORS[s.value] ?? "rgba(255,255,255,0.4)" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search className="h-4 w-4 text-white/30" />
          <input className="bg-transparent text-white text-[13px] outline-none flex-1 placeholder:text-white/25"
            placeholder="Search subject…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-[13px] text-white outline-none"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="">All Priorities</option>
          {["URGENT","HIGH","MEDIUM","LOW"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={fetchData} className="px-3 py-2 rounded-xl text-white/60 hover:text-white flex items-center gap-1.5 text-[13px]"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Split pane */}
      <div className="flex gap-4 h-[600px]">
        {/* Ticket list */}
        <div className="w-[380px] shrink-0 rounded-xl overflow-hidden flex flex-col"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-1 overflow-y-auto divide-y">
            {loading && <p className="text-center py-10 text-white/30">Loading…</p>}
            {!loading && tickets.length === 0 && <p className="text-center py-10 text-white/30">No tickets</p>}
            {!loading && tickets.map((t) => (
              <button key={t.id}
                onClick={() => setSelected(t)}
                className="w-full px-4 py-3 text-left hover:bg-white/03 transition-colors"
                style={{ background: selected?.id === t.id ? "rgba(255,255,255,0.05)" : "transparent" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ color: STATUS_COLORS[t.status], background: `${STATUS_COLORS[t.status]}18` }}>
                    {t.status}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: PRIORITY_COLORS[t.priority] }}>
                    {t.priority}
                  </span>
                  <span className="text-[10px] text-white/30 ml-auto">{new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                <p className="text-white text-[13px] font-medium truncate">{t.subject}</p>
                <p className="text-white/40 text-[11px] truncate">{t.user?.name ?? "—"} · {t.user?.email}</p>
                <p className="text-white/25 text-[11px] mt-0.5">{t.category}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket detail */}
        {selected ? (
          <div className="flex-1 rounded-xl flex flex-col overflow-hidden"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-start gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex-1">
                <h3 className="text-white font-bold text-[15px]">{selected.subject}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-[11px] px-2 py-0.5 rounded font-bold"
                    style={{ color: STATUS_COLORS[selected.status], background: `${STATUS_COLORS[selected.status]}18` }}>
                    {selected.status}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/08 text-white/50">{selected.category}</span>
                  <span className="text-[11px]" style={{ color: PRIORITY_COLORS[selected.priority] }}>{selected.priority}</span>
                  <Link href={`/admin/crm/customers/${selected.user?.id}`} className="text-[11px] text-blue-400 hover:text-blue-300">
                    {selected.user?.name ?? selected.user?.email}
                  </Link>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {["OPEN","PENDING","IN_PROGRESS","RESOLVED","CLOSED"].includes(selected.status) && selected.status !== "RESOLVED" && (
                  <button onClick={() => doAction(selected.id, "resolve")}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] text-green-400 hover:bg-green-500/10">
                    Resolve
                  </button>
                )}
                {selected.status !== "CLOSED" && (
                  <button onClick={() => doAction(selected.id, "close")}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white hover:bg-white/05">
                    Close
                  </button>
                )}
                {(selected.status === "RESOLVED" || selected.status === "CLOSED") && (
                  <button onClick={() => doAction(selected.id, "reopen")}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] text-blue-400 hover:bg-blue-500/10">
                    Reopen
                  </button>
                )}
              </div>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selected.replies?.map((r) => (
                <div key={r.id} className={`flex ${r.isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] rounded-xl px-4 py-2.5"
                    style={{
                      background: r.isAdmin ? "rgba(232,255,71,0.12)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${r.isAdmin ? "rgba(232,255,71,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    <p className="text-[12px]" style={{ color: r.isAdmin ? "#E8FF47" : "rgba(255,255,255,0.7)" }}>
                      {r.message}
                    </p>
                    <p className="text-[10px] text-white/25 mt-1">{new Date(r.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div className="px-5 py-3 border-t flex gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply…" rows={2}
                className="flex-1 px-3 py-2 rounded-xl text-[13px] text-white outline-none resize-none placeholder:text-white/25"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <button onClick={() => doAction(selected.id, "reply")} disabled={replying || !reply.trim()}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold disabled:opacity-40"
                style={{ background: "#E8FF47", color: "#0D0D0D" }}>
                {replying ? "…" : "Reply"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 rounded-xl flex items-center justify-center text-white/25 text-[13px]"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            Select a ticket to view
          </div>
        )}
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
