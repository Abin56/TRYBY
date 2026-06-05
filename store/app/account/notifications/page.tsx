"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Check, CheckCheck, Trash2, Filter, Search,
  Loader2, Package, CreditCard, Truck, RotateCcw,
  Star, Users, Megaphone, Settings, Tag, ShoppingBag,
  ChevronRight, X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationCategory =
  | "ORDER" | "PAYMENT" | "SHIPPING" | "RETURN"
  | "LOYALTY" | "REFERRAL" | "PROMOTION" | "SYSTEM"
  | "WISHLIST" | "STOCK";

interface Notification {
  id:          string;
  category:    NotificationCategory;
  type:        string;
  priority:    string;
  title:       string;
  body:        string;
  actionUrl?:  string;
  actionLabel?: string;
  imageUrl?:   string;
  isRead:      boolean;
  readAt?:     string;
  createdAt:   string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<NotificationCategory, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  ORDER:     { icon: Package,     label: "Orders",     color: "#2563EB", bg: "#EFF6FF" },
  PAYMENT:   { icon: CreditCard,  label: "Payments",   color: "#16A34A", bg: "#F0FDF4" },
  SHIPPING:  { icon: Truck,       label: "Shipping",   color: "#D97706", bg: "#FFFBEB" },
  RETURN:    { icon: RotateCcw,   label: "Returns",    color: "#7C3AED", bg: "#F5F3FF" },
  LOYALTY:   { icon: Star,        label: "Loyalty",    color: "#F59E0B", bg: "#FFFBEB" },
  REFERRAL:  { icon: Users,       label: "Referrals",  color: "#10B981", bg: "#ECFDF5" },
  PROMOTION: { icon: Megaphone,   label: "Offers",     color: "#EF4444", bg: "#FEF2F2" },
  SYSTEM:    { icon: Bell,        label: "System",     color: "#6B7280", bg: "#F9FAFB" },
  WISHLIST:  { icon: Tag,         label: "Wishlist",   color: "#EC4899", bg: "#FDF2F8" },
  STOCK:     { icon: ShoppingBag, label: "Stock",      color: "#059669", bg: "#ECFDF5" },
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "#EF4444",
  HIGH:   "#F59E0B",
  NORMAL: "#9CA3AF",
  LOW:    "#D1D5DB",
};

// ─── Single notification card ─────────────────────────────────────────────────

