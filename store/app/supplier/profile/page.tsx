"use client";

import { useEffect, useState } from "react";
import { User, Building2, CreditCard, Save, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type SupplierProfile = {
  id: string;
  companyName: string;
  gstin: string | null;
  panNumber: string | null;
  bankAccountNo: string | null;
  bankIfsc: string | null;
  bankAccountName: string | null;
  websiteUrl: string | null;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  commissionRate: number;
  createdAt: string;
  onboardedAt: string | null;
  user: { name: string | null; email: string | null; image: string | null };
};

type ActivityLog = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  resourceId: string | null;
};

const ACTION_COLOR: Record<string, string> = {
  PRODUCT_CREATED:  "#F5C518",
  PAYOUT_REQUESTED: "#A78BFA",
  PROFILE_UPDATED:  "#60A5FA",
};

export default function SupplierProfilePage() {
  const [profile, setProfile]     = useState<SupplierProfile | null>(null);
  const [logs, setLogs]           = useState<ActivityLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm]           = useState({
    name: "", companyName: "", websiteUrl: "",
    bankAccountNo: "", bankIfsc: "", bankAccountName: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/supplier/me").then(r => r.json()),
      fetch("/api/supplier/activity").then(r => r.json()),
    ]).then(([me, activity]) => {
      const s = me.supplier;
      setProfile(s);
      setForm({
        name:           s.user.name ?? "",
        companyName:    s.companyName ?? "",
        websiteUrl:     s.websiteUrl ?? "",
        bankAccountNo:  s.bankAccountNo ?? "",
        bankIfsc:       s.bankIfsc ?? "",
        bankAccountName: s.bankAccountName ?? "",
      });
      setLogs(activity.logs ?? []);
      setLoading(false);
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/supplier/profile", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setSaveError(d.error ?? "Failed to save");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // reload activity
    fetch("/api/supplier/activity").then(r => r.json()).then(d => setLogs(d.logs ?? []));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
      </div>
    );
  }

  const STATUS_COLOR: Record<string, string> = { PENDING: "#F5C518", APPROVED: "#4ADE80", SUSPENDED: "#F87171" };
  const statusColor = STATUS_COLOR[profile?.status ?? "PENDING"];

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-white font-black"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
        >
          Profile
        </h1>
        <p className="text-white/40 text-[13px] mt-0.5">Manage your account and business details</p>
      </div>

      {/* Account status banner */}
      <div
        className="flex items-center gap-3 rounded-2xl p-4 mb-6"
        style={{ background: `${statusColor}0D`, border: `1px solid ${statusColor}25` }}
      >
        {profile?.status === "APPROVED"   && <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: statusColor }} />}
        {profile?.status === "PENDING"    && <Clock className="h-5 w-5 shrink-0" style={{ color: statusColor }} />}
        {profile?.status === "SUSPENDED"  && <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: statusColor }} />}
        <div>
          <p className="font-bold text-[14px]" style={{ color: statusColor }}>
            {profile?.status === "APPROVED"  && "Account active"}
            {profile?.status === "PENDING"   && "Awaiting approval"}
            {profile?.status === "SUSPENDED" && "Account suspended"}
          </p>
          <p className="text-[12px] text-white/40 mt-0.5">
            Commission rate: {((Number(profile?.commissionRate ?? 0)) * 100).toFixed(1)}% (set by admin) ·
            Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Personal info */}
        <section
          className="rounded-2xl p-5"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-[#F5C518]" />
            <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>
              Personal Info
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Your Name</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Email</label>
              <input value={profile?.user.email ?? ""} disabled
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white/40 outline-none cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              />
            </div>
          </div>
        </section>

        {/* Business details */}
        <section
          className="rounded-2xl p-5"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-[#60A5FA]" />
            <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>
              Business Details
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Company Name</label>
              <input name="companyName" value={form.companyName} onChange={handleChange}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Website URL</label>
              <input name="websiteUrl" value={form.websiteUrl} onChange={handleChange} type="url"
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                placeholder="https://"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">GSTIN</label>
              <input value={profile?.gstin ?? ""} disabled
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white/40 outline-none cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">PAN Number</label>
              <input value={profile?.panNumber ?? ""} disabled
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white/40 outline-none cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              />
            </div>
          </div>
        </section>

        {/* Bank details */}
        <section
          className="rounded-2xl p-5"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-[#A78BFA]" />
            <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>
              Bank Details
            </h2>
          </div>
          <p className="text-[12px] text-white/35 mb-4">Required for payout processing. Keep this accurate.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Account Holder Name</label>
              <input name="bankAccountName" value={form.bankAccountName} onChange={handleChange}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">IFSC Code</label>
              <input name="bankIfsc" value={form.bankIfsc} onChange={handleChange}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                placeholder="SBIN0001234"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Account Number</label>
              <input name="bankAccountNo" value={form.bankAccountNo} onChange={handleChange}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
        </section>

        {/* Save button */}
        {saveError && (
          <p className="text-[12px] text-[#F87171] px-1">{saveError}</p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-black text-[14px] disabled:opacity-50 transition-all hover:brightness-110"
            style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-[#4ADE80] text-[13px] font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </form>

      {/* Activity log */}
      <div className="mt-10">
        <h2
          className="text-white font-black mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}
        >
          Activity Log
        </h2>
        {logs.length === 0 ? (
          <p className="text-white/30 text-[13px]">No activity yet</p>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div
                    className="mt-0.5 h-2 w-2 rounded-full shrink-0"
                    style={{ background: ACTION_COLOR[log.action] ?? "rgba(255,255,255,0.3)", marginTop: "5px" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white/70">{log.detail}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{log.action.replace("_", " ")}</p>
                  </div>
                  <p className="text-[11px] text-white/25 shrink-0">
                    {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
