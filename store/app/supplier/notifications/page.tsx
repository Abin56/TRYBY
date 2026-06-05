"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell, CheckCircle2, AlertTriangle, Package, Wallet,
  ChevronLeft, ChevronRight, BellOff,
} from "lucide-react";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown> | null;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  PRODUCT_APPROVED:  Package,
  PRODUCT_REJECTED:  Package,
  PAYOUT_APPROVED:   Wallet,
  PAYOUT_PROCESSED:  Wallet,
  PAYOUT_REJECTED:   Wallet,
  ACCOUNT_APPROVED:  CheckCircle2,
  ACCOUNT_SUSPENDED: AlertTriangle,
};

const TYPE_COLOR: Record<string, string> = {
  PRODUCT_APPROVED:  "#4ADE80",
  PRODUCT_REJECTED:  "#F87171",
  PAYOUT_APPROVED:   "#A78BFA",
  PAYOUT_PROCESSED:  "#4ADE80",
  PAYOUT_REJECTED:   "#F87171",
  ACCOUNT_APPROVED:  "#4ADE80",
  ACCOUNT_SUSPENDED: "#F87171",
};

export default function SupplierNotificationsPage() {
  const [notifs, setNotifs]     = useState<Notif[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/supplier/notifications?page=${page}`);
    const data = await res.json();
    setNotifs(data.notifications ?? []);
    setTotal(data.total   ?? 0);
    setPages(data.pages   ?? 1);
    setUnread(data.unreadCount ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function markAllRead() {
    await fetch("/api/supplier/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ all: true }),
    });
    load();
  }

  async function markRead(id: string) {
    await fetch("/api/supplier/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ids: [id] }),
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(u => Math.max(0, u - 1));
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 lg:p-8 max-w-[760px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-white font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
            >
              Notifications
            </h1>
            {unread > 0 && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-black"
                style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {unread}
              </span>
            )}
          </div>
          <p className="text-white/40 text-[13px]">{total} notification{total !== 1 ? "s" : ""}</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white/50 hover:text-white hover:bg-white/06 transition-all"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : notifs.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <BellOff className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No notifications yet</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {notifs.map(n => {
              const Icon  = TYPE_ICON[n.type] ?? Bell;
              const color = TYPE_COLOR[n.type] ?? "#9CA3AF";
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-white/02 transition-colors"
                  style={{ background: n.isRead ? "transparent" : "rgba(245,197,24,0.03)" }}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5"
                    style={{ background: `${color}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-semibold text-white/90 leading-snug">{n.title}</p>
                      {!n.isRead && (
                        <div className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: "#F5C518" }} />
                      )}
                    </div>
                    <p className="text-[12px] text-white/50 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-white/25 mt-1.5">{fmtDate(n.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
