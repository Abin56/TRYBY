"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Heart, MapPin, Gift, Copy, Check,
  Loader2, Zap, Users, ArrowRight, ChevronRight, Bell,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Tab = "overview" | "rewards" | "referral";

/* ── Rewards mini-panel ──────────────────────────────────────── */

function RewardsPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<{ balance: number; transactions: { id: string; type: string; points: number; description?: string; createdAt: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/loyalty").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [userId]);

  const EARN_ICON: Record<string, string> = {
    EARN_ORDER: "📦", EARN_REVIEW: "⭐", EARN_REFERRAL: "👥",
    EARN_SIGNUP: "🎉", REDEEM: "🎁", EXPIRE: "⏰", ADMIN_ADJUST: "🔧",
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  const balance = data?.balance ?? 0;
  const rupeesValue = Math.floor(balance / 10);

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="rounded-2xl px-5 py-6 relative overflow-hidden text-center" style={{ background: "#0D0D0D" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #E8FF47 0%, transparent 60%)" }} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TRYBY Points</p>
        <p className="text-[52px] font-black text-[#E8FF47] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {balance.toLocaleString("en-IN")}
        </p>
        <p className="text-[12px] text-white/50 mt-1">≈ <span className="text-white font-bold">₹{rupeesValue}</span> redeemable</p>
        {balance >= 100 && (
          <Link href="/checkout" prefetch={false}
            className="inline-flex items-center gap-1.5 mt-4 rounded-xl px-4 py-2 font-black text-[12px] text-[#0D0D0D] hover:opacity-90"
            style={{ background: "#E8FF47", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>
            <Gift className="h-3.5 w-3.5" /> REDEEM AT CHECKOUT
          </Link>
        )}
      </div>

      {/* How to earn */}
      <div className="rounded-2xl border border-[#F0F0F0] bg-white p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9CA3AF] mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Earn More Points</p>
        <div className="space-y-2">
          {[
            { emoji: "📦", action: "Every Purchase", pts: "1 pt per ₹10" },
            { emoji: "⭐", action: "Write a Review", pts: "+25 pts" },
            { emoji: "👥", action: "Refer a Friend", pts: "+100 pts" },
          ].map(({ emoji, action, pts }) => (
            <div key={action} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2"><span>{emoji}</span><span className="font-medium text-[#555]">{action}</span></span>
              <span className="font-bold text-[#22C55E]">{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      {(data?.transactions?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-[#F0F0F0] bg-white overflow-hidden">
          <p className="px-4 py-3 border-b border-[#F5F5F5] text-[11px] font-black uppercase tracking-[0.14em] text-[#9CA3AF]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Recent Transactions</p>
          <div className="divide-y divide-[#F5F5F5]">
            {data?.transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-base">{EARN_ICON[tx.type] ?? "🔸"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#0D0D0D] truncate">{tx.description ?? tx.type.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                </div>
                <span className="font-black text-[14px]" style={{ color: tx.points > 0 ? "#22C55E" : "#EF4444", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {tx.points > 0 ? "+" : ""}{tx.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Referral mini-panel ─────────────────────────────────────── */

function ReferralPanel() {
  const [data, setData] = useState<{ code: string; referralCount: number; shareUrl: string; referrals: { id: string; status: string; referee?: { name?: string; email?: string } | null; createdAt: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    fetch("/api/referral").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!data?.shareUrl) return;
    navigator.clipboard.writeText(data.shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl px-5 py-6 text-center relative overflow-hidden" style={{ background: "#0D0D0D" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Your Referral Code</p>
        <button onClick={handleCopy}
          className="flex items-center justify-between mx-auto max-w-[220px] w-full rounded-2xl px-5 py-3.5 mb-3 transition-all hover:scale-[1.01]"
          style={{ background: "rgba(232,255,71,0.10)", border: "2px dashed rgba(232,255,71,0.45)" }}>
          <span className="text-[22px] font-black tracking-[0.16em] text-[#E8FF47]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{data?.code}</span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#E8FF47]/60">
            {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
          </span>
        </button>
        <p className="text-[12px] text-white/40">You earn <span className="text-white font-bold">+100 pts</span> · Friend gets <span className="text-white font-bold">+50 pts</span></p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(`Use my TRYBY referral code ${data?.code ?? ""} for ₹50 off! ${data?.shareUrl ?? ""}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-[12px] font-black text-white hover:opacity-90 transition-all"
          style={{ background: "#25D366", fontFamily: "'Barlow Condensed', sans-serif" }}>
          WhatsApp
        </a>
        <button onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-[12px] font-black text-[#0D0D0D] border-2 border-[#E0E0E0] hover:border-[#0D0D0D] transition-all"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {copied ? <><Check className="h-3.5 w-3.5 text-[#22C55E]" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy Link</>}
        </button>
      </div>

      {(data?.referrals?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-[#F0F0F0] bg-white overflow-hidden">
          <p className="px-4 py-3 border-b border-[#F5F5F5] text-[11px] font-black uppercase tracking-[0.14em] text-[#9CA3AF]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Referral History</p>
          {data?.referrals.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5] last:border-0">
              <p className="text-[12px] font-semibold text-[#0D0D0D]">{r.referee?.name ?? r.referee?.email ?? "Friend"}</p>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: r.status === "COMPLETED" || r.status === "REWARDED" ? "#22C55E" : "#F59E0B", background: r.status === "COMPLETED" || r.status === "REWARDED" ? "#F0FDF4" : "#FFFBEB" }}>
                {r.status === "COMPLETED" || r.status === "REWARDED" ? "Rewarded" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: ShoppingBag },
  { id: "rewards",  label: "Rewards",  icon: Zap         },
  { id: "referral", label: "Referral", icon: Users       },
];

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?callbackUrl=/account");
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]"><Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" /></div>;
  }
  if (!session?.user) return null;

  const user     = session.user;
  const initials = (user.name ?? user.email ?? "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-10">

        {/* Profile */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[20px] font-black text-[#0D0D0D]" style={{ background: "#F5C518" }}>
            {initials}
          </div>
          <div>
            <h1 className="text-[24px] font-black text-[#0D0D0D] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {user.name ?? "My Account"}
            </h1>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#E5E7EB] mb-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 shrink-0 px-4 py-3 text-[13px] font-semibold transition-colors border-b-2",
                tab === t.id ? "text-[#0D0D0D] border-[#0D0D0D]" : "text-[#9CA3AF] border-transparent hover:text-[#555]")}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === "overview" && (
              <div className="space-y-3">
                {[
                  { href: "/account/orders",        icon: ShoppingBag, label: "My Orders",        desc: "Track, return, or reorder"   },
                  { href: "/wishlist",               icon: Heart,       label: "My Wishlist",      desc: "Saved products"                  },
                  { href: "/account/notifications",  icon: Bell,        label: "Notifications",    desc: "Order updates, rewards & offers" },
                  { href: "/account/addresses",      icon: MapPin,      label: "Saved Addresses",  desc: "Manage delivery addresses"       },
                ].map(({ href, icon: Icon, label, desc }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-4 hover:shadow-md transition-all group"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(245,197,24,0.1)" }}>
                      <Icon className="h-5 w-5 text-[#F5C518]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-[#0D0D0D]">{label}</p>
                      <p className="text-[12px] text-[#888]">{desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#CCCCCC] group-hover:text-[#888] transition-colors" />
                  </Link>
                ))}
              </div>
            )}
            {tab === "rewards"  && <RewardsPanel userId={user.id ?? ""} />}
            {tab === "referral" && <ReferralPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
