"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, ChevronRight, Package, CreditCard, Truck, Star, Users, Megaphone, RotateCcw, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Category = "ORDER" | "PAYMENT" | "SHIPPING" | "RETURN" | "LOYALTY" | "REFERRAL" | "PROMOTION" | "SYSTEM" | "WISHLIST" | "STOCK";

interface NotifItem {
  id:         string;
  category:   Category;
  priority:   string;
  title:      string;
  body:       string;
  actionUrl?: string;
  isRead:     boolean;
  createdAt:  string;
}

const CAT_ICON: Record<Category, React.ElementType> = {
  ORDER: Package, PAYMENT: CreditCard, SHIPPING: Truck, RETURN: RotateCcw,
  LOYALTY: Star, REFERRAL: Users, PROMOTION: Megaphone, SYSTEM: Bell,
  WISHLIST: ShoppingBag, STOCK: ShoppingBag,
};

const CAT_COLOR: Record<Category, string> = {
  ORDER: "#2563EB", PAYMENT: "#16A34A", SHIPPING: "#D97706", RETURN: "#7C3AED",
  LOYALTY: "#F59E0B", REFERRAL: "#10B981", PROMOTION: "#EF4444", SYSTEM: "#6B7280",
  WISHLIST: "#EC4899", STOCK: "#059669",
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "#EF4444", HIGH: "#F59E0B", NORMAL: "#9CA3AF", LOW: "#D1D5DB",
};

// Poll interval: 60s in background, 20s when bell is open
const POLL_INTERVAL_BG   = 60_000;
const POLL_INTERVAL_OPEN = 20_000;

export function NotificationBell() {
  const { data: session } = useSession();
  const [count,  setCount]  = useState(0);
  const [open,   setOpen]   = useState(false);
  const [items,  setItems]  = useState<NotifItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/notifications/unread-count");
      const d   = await res.json();
      setCount(d.count ?? 0);
    } catch {}
  }, [session?.user?.id]);

  const fetchItems = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingItems(true);
    try {
      const res = await fetch("/api/notifications?page=1&unread=true");
      if (!res.ok) throw new Error();
      const d = await res.json();
      // Show up to 8 most recent (mix unread + recent read)
      if ((d.notifications?.length ?? 0) < 5) {
        const res2 = await fetch("/api/notifications?page=1");
        const d2   = await res2.json();
        setItems((d2.notifications ?? []).slice(0, 8));
      } else {
        setItems((d.notifications ?? []).slice(0, 8));
      }
    } finally {
      setLoadingItems(false);
    }
  }, [session?.user?.id]);

  // Poll for unread count
  useEffect(() => {
    fetchCount();
    timerRef.current = setInterval(fetchCount, open ? POLL_INTERVAL_OPEN : POLL_INTERVAL_BG);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchCount, open]);

  // Fetch items when opened
  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setCount(c => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", ids: [id] }),
    });
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
  };

  if (!session?.user?.id) return null;

  function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.round(diff / 60)}m`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h`;
    return `${Math.round(diff / 86400)}d`;
  }

  return (
    <div ref={dropRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all",
          open
            ? "bg-[#0D0D0D] text-white"
            : "text-[#555] hover:text-[#0D0D0D] hover:bg-[#F5F5F5]"
        )}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-black text-white leading-none"
            style={{ background: "#EF4444" }}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="absolute right-0 top-full mt-2 w-[360px] rounded-2xl bg-white overflow-hidden z-[200]"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#0D0D0D]">Notifications</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full text-[10px] font-black text-white"
                    style={{ background: "#EF4444" }}>
                    {count}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {count > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#9CA3AF] hover:text-[#0D0D0D] transition-colors px-2 py-1 rounded-lg hover:bg-[#F5F5F5]">
                    <CheckCheck className="h-3.5 w-3.5" /> Read all
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#0D0D0D] hover:bg-[#F5F5F5] transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="max-h-[380px] overflow-y-auto">
              {loadingItems ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 rounded-full border-2 border-[#E0E0E0] border-t-[#0D0D0D] animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center px-4">
                  <Bell className="h-8 w-8 text-[#E0E0E0] mb-2" />
                  <p className="text-[13px] font-semibold text-[#9CA3AF]">All caught up!</p>
                  <p className="text-[11px] text-[#D1D5DB]">Order & reward updates appear here</p>
                </div>
              ) : (
                <div className="py-1">
                  {items.map(n => {
                    const Icon = CAT_ICON[n.category] ?? Bell;
                    const color = CAT_COLOR[n.category] ?? "#6B7280";
                    const dot   = PRIORITY_COLOR[n.priority] ?? PRIORITY_COLOR.NORMAL;

                    return (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.isRead) markRead(n.id); }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#FAFAFA]",
                          !n.isRead && "bg-[#FAFAFA]"
                        )}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
                            <Icon className="h-4 w-4" style={{ color }} />
                          </div>
                          {!n.isRead && (
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white" style={{ background: dot }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[12px] leading-snug line-clamp-1", n.isRead ? "font-medium text-[#555]" : "font-bold text-[#0D0D0D]")}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-[#9CA3AF] line-clamp-1 mt-0.5">{n.body}</p>
                        </div>
                        <span className="text-[10px] text-[#C0C0C0] shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#F3F4F6] px-4 py-2.5">
              <Link href="/account/notifications" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#555] hover:text-[#0D0D0D] transition-colors">
                View all notifications <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
