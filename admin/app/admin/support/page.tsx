"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Clock, CheckCircle2, AlertCircle, Send,
  Star, BookOpen, Plus, Pencil, Eye, Search,
} from "lucide-react";
import { supportTickets, faqItems, type TicketStatus, type TicketPriority } from "@/data/phase3-mock";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const PRIORITY_META: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:    { label:"Low",    color:"#6B7280", bg:"#F9FAFB" },
  medium: { label:"Medium", color:"#2563EB", bg:"#EFF6FF" },
  high:   { label:"High",   color:"#D97706", bg:"#FFFBEB" },
  urgent: { label:"Urgent", color:"#DC2626", bg:"#FFF1F2" },
};

const STATUS_META: Record<TicketStatus, { variant: "warning"|"info"|"success"|"neutral"|"danger" }> = {
  open:       { variant:"danger"  },
  in_progress:{ variant:"info"    },
  waiting:    { variant:"warning" },
  resolved:   { variant:"success" },
  closed:     { variant:"neutral" },
};

const TABS = ["tickets", "faq"] as const;

function TicketView({ ticket, onClose }: { ticket: typeof supportTickets[0]; onClose: () => void }) {
  const [reply, setReply] = useState("");

  return (
    <div className="flex flex-col h-full divide-y divide-[#F3F4F6]">
      {/* Meta */}
      <div className="px-6 py-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_META[ticket.status].variant} dot>{ticket.status.replace("_"," ")}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
            style={{ color:PRIORITY_META[ticket.priority].color, background:PRIORITY_META[ticket.priority].bg, borderColor:`${PRIORITY_META[ticket.priority].color}30` }}>
            {PRIORITY_META[ticket.priority].label} priority
          </span>
          <span className="text-xs text-[#9CA3AF] capitalize">{ticket.category} issue</span>
        </div>
        {ticket.orderNumber && <p className="text-xs text-[#9CA3AF]">Order: <span className="font-semibold text-[#2563EB]">{ticket.orderNumber}</span></p>}
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <span>From: <span className="font-semibold text-[#374151]">{ticket.customer.name}</span></span>
          <span>·</span>
          <span>{ticket.customer.email}</span>
          <span>·</span>
          <span>{formatRelative(ticket.createdAt)}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {ticket.messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.from === "agent" ? "flex-row-reverse" : "")}>
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              msg.from === "agent" ? "bg-[#111827] text-white" : "bg-[#2563EB] text-white")}>
              {msg.from === "agent" ? "AD" : ticket.customer.avatar}
            </div>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm",
              msg.from === "agent"
                ? "bg-[#111827] text-white rounded-tr-sm"
                : "bg-[#F3F4F6] text-[#374151] rounded-tl-sm")}>
              {msg.body}
              <p className={cn("text-[10px] mt-1", msg.from === "agent" ? "text-white/50" : "text-[#9CA3AF]")}>
                {formatRelative(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply box */}
      {ticket.status !== "resolved" && ticket.status !== "closed" && (
        <div className="px-6 py-4 space-y-2">
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
            placeholder="Type your reply…"
            className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white resize-none transition-all" />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select className="h-7 rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs text-[#374151] outline-none appearance-none">
                <option>Mark as…</option>
                <option>In Progress</option>
                <option>Waiting</option>
                <option>Resolved</option>
              </select>
              <select className="h-7 rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs text-[#374151] outline-none appearance-none">
                <option>Assign to…</option>
                <option>Support Agent</option>
                <option>Senior Agent</option>
              </select>
            </div>
            <button disabled={!reply.trim()} className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#111827] text-xs font-semibold text-white hover:bg-[#1F2937] disabled:opacity-50 transition-colors">
              <Send className="h-3.5 w-3.5" /> Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [tab, setTab]           = useState<"tickets"|"faq">("tickets");
  const [statusFilter, setStatus] = useState<TicketStatus | "all">("open");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<typeof supportTickets[0] | null>(null);

  const filtered = useMemo(() =>
    supportTickets.filter(t => {
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.customer.name.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    }),
    [statusFilter, search]);

  const avgFirstResponse = "38 min";
  const satisfactionAvg  = (supportTickets.filter(t => t.satisfactionScore).reduce((s, t) => s + (t.satisfactionScore ?? 0), 0) / supportTickets.filter(t => t.satisfactionScore).length).toFixed(1);

  const STATUS_OPTS: { value: TicketStatus | "all"; label: string }[] = [
    { value:"all",        label:"All" },
    { value:"open",       label:"Open" },
    { value:"in_progress",label:"In Progress" },
    { value:"waiting",    label:"Waiting" },
    { value:"resolved",   label:"Resolved" },
    { value:"closed",     label:"Closed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Support Center</h1>
          <p className="text-sm text-[#9CA3AF]">Customer tickets, FAQs, and escalations</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Open Tickets",    value:supportTickets.filter(t=>t.status==="open").length,     icon:MessageSquare, color:"#DC2626", bg:"#FFF1F2" },
          { label:"Avg Response",    value:avgFirstResponse,                                       icon:Clock,         color:"#D97706", bg:"#FFFBEB" },
          { label:"Resolved (30d)",  value:supportTickets.filter(t=>t.status==="resolved").length, icon:CheckCircle2,  color:"#16A34A", bg:"#F0FDF4" },
          { label:"CSAT Score",      value:`${satisfactionAvg}/5`,                                 icon:Star,          color:"#2563EB", bg:"#EFF6FF" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.06 }}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background:c.bg }}>
                <Icon className="h-5 w-5" style={{ color:c.color }} />
              </div>
              <div><p className="text-xl font-extrabold text-[#111827]">{c.value}</p><p className="text-xs text-[#9CA3AF]">{c.label}</p></div>
            </motion.div>
          );
        })}
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-px capitalize",
              tab === t ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#111827]")}>
            {t === "tickets" ? "Customer Tickets" : "FAQ Management"}
          </button>
        ))}
      </div>

      {tab === "tickets" && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-4">
          {/* Ticket list */}
          <div className="space-y-3">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
                  className="w-full h-8 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-all" />
              </div>
              <select value={statusFilter} onChange={e => setStatus(e.target.value as any)}
                className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#374151] outline-none appearance-none">
                {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label} ({s.value === "all" ? supportTickets.length : supportTickets.filter(t => t.status === s.value).length})</option>)}
              </select>
            </div>

            <AnimatePresence initial={false}>
              {filtered.map((ticket, i) => (
                <motion.div key={ticket.id} layout initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}
                  onClick={() => setSelected(ticket)}
                  className={cn("rounded-xl border bg-white p-4 cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
                    selected?.id === ticket.id ? "border-[#2563EB] bg-[#F8FAFF]" : "border-[#E5E7EB] hover:border-[#D1D5DB]")}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-xs font-mono text-[#9CA3AF]">{ticket.ticketNumber}</p>
                        <Badge variant={STATUS_META[ticket.status].variant} dot className="text-[10px]">{ticket.status.replace("_"," ")}</Badge>
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color:PRIORITY_META[ticket.priority].color, background:PRIORITY_META[ticket.priority].bg, borderColor:`${PRIORITY_META[ticket.priority].color}30` }}>
                          {PRIORITY_META[ticket.priority].label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#111827] truncate">{ticket.subject}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF] shrink-0 whitespace-nowrap">{formatRelative(ticket.updatedAt)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-bold text-white">{ticket.customer.avatar}</div>
                      <p className="text-xs text-[#6B7280]">{ticket.customer.name} · {ticket.messages.length} messages</p>
                    </div>
                    {ticket.satisfactionScore && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({length:ticket.satisfactionScore}).map((_,j) => <Star key={j} className="h-3 w-3 text-[#F59E0B]" fill="#F59E0B" />)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[#E5E7EB] bg-white text-center">
                <MessageSquare className="h-10 w-10 text-[#D1D5DB]" />
                <p className="text-sm font-semibold text-[#374151]">No tickets found</p>
              </div>
            )}
          </div>

          {/* Ticket detail panel */}
          <div className="hidden lg:block">
            {selected ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden flex flex-col" style={{ height:"600px" }}>
                <div className="px-5 py-4 border-b border-[#F3F4F6]">
                  <p className="text-sm font-bold text-[#111827] line-clamp-1">{selected.subject}</p>
                </div>
                <TicketView ticket={selected} onClose={() => setSelected(null)} />
              </div>
            ) : (
              <div className="rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-center" style={{ height:"400px" }}>
                <div className="text-center">
                  <MessageSquare className="h-10 w-10 text-[#D1D5DB] mx-auto mb-3" />
                  <p className="text-sm text-[#9CA3AF]">Select a ticket to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "faq" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add FAQ
            </button>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
            <table className="w-full admin-table">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3 text-left">Question</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Views</th>
                  <th className="px-5 py-3 text-left">Helpful</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9FAFB]">
                {faqItems.map((faq, i) => (
                  <motion.tr key={faq.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                    className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-[#111827] line-clamp-1">{faq.question}</p>
                      <p className="text-xs text-[#9CA3AF] line-clamp-1 mt-0.5">{faq.answer}</p>
                    </td>
                    <td className="px-5 py-3.5"><Badge variant="neutral" className="text-[10px]">{faq.category}</Badge></td>
                    <td className="px-5 py-3.5 text-sm text-[#374151]">{faq.views.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-[#374151]">{faq.helpful}</span>
                        <span className="text-xs text-[#9CA3AF]">/ {faq.views}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={faq.isPublished ? "success" : "neutral"} dot>{faq.isPublished ? "Published" : "Draft"}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6] transition-all"><Eye className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
