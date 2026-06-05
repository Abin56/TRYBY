"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck, Save, RotateCcw, CheckCircle2, AlertTriangle,
  Plus, X, ChevronDown, Zap, Eye, EyeOff, Loader2, Wifi, WifiOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShippingSettings {
  freeShippingThreshold: number;
  standardShippingCost: number;
  expressShippingCost: number;
  codEnabled: boolean;
  codExtraCharge: number;
  codMinOrder: number;
  estimatedDeliveryDays: {
    standard: { min: number; max: number };
    express:  { min: number; max: number };
  };
  preferredCouriers: string[];
  restrictedPincodes: string[];
  internationalEnabled: boolean;
}

const COURIER_OPTIONS = [
  "SHIPROCKET", "DELHIVERY", "DTDC", "INDIA_POST",
  "BLUEDART", "XPRESSBEES", "ECOM_EXPRESS",
];

const COURIER_LABELS: Record<string, string> = {
  SHIPROCKET: "Shiprocket", DELHIVERY: "Delhivery", DTDC: "DTDC",
  INDIA_POST: "India Post", BLUEDART: "BlueDart",
  XPRESSBEES: "Xpressbees", ECOM_EXPRESS: "Ecom Express",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function NumberInput({
  label, value, onChange, prefix, min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-white/30">{prefix}</span>
        )}
        <input
          type="number" min={min} step="1"
          value={value}
          onChange={e => onChange(Math.max(min, Number(e.target.value)))}
          className="w-full rounded-xl text-[13px] font-semibold text-white outline-none"
          style={{
            height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)",
            paddingLeft: prefix ? "28px" : "16px", paddingRight: "16px",
          }}
        />
      </div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[13px] font-semibold text-white">{label}</p>
        {desc && <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative h-6 w-10 rounded-full transition-colors shrink-0"
        style={{ background: value ? "#F5C518" : "rgba(255,255,255,0.1)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ left: value ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}

// ── Shiprocket Credentials Card ───────────────────────────────────────────────

interface SrCreds {
  email: string;
  passwordSet: boolean;
  webhookSecret: string;
  pickupLocation: string;
  source: "database" | "environment" | "not_configured";
}

function ShiprocketCard({ autoAwbEnabled, onAutoAwbChange }: {
  autoAwbEnabled: boolean;
  onAutoAwbChange: (v: boolean) => void;
}) {
  const [creds, setCreds]           = useState<SrCreds | null>(null);
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [webhook, setWebhook]       = useState("");
  const [pickupLoc, setPickupLoc]   = useState("Primary");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [err, setErr]               = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/settings/shiprocket")
      .then(r => r.ok ? r.json() : null)
      .then((d: SrCreds | null) => {
        if (!d) return;
        setCreds(d);
        setEmail(d.email);
        setWebhook(d.webhookSecret === "***" ? "" : d.webhookSecret);
        setPickupLoc(d.pickupLocation);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!email) { setErr("Email is required"); return; }
    if (!password && !creds?.passwordSet) { setErr("Password is required"); return; }
    setErr(""); setSaving(true);
    try {
      const body: Record<string, string> = { email, pickupLocation: pickupLoc };
      if (password) body.password = password;
      if (webhook)  body.webhookSecret = webhook;
      const res = await fetch("/api/admin/settings/shiprocket", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Save failed"); return; }
      setSaved(true); setPassword(""); load();
      setTimeout(() => setSaved(false), 2500);
    } catch { setErr("Network error"); }
    finally { setSaving(false); }
  }

  async function testConnection() {
    setTesting(true); setTestResult(null);
    try {
      const body: Record<string, string> = { action: "test" };
      if (email && password) { body.email = email; body.password = password; }
      const res  = await fetch("/api/admin/settings/shiprocket", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? `Connected as ${data.email}` : (data.error ?? "Failed") });
    } catch { setTestResult({ ok: false, msg: "Network error" }); }
    finally { setTesting(false); }
  }

  const sourceLabel: Record<string, string> = {
    database:      "Saved in DB",
    environment:   "From env vars",
    not_configured: "Not configured",
  };
  const sourceColor: Record<string, string> = {
    database: "#4ADE80", environment: "#F5C518", not_configured: "#F87171",
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(245,197,24,0.1)" }}>
            <Truck className="h-4 w-4 text-[#F5C518]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">Shiprocket</p>
            {creds && (
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: sourceColor[creds.source] ?? "#888" }}>
                {sourceLabel[creds.source] ?? creds.source}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
          {testing
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : testResult?.ok
              ? <Wifi className="h-3 w-3 text-[#4ADE80]" />
              : testResult
                ? <WifiOff className="h-3 w-3 text-[#F87171]" />
                : <Wifi className="h-3 w-3" />}
          Test Connection
        </button>
      </div>

      {testResult && (
        <div className="px-6 py-3 text-[12px] font-semibold flex items-center gap-2 border-b"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
            background: testResult.ok ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)",
            color:       testResult.ok ? "#4ADE80" : "#F87171",
          }}>
          {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
          {testResult.msg}
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Shiprocket Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
            style={{ height: "44px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">
            Password {creds?.passwordSet && !password && (
              <span className="ml-1 text-[#4ADE80] normal-case font-semibold">(saved — leave blank to keep)</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder={creds?.passwordSet ? "••••••••" : "Enter password"}
              className="w-full rounded-xl px-4 pr-11 text-[13px] text-white placeholder:text-white/20 outline-none"
              style={{ height: "44px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Pickup location + webhook in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Pickup Location Name</label>
            <input
              value={pickupLoc} onChange={e => setPickupLoc(e.target.value)}
              placeholder="Primary"
              className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
              style={{ height: "44px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <p className="text-[10px] text-white/20 mt-1">Must match the pickup address name in your Shiprocket account.</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Webhook Secret</label>
            <input
              value={webhook} onChange={e => setWebhook(e.target.value)}
              placeholder="Optional — HMAC signature secret"
              className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
              style={{ height: "44px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>

        {/* Webhook URL (read-only info) */}
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Webhook URL (set in Shiprocket → Settings → Webhooks)</p>
          <p className="text-[12px] font-mono text-white/60 break-all">
            {typeof window !== "undefined" ? window.location.origin : "https://your-store.com"}
            /api/webhooks/shiprocket
          </p>
        </div>

        {/* Auto-AWB toggle */}
        <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#F5C518]" />
            <div>
              <p className="text-[13px] font-semibold text-white">Auto-Generate AWB on Shipped</p>
              <p className="text-[11px] text-white/35 mt-0.5">Automatically book Shiprocket AWB when an order is marked as Shipped</p>
            </div>
          </div>
          <button
            onClick={() => onAutoAwbChange(!autoAwbEnabled)}
            className="relative h-6 w-10 rounded-full transition-colors shrink-0 ml-4"
            style={{ background: autoAwbEnabled ? "#F5C518" : "rgba(255,255,255,0.1)" }}>
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              style={{ left: autoAwbEnabled ? "calc(100% - 22px)" : "2px" }}
            />
          </button>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#F87171]"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
          </div>
        )}

        <button
          onClick={save} disabled={saving}
          className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-60 transition-opacity w-full sm:w-auto"
          style={{ background: saved ? "#4ADE80" : "#F5C518" }}>
          {saving
            ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
            : saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</>
            : <><Save className="h-4 w-4" /> Save Shiprocket Credentials</>}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShippingSettingsPage() {
  const [settings, setSettings]   = useState<ShippingSettings | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [err, setErr]             = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [showCourierPicker, setShowCourierPicker] = useState(false);
  const [autoAwbEnabled, setAutoAwbEnabled]       = useState(false);
  const [togglingAutoAwb, setTogglingAutoAwb]     = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/shipping")
      .then(r => r.json())
      .then(setSettings)
      .catch(() => setErr("Failed to load settings"))
      .finally(() => setLoading(false));

    // Load the auto-AWB feature flag state
    fetch("/api/admin/feature-flags")
      .then(r => r.ok ? r.json() : [])
      .then((flags: { key: string; enabled: boolean }[]) => {
        const flag = flags.find(f => f.key === "shiprocket_auto_awb");
        if (flag) setAutoAwbEnabled(flag.enabled);
      })
      .catch(() => {});
  }, []);

  async function toggleAutoAwb(enabled: boolean) {
    setTogglingAutoAwb(true);
    try {
      await fetch("/api/admin/feature-flags", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: "shiprocket_auto_awb", enabled }),
      });
      setAutoAwbEnabled(enabled);
    } catch { /* non-blocking */ }
    finally { setTogglingAutoAwb(false); }
  }

  function set<K extends keyof ShippingSettings>(key: K, val: ShippingSettings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: val } : null);
  }

  function setDelivery(type: "standard" | "express", field: "min" | "max", val: number) {
    setSettings(prev => prev ? {
      ...prev,
      estimatedDeliveryDays: {
        ...prev.estimatedDeliveryDays,
        [type]: { ...prev.estimatedDeliveryDays[type], [field]: val },
      },
    } : null);
  }

  async function save() {
    if (!settings) return;
    setErr(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Save failed"); return; }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setErr("Network error"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-white/30 text-[13px]">
        Failed to load shipping settings.
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[860px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Shipping Settings
          </h1>
          <p className="text-white/40 text-[13px]">Delivery costs · COD · Couriers · Estimates</p>
        </div>
        <button
          onClick={save} disabled={saving}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-60 transition-opacity"
          style={{ background: saved ? "#4ADE80" : "#F5C518" }}
        >
          {saving ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
            : saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</>
            : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      {err && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-[13px] font-semibold text-[#F87171]"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      <div className="space-y-5">

        {/* Shiprocket integration */}
        <ShiprocketCard
          autoAwbEnabled={autoAwbEnabled}
          onAutoAwbChange={enabled => { if (!togglingAutoAwb) toggleAutoAwb(enabled); }}
        />

        {/* Shipping costs */}
        <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Truck className="h-4 w-4 text-white/40" />
            <p className="text-[14px] font-bold text-white">Shipping Costs</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NumberInput label="Free Shipping Above" value={settings.freeShippingThreshold}
              onChange={v => set("freeShippingThreshold", v)} prefix="₹" />
            <NumberInput label="Standard Rate" value={settings.standardShippingCost}
              onChange={v => set("standardShippingCost", v)} prefix="₹" />
            <NumberInput label="Express Rate" value={settings.expressShippingCost}
              onChange={v => set("expressShippingCost", v)} prefix="₹" />
          </div>
        </div>

        {/* Delivery estimates */}
        <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[14px] font-bold text-white mb-5">Delivery Estimates</p>
          <div className="space-y-4">
            {(["standard", "express"] as const).map(type => (
              <div key={type}>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3 capitalize">{type}</p>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput label="Min Days" value={settings.estimatedDeliveryDays[type].min}
                    onChange={v => setDelivery(type, "min", v)} min={1} />
                  <NumberInput label="Max Days" value={settings.estimatedDeliveryDays[type].max}
                    onChange={v => setDelivery(type, "max", v)} min={1} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COD settings */}
        <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[14px] font-bold text-white mb-1">Cash on Delivery</p>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Toggle
              label="COD Enabled"
              desc="Allow customers to pay cash on delivery"
              value={settings.codEnabled}
              onChange={v => set("codEnabled", v)}
            />
            {settings.codEnabled && (
              <>
                <div className="py-3 grid grid-cols-2 gap-4">
                  <NumberInput label="COD Extra Charge" value={settings.codExtraCharge}
                    onChange={v => set("codExtraCharge", v)} prefix="₹" />
                  <NumberInput label="Min Order for COD" value={settings.codMinOrder}
                    onChange={v => set("codMinOrder", v)} prefix="₹" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Courier preferences */}
        <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-bold text-white">Preferred Couriers</p>
            <div className="relative">
              <button
                onClick={() => setShowCourierPicker(v => !v)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white/50 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Plus className="h-3 w-3" /> Add Courier <ChevronDown className="h-3 w-3" />
              </button>
              {showCourierPicker && (
                <div className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden py-1 w-40"
                  style={{ background: "#2A2A2A", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                  {COURIER_OPTIONS.filter(c => !settings.preferredCouriers.includes(c)).map(c => (
                    <button key={c}
                      onClick={() => {
                        set("preferredCouriers", [...settings.preferredCouriers, c]);
                        setShowCourierPicker(false);
                      }}
                      className="flex w-full px-4 py-2 text-[12px] font-semibold text-left text-white/60 hover:text-white hover:bg-white/05 transition-colors">
                      {COURIER_LABELS[c] ?? c}
                    </button>
                  ))}
                  {COURIER_OPTIONS.every(c => settings.preferredCouriers.includes(c)) && (
                    <p className="px-4 py-2 text-[11px] text-white/25">All couriers added</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {settings.preferredCouriers.length === 0 ? (
            <p className="text-[12px] text-white/25">No couriers configured — add at least one preferred courier.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {settings.preferredCouriers.map((c, i) => (
                <div key={c} className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-[11px] font-bold text-white/70">{i + 1}. {COURIER_LABELS[c] ?? c}</span>
                  <button onClick={() => set("preferredCouriers", settings.preferredCouriers.filter(x => x !== c))}
                    className="text-white/25 hover:text-white/60 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-white/20 mt-3">Order determines dispatch priority. Drag to reorder (coming soon).</p>
        </div>

        {/* Restricted pincodes */}
        <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[14px] font-bold text-white mb-4">Restricted Pincodes</p>
          <div className="flex gap-2 mb-3">
            <input
              value={newPincode}
              onChange={e => setNewPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit pincode"
              className="flex-1 rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
              style={{ height: "40px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
              onKeyDown={e => {
                if (e.key === "Enter" && newPincode.length === 6) {
                  set("restrictedPincodes", [...new Set([...settings.restrictedPincodes, newPincode])]);
                  setNewPincode("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newPincode.length === 6) {
                  set("restrictedPincodes", [...new Set([...settings.restrictedPincodes, newPincode])]);
                  setNewPincode("");
                }
              }}
              className="h-10 px-4 rounded-xl text-[12px] font-bold text-[#0D0D0D]"
              style={{ background: "#F5C518" }}>
              Add
            </button>
          </div>
          {settings.restrictedPincodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {settings.restrictedPincodes.map(p => (
                <div key={p} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  <span className="text-[11px] font-mono font-bold text-[#F87171]">{p}</span>
                  <button onClick={() => set("restrictedPincodes", settings.restrictedPincodes.filter(x => x !== p))}
                    className="text-[#F87171]/40 hover:text-[#F87171] transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other toggles */}
        <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[14px] font-bold text-white mb-1">Other Options</p>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Toggle
              label="International Shipping"
              desc="Enable orders from outside India"
              value={settings.internationalEnabled}
              onChange={v => set("internationalEnabled", v)}
            />
          </div>
        </div>

        {/* Integrations link */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)" }}>
          <div className="flex items-start gap-3">
            <RotateCcw className="h-4 w-4 text-[#60A5FA] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[12px] font-bold text-[#60A5FA] mb-1">Courier API Integrations</p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Connect Shiprocket, Delhivery, and NimbusPost to auto-generate AWBs, create shipments,
                and receive live tracking updates via webhooks.
              </p>
              <a
                href="/admin/settings/shipping/integrations"
                className="inline-block mt-2 text-[11px] font-bold text-[#60A5FA] hover:underline"
              >
                Manage Courier Integrations →
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