function NotifCard({ notif, onRead, onDelete }: {
  notif:    Notification;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg   = CATEGORY_CFG[notif.category] ?? CATEGORY_CFG.SYSTEM;
  const Icon  = cfg.icon;
  const dot   = PRIORITY_DOT[notif.priority] ?? PRIORITY_DOT.NORMAL;
  const time  = (() => {
    const diff = (Date.now() - new Date(notif.createdAt).getTime()) / 1000;
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "group flex items-start gap-3 rounded-2xl px-4 py-4 transition-all duration-200 cursor-pointer",
        notif.isRead
          ? "bg-white border border-[#F0F0F0] hover:border-[#E0E0E0]"
          : "bg-[#FAFAFA] border border-[#F0F0F0] hover:border-[#E0E0E0]",
      )}
      onClick={() => { if (!notif.isRead) onRead(notif.id); }}
      style={{ boxShadow: notif.isRead ? "none" : "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Unread dot + icon */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: cfg.bg }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: cfg.color }} />
        </div>
        {!notif.isRead && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
            style={{ background: dot }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-[13px] leading-snug", notif.isRead ? "font-medium text-[#555]" : "font-bold text-[#0D0D0D]")}>
            {notif.title}
          </p>
          <span className="text-[11px] text-[#9CA3AF] shrink-0 mt-0.5">{time}</span>
        </div>
        <p className="text-[12px] text-[#9CA3AF] mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>
        {notif.actionUrl && notif.actionLabel && (
          <Link
            href={notif.actionUrl}
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#2563EB] hover:underline"
          >
            {notif.actionLabel} <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.isRead && (
          <button
            onClick={e => { e.stopPropagation(); onRead(notif.id); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#16A34A] hover:bg-[#F0FDF4] transition-all"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Preferences panel ────────────────────────────────────────────────────────

function PreferencesPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<Record<string, boolean> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then(r => r.json())
      .then(setPrefs);
  }, []);

  const toggle = (key: string) => {
    setPrefs(p => p ? { ...p, [key]: !p[key] } : p);
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    onClose();
  };

  if (!prefs) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  const PREF_GROUPS = [
    {
      label: "Email Notifications",
      items: [
        { key: "emailOrders",     label: "Order updates" },
        { key: "emailPayments",   label: "Payment confirmations" },
        { key: "emailShipping",   label: "Shipping & delivery" },
        { key: "emailReturns",    label: "Returns & refunds" },
        { key: "emailLoyalty",    label: "Loyalty points" },
        { key: "emailReferral",   label: "Referral rewards" },
        { key: "emailPromotions", label: "Offers & promotions" },
        { key: "emailStock",      label: "Back in stock alerts" },
      ],
    },
    {
      label: "Privacy",
      items: [
        { key: "globalUnsubscribe", label: "Unsubscribe from all marketing (keeps transactional)" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {PREF_GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9CA3AF] mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {group.label}
          </p>
          <div className="space-y-2.5">
            {group.items.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[13px] text-[#374151]">{label}</span>
                <div
                  onClick={() => toggle(key)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors duration-200",
                    prefs[key] ? "bg-[#0D0D0D]" : "bg-[#E5E7EB]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                      prefs[key] ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0D0D0D] text-white text-[13px] font-black transition-all hover:opacity-90 disabled:opacity-50"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        SAVE PREFERENCES
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: NotificationCategory[] = [
  "ORDER", "PAYMENT", "SHIPPING", "RETURN",
  "LOYALTY", "REFERRAL", "PROMOTION", "SYSTEM",
];

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [category,      setCategory]      = useState<NotificationCategory | "ALL">("ALL");
  const [unreadOnly,    setUnreadOnly]    = useState(false);
  const [q,             setQ]             = useState("");
  const [showPrefs,     setShowPrefs]     = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?callbackUrl=/account/notifications");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1" });
      if (category !== "ALL") params.set("category", category);
      if (unreadOnly) params.set("unread", "true");
      if (q.trim())   params.set("q", q.trim());
      const res  = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setTotal(data.total ?? 0);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [category, unreadOnly, q]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", ids: [id] }),
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
  }, []);

  const deleteNotif = useCallback(async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.isRead) setUnreadCount(c => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids: [id] }),
    });
  }, [notifications]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#9CA3AF]" /></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[700px] mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-[28px] font-black text-[#0D0D0D] mb-0.5"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  className="ml-2 inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-[11px] font-black text-white"
                  style={{ background: "#EF4444" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </h1>
            <p className="text-[13px] text-[#9CA3AF]">{total} total · {unreadCount} unread</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 h-8 rounded-xl border border-[#E0E0E0] bg-white px-3 text-[12px] font-semibold text-[#555] hover:border-[#0D0D0D] transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
            <button
              onClick={() => setShowPrefs(!showPrefs)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl border transition-all",
                showPrefs ? "border-[#0D0D0D] bg-[#0D0D0D] text-white" : "border-[#E0E0E0] bg-white text-[#555] hover:border-[#0D0D0D]"
              )}
              title="Notification preferences"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Preferences panel */}
        <AnimatePresence>
          {showPrefs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-4 rounded-2xl border border-[#E0E0E0] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[14px] font-bold text-[#0D0D0D]">Notification Preferences</p>
                  <button onClick={() => setShowPrefs(false)} className="text-[#9CA3AF] hover:text-[#555]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <PreferencesPanel onClose={() => setShowPrefs(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search notifications…"
            className="w-full h-10 rounded-xl border border-[#E0E0E0] bg-white pl-9 pr-4 text-[13px] text-[#0D0D0D] placeholder:text-[#9CA3AF] outline-none focus:border-[#0D0D0D] transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
          <button
            onClick={() => setCategory("ALL")}
            className={cn("flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all",
              category === "ALL" ? "bg-[#0D0D0D] text-white" : "bg-white border border-[#E0E0E0] text-[#555] hover:border-[#0D0D0D]")}>
            All
          </button>
          {ALL_CATEGORIES.map(cat => {
            const cfg = CATEGORY_CFG[cat];
            const CatIcon = cfg.icon;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn("flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all",
                  category === cat
                    ? "text-white"
                    : "bg-white border border-[#E0E0E0] text-[#555] hover:border-[#0D0D0D]")}
                style={category === cat ? { background: cfg.color } : undefined}
              >
                <CatIcon className="h-3 w-3" />
                {cfg.label}
              </button>
            );
          })}
          <button
            onClick={() => setUnreadOnly(u => !u)}
            className={cn("flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all",
              unreadOnly ? "bg-[#EF4444] text-white" : "bg-white border border-[#E0E0E0] text-[#555] hover:border-[#EF4444]")}>
            <Filter className="h-3 w-3" />
            Unread only
          </button>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#9CA3AF]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
              style={{ background: "rgba(0,0,0,0.04)" }}
            >
              <Bell className="h-7 w-7 text-[#D1D5DB]" />
            </div>
            <p className="text-[15px] font-bold text-[#9CA3AF] mb-1">
              {unreadOnly ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="text-[12px] text-[#C0C0C0]">
              Order updates, rewards and offers will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map(n => (
                <NotifCard key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
