"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Store, Truck, RotateCcw, Globe } from "lucide-react";

interface StoreConfig {
  storeName?: string;
  storeTagline?: string;
  supportEmail?: string;
  supportWhatsapp?: string;
  instagramHandle?: string;
  freeShippingThreshold?: number;
  standardShippingCost?: number;
  expressShippingCost?: number;
  codEnabled?: boolean;
  codMaxOrderValue?: number;
  defaultCurrency?: string;
  gstNumber?: string;
}

const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/50";
const TABS = ["Store", "Shipping", "Payments"] as const;
type Tab = typeof TABS[number];

export default function AdminSettingsPage() {
  const [tab, setTab]       = useState<Tab>("Store");
  const [config, setConfig] = useState<StoreConfig>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings?key=store_config")
      .then(r => r.json())
      .then(s => { if (s?.extraData) setConfig(s.extraData as StoreConfig); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(k: keyof StoreConfig, v: string | boolean | number) {
    setConfig(c => ({ ...c, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "store_config", extraData: config }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-6 w-6 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[700px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Settings
          </h1>
          <p className="text-white/40 text-[13px]">Store configuration — saved to database</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40 transition-all"
          style={{ background: saved ? "#4ADE80" : "#F5C518" }}
        >
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all"
            style={{ background: tab === t ? "#F5C518" : "transparent", color: tab === t ? "#0D0D0D" : "rgba(255,255,255,0.40)" }}
          >
            {t === "Store" && <Store className="h-3.5 w-3.5" />}
            {t === "Shipping" && <Truck className="h-3.5 w-3.5" />}
            {t === "Payments" && <RotateCcw className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-6 space-y-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* ─ Store Tab ─ */}
        {tab === "Store" && (
          <>
            <Row label="Store Name" desc="Appears in emails and SEO titles">
              <input value={config.storeName ?? ""} onChange={e => update("storeName", e.target.value)} placeholder="TRYBY Sports" className={inp} />
            </Row>
            <Row label="Tagline" desc="Used on OG images and meta descriptions">
              <input value={config.storeTagline ?? ""} onChange={e => update("storeTagline", e.target.value)} placeholder="Official Sports Gear, Delivered Fast" className={inp} />
            </Row>
            <Row label="Support Email" desc="Shown in emails and contact page">
              <input value={config.supportEmail ?? ""} onChange={e => update("supportEmail", e.target.value)} placeholder="support@tryby.in" className={inp} />
            </Row>
            <Row label="WhatsApp Number" desc="Linked on contact page and footer">
              <input value={config.supportWhatsapp ?? ""} onChange={e => update("supportWhatsapp", e.target.value)} placeholder="+91 98765 43210" className={inp} />
            </Row>
            <Row label="Instagram Handle" desc="Used for the @mention in footer">
              <input value={config.instagramHandle ?? ""} onChange={e => update("instagramHandle", e.target.value)} placeholder="@tryby.sports" className={inp} />
            </Row>
            <Row label="GST Number" desc="Printed on tax invoices">
              <input value={config.gstNumber ?? ""} onChange={e => update("gstNumber", e.target.value)} placeholder="22AAAAA0000A1Z5" className={inp} />
            </Row>
          </>
        )}

        {/* ─ Shipping Tab ─ */}
        {tab === "Shipping" && (
          <>
            <Row label="Free Shipping Above (₹)" desc="Orders above this get free standard shipping">
              <input type="number" value={config.freeShippingThreshold ?? 499} onChange={e => update("freeShippingThreshold", Number(e.target.value))} className={inp} />
            </Row>
            <Row label="Standard Shipping Cost (₹)" desc="Charged when order is below threshold">
              <input type="number" value={config.standardShippingCost ?? 49} onChange={e => update("standardShippingCost", Number(e.target.value))} className={inp} />
            </Row>
            <Row label="Express Shipping Cost (₹)" desc="Always charged for express delivery">
              <input type="number" value={config.expressShippingCost ?? 149} onChange={e => update("expressShippingCost", Number(e.target.value))} className={inp} />
            </Row>
          </>
        )}

        {/* ─ Payments Tab ─ */}
        {tab === "Payments" && (
          <>
            <Row label="Cash on Delivery" desc="Allow customers to pay on delivery">
              <button
                onClick={() => update("codEnabled", !config.codEnabled)}
                className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-all"
                style={{
                  background: config.codEnabled ? "rgba(245,197,24,0.08)" : "rgba(255,255,255,0.03)",
                  border: config.codEnabled ? "1px solid rgba(245,197,24,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-[13px] font-semibold text-white">{config.codEnabled ? "Enabled" : "Disabled"}</span>
                <div className={`h-5 w-9 rounded-full transition-all ${config.codEnabled ? "bg-[#F5C518]" : "bg-white/15"} flex items-center px-0.5`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow transition-all ${config.codEnabled ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            </Row>
            {config.codEnabled && (
              <Row label="COD Max Order Value (₹)" desc="Orders above this cannot use COD">
                <input type="number" value={config.codMaxOrderValue ?? 5000} onChange={e => update("codMaxOrderValue", Number(e.target.value))} className={inp} />
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5">
        <label className="block text-[13px] font-semibold text-white">{label}</label>
        {desc && <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
