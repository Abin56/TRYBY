"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Profile = { name: string; email: string; image: string | null };

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#444] mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{error}</p>}
    </div>
  );
}

function input(hasError?: boolean) {
  return cn(
    "w-full h-11 rounded-xl border px-4 text-[14px] text-[#0D0D0D] outline-none bg-white transition-all",
    hasError ? "border-[#DC2626]" : "border-[#E0E0E0] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)]"
  );
}

function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-semibold",
      type === "success"
        ? "bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]"
        : "bg-[rgba(220,38,38,0.06)] border border-[rgba(220,38,38,0.15)] text-[#DC2626]"
    )}>
      {type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  );
}

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Name form
  const [name, setName]         = useState("");
  const [nameMsg, setNameMsg]   = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  // Email form
  const [newEmail, setNewEmail]       = useState("");
  const [emailPw, setEmailPw]         = useState("");
  const [emailMsg, setEmailMsg]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});

  // Password form
  const [curPw, setCurPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwMsg, setPwMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPw, setSavingPw]   = useState(false);
  const [pwErrors, setPwErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login?callbackUrl=/account/settings");
    if (status === "loading") return;
    fetch("/api/account/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setProfile(d); setName(d.name ?? ""); } })
      .finally(() => setLoadingProfile(false));
  }, [status, router]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) { setNameMsg({ type: "error", text: "Name must be at least 2 characters" }); return; }
    setSavingName(true); setNameMsg(null);
    const res = await fetch("/api/account/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_name", name: name.trim() }) });
    if (res.ok) {
      setNameMsg({ type: "success", text: "Name updated successfully" });
      setProfile(p => p ? { ...p, name: name.trim() } : p);
      await update({ name: name.trim() });
    } else {
      setNameMsg({ type: "error", text: "Failed to update name" });
    }
    setSavingName(false);
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailErrors({}); setEmailMsg(null);
    setSavingEmail(true);
    const res = await fetch("/api/account/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_email", email: newEmail, currentPassword: emailPw }) });
    const data = await res.json();
    if (res.ok) {
      setEmailMsg({ type: "success", text: "Email updated. Please sign in again with your new email." });
      setNewEmail(""); setEmailPw("");
    } else if (typeof data.error === "object") {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(data.error as Record<string, string[]>)) flat[k] = v[0];
      setEmailErrors(flat);
    } else {
      setEmailMsg({ type: "error", text: data.error ?? "Failed to update email" });
    }
    setSavingEmail(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErrors({}); setPwMsg(null);
    setSavingPw(true);
    const res = await fetch("/api/account/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_password", currentPassword: curPw, newPassword: newPw }) });
    const data = await res.json();
    if (res.ok) {
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setCurPw(""); setNewPw("");
    } else if (typeof data.error === "object") {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(data.error as Record<string, string[]>)) flat[k] = v[0];
      setPwErrors(flat);
    } else {
      setPwMsg({ type: "error", text: data.error ?? "Failed to change password" });
    }
    setSavingPw(false);
  }

  if (status === "loading" || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]"><Loader2 className="h-7 w-7 animate-spin text-[#9CA3AF]" /></div>;
  }

  const isGoogleOnly = !session?.user?.email?.includes("@") || (profile && !profile.email); // rough heuristic — API returns 422 for Google accounts on pw actions

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[600px] mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="text-[13px] font-semibold text-[#888] hover:text-[#0D0D0D] transition-colors">← Account</Link>
          <span className="text-[#CCCCCC]">/</span>
          <h1 className="text-[20px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Account Settings</h1>
        </div>

        {/* ── Display Name ── */}
        <div className="bg-white rounded-[20px] p-6 mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 className="text-[16px] font-black text-[#0D0D0D] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Display Name</h2>
          <form onSubmit={saveName} className="space-y-4">
            {nameMsg && <Toast type={nameMsg.type} message={nameMsg.text} />}
            <Field label="Full name">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={input()} autoComplete="name" />
            </Field>
            <button type="submit" disabled={savingName} className="flex h-10 items-center gap-2 px-5 rounded-xl font-bold text-[13px] text-[#0D0D0D] disabled:opacity-60 transition-all" style={{ background: "#F5C518" }}>
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Name"}
            </button>
          </form>
        </div>

        {/* ── Email ── */}
        <div className="bg-white rounded-[20px] p-6 mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 className="text-[16px] font-black text-[#0D0D0D] mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Email Address</h2>
          <p className="text-[12px] text-[#888] mb-4">Current: <strong>{profile?.email}</strong></p>
          <form onSubmit={saveEmail} className="space-y-4">
            {emailMsg && <Toast type={emailMsg.type} message={emailMsg.text} />}
            <Field label="New email address" error={emailErrors.email}>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={input(!!emailErrors.email)} autoComplete="email" />
            </Field>
            <Field label="Current password (to confirm)" error={emailErrors.currentPassword}>
              <input type="password" value={emailPw} onChange={e => setEmailPw(e.target.value)} className={input(!!emailErrors.currentPassword)} autoComplete="current-password" />
            </Field>
            <button type="submit" disabled={savingEmail} className="flex h-10 items-center gap-2 px-5 rounded-xl font-bold text-[13px] text-[#0D0D0D] disabled:opacity-60 transition-all" style={{ background: "#F5C518" }}>
              {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Email"}
            </button>
          </form>
        </div>

        {/* ── Password ── */}
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 className="text-[16px] font-black text-[#0D0D0D] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Change Password</h2>
          <form onSubmit={savePassword} className="space-y-4">
            {pwMsg && <Toast type={pwMsg.type} message={pwMsg.text} />}
            <Field label="Current password" error={pwErrors.currentPassword}>
              <div className="relative">
                <input type={showCur ? "text" : "password"} value={curPw} onChange={e => setCurPw(e.target.value)} className={input(!!pwErrors.currentPassword) + " pr-12"} autoComplete="current-password" />
                <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555]">
                  {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="New password (min. 8 characters)" error={pwErrors.newPassword}>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} className={input(!!pwErrors.newPassword) + " pr-12"} autoComplete="new-password" />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555]">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <button type="submit" disabled={savingPw} className="flex h-10 items-center gap-2 px-5 rounded-xl font-bold text-[13px] text-[#0D0D0D] disabled:opacity-60 transition-all" style={{ background: "#F5C518" }}>
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
