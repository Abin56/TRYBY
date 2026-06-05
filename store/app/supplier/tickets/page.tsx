"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Plus, ChevronLeft, ChevronRight,
  Send, CheckCircle2, Clock, AlertTriangle, ArrowUpCircle,
  X, Paperclip,
} from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  OPEN:          "#F5C518",
  PENDING_REPLY: "#60A5FA",
  IN_PROGRESS:   "#A78BFA",
  ESCALATED:     "#F87171",
  RESOLVED:      "#4ADE80",
  CLOSED:        "rgba(255,255,255,0.25)",
};
const STATUS_ICON: Record<string, React.ElementType> = {
  OPEN:          Clock,
  PENDING_REPLY: MessageSquare,
  IN_PROGRESS:   Clock,
  ESCALATED:     AlertTriangle,
  RESOLVED:      CheckCircle2,
  CLOSED:        X,
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#4ADE80", MEDIUM: "#F5C518", HIGH: "#F87171", URGENT: "#FF4444",
};

type Reply = { id: string; isAdmin: boolean; body: string; createdAt: string };
type Ticket = {
  id: string; ticketNumber: string; category: string; priority: string;
  status: string; subject: string; body: string; createdAt: string;
  replies: Reply[];
};

const CATEGORIES = ["PAYOUT", "PRODUCT", "ORDER", "ACCOUNT", "COMMISSION", "TECHNICAL", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function SupplierTicketsPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState<"list" | "new" | "detail">("list");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmit] = useState(false);

  const [form, setForm] = useState({
    category: "ACCOUNT", priority: "MEDIUM", subject: "", body: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/supplier/tickets?page=${page}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setTotal(data.total   ?? 0);
    setPages(data.pages   ?? 1);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function loadTicket(id: string) {
    const res  = await fetch(`/api/supplier/tickets/${id}`);
    const data = await res.json();
    setSelected(data);
    setView("detail");
  }

  async function handleCreate() {
    if (!form.subject.trim() || !form.body.trim()) return;
    setSubmit(true);
    const res = await fetch("/api/supplier/tickets", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    setSubmit(false);
    if (res.ok) {
      setForm({ category: "ACCOUNT", priority: "MEDIUM", subject: "", body: "" });
      setView("list");
      load();
    }
  }

  async function handleReply() {
    if (!selected || !replyText.trim()) return;
    setSubmit(true);
    await fetch(`/api/supplier/tickets/${selected.id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ body: replyText }),
    });
    setSubmit(false);
    setReplyText("");
    loadTicket(selected.id);
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 lg:p-8 max-w-[840px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Support Tickets
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">Raise and track your support requests</p>
        </div>
        {view !== "new" && (
          <button
            onClick={() => setView("new")}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[13px] transition-all hover:brightness-110"
            style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        )}
      </div>

      {/* New ticket form */}
      {view === "new" && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-black mb-5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "17px" }}>
            New Support Ticket
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Subject *</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Description *</label>
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={5} placeholder="Describe your issue in detail. Include any relevant order numbers, product names, or dates."
                className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={() => setView("list")}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06 transition-all">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={submitting || !form.subject.trim() || !form.body.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-black disabled:opacity-50 hover:brightness-110 transition-all"
              style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        </div>
      )}

      {/* Ticket detail */}
      {view === "detail" && selected && (
        <div className="mb-6">
          <button onClick={() => { setView("list"); setSelected(null); }}
            className="flex items-center gap-2 text-white/40 hover:text-white mb-4 transition-colors text-[13px]">
            <ChevronLeft className="h-4 w-4" /> All Tickets
          </button>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
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
              <p className="text-[11px] text-white/30 mt-0.5">
                {selected.category.replace("_", " ")} · {fmtDate(selected.createdAt)}
              </p>
              <div className="mt-3 px-3 py-2.5 rounded-xl text-[13px] text-white/70 leading-relaxed"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                {selected.body}
              </div>
            </div>

            {/* Replies */}
            <div className="divide-y max-h-80 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {selected.replies.map(r => (
                <div key={r.id} className="flex gap-3 px-5 py-3"
                  style={{ background: r.isAdmin ? "rgba(245,197,24,0.03)" : "transparent" }}>
                  <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                    style={{
                      background: r.isAdmin ? "rgba(245,197,24,0.15)" : "rgba(255,255,255,0.07)",
                      color:      r.isAdmin ? "#F5C518"                : "rgba(255,255,255,0.40)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                    }}>
                    {r.isAdmin ? "A" : "S"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold" style={{ color: r.isAdmin ? "#F5C518" : "rgba(255,255,255,0.50)" }}>
                        {r.isAdmin ? "TRYBY Support" : "You"}
                      </span>
                      <span className="text-[10px] text-white/25">{fmtDate(r.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-white/70 leading-relaxed">{r.body}</p>
                  </div>
                </div>
              ))}
              {selected.replies.length === 0 && (
                <p className="px-5 py-4 text-[12px] text-white/30">No replies yet — our team will respond shortly.</p>
              )}
            </div>

            {/* Reply */}
            {!["RESOLVED", "CLOSED"].includes(selected.status) && (
              <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                  placeholder="Add a reply or additional information…"
                  className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none mb-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <button onClick={handleReply} disabled={submitting || !replyText.trim()}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[12px] transition-all disabled:opacity-40 hover:brightness-110"
                  style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  <Send className="h-3.5 w-3.5" /> {submitting ? "Sending…" : "Send"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket list */}
      {view === "list" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <MessageSquare className="h-10 w-10 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No tickets yet</p>
              <p className="text-[12px] text-white/25 mt-1">Click "New Ticket" to raise a support request</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map(t => {
                const Icon        = STATUS_ICON[t.status] ?? Clock;
                const statusColor = STATUS_COLOR[t.status];
                const priorityColor = PRIORITY_COLOR[t.priority];
                const hasNewReply  = t.replies.some(r => r.isAdmin);
                return (
                  <button key={t.id} onClick={() => loadTicket(t.id)}
                    className="w-full text-left rounded-2xl p-4 hover:brightness-110 transition-all"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                        style={{ background: `${statusColor}18` }}>
                        <Icon className="h-4 w-4" style={{ color: statusColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-white/30">{t.ticketNumber}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${priorityColor}20`, color: priorityColor }}>{t.priority}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${statusColor}20`, color: statusColor }}>{t.status.replace("_", " ")}</span>
                          {hasNewReply && t.status === "PENDING_REPLY" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "#F5C518", color: "#0D0D0D" }}>NEW REPLY</span>
                          )}
                        </div>
                        <p className="text-[13px] font-semibold text-white/85">{t.subject}</p>
                        <p className="text-[11px] text-white/35 mt-0.5">
                          {t.category.replace("_", " ")} · {fmtDate(t.createdAt)}
                          {t.replies.length > 0 && ` · ${t.replies.length} repl${t.replies.length === 1 ? "y" : "ies"}`}
                        </p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-white/20 rotate-180 shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-[12px] text-white/35">Page {page} of {pages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
