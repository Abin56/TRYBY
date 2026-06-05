"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Building2, Phone, Share2, Receipt, Globe, Settings2 } from "lucide-react";

// Settings are stored as SiteSettings rows keyed by group:key pattern
// We upsert via PUT /api/admin/settings

interface SettingsSection {
  key: string;
  label: string;
  icon: React.ElementType;
  fields: { id: string; label: string; placeholder?: string; type?: string; hint?: string }[];
}

const SECTIONS: SettingsSection[] = [
  {
    key: "company", label: "Company Details", icon: Building2,
    fields: [
      { id: "companyName",     label: "Company / Brand Name",  placeholder: "TRYBY Sports Pvt Ltd" },
      { id: "legalName",       label: "Legal Entity Name",     placeholder: "TRYBY Sports Private Limited" },
      { id: "gstin",           label: "GSTIN",                 placeholder: "27AADCT1234A1Z5" },
      { id: "pan",             label: "PAN Number",            placeholder: "AADCT1234A" },
      { id: "cin",             label: "CIN (optional)",        placeholder: "U74999MH2024PTC123456" },
      { id: "incorporatedYear",label: "Year Incorporated",     placeholder: "2024", type: "number" },
    ],
  },
  {
    key: "contact", label: "Contact Details", icon: Phone,
    fields: [
      { id: "supportEmail",    label: "Support Email",         placeholder: "support@tryby.in", type: "email" },
      { id: "ordersEmail",     label: "Orders / Transactional Email", placeholder: "orders@tryby.in", type: "email" },
      { id: "supportPhone",    label: "Support Phone",         placeholder: "+91 98765 43210" },
      { id: "whatsappNumber",  label: "WhatsApp Number",       placeholder: "+91 98765 43210" },
      { id: "officeAddress",   label: "Registered Address",    placeholder: "123 Sports Lane, Mumbai, MH 400001" },
    ],
  },
  {
    key: "social", label: "Social Links", icon: Share2,
    fields: [
      { id: "instagram",  label: "Instagram",  placeholder: "https://instagram.com/trybysports", type: "url" },
      { id: "facebook",   label: "Facebook",   placeholder: "https://facebook.com/trybysports",  type: "url" },
      { id: "twitter",    label: "X / Twitter",placeholder: "https://x.com/trybysports",         type: "url" },
      { id: "youtube",    label: "YouTube",    placeholder: "https://youtube.com/@trybysports",  type: "url" },
      { id: "linkedin",   label: "LinkedIn",   placeholder: "https://linkedin.com/company/tryby",type: "url" },
    ],
  },
  {
    key: "invoice", label: "Invoice & GST Settings", icon: Receipt,
    fields: [
      { id: "invoicePrefix",   label: "Invoice Prefix",        placeholder: "TRYBY-INV-" },
      { id: "invoiceFooter",   label: "Invoice Footer Note",   placeholder: "Thank you for your purchase. All disputes subject to Mumbai jurisdiction." },
      { id: "gstRate",         label: "Default GST Rate (%)",  placeholder: "18", type: "number" },
      { id: "taxLabel",        label: "Tax Label",             placeholder: "IGST" },
      { id: "bankName",        label: "Bank Name",             placeholder: "HDFC Bank" },
      { id: "bankAccount",     label: "Account Number",        placeholder: "XXXX-XXXX-XXXX" },
      { id: "bankIfsc",        label: "IFSC Code",             placeholder: "HDFC0001234" },
    ],
  },
  {
    key: "platform", label: "Platform Settings", icon: Globe,
    fields: [
      { id: "storeName",       label: "Store Display Name",    placeholder: "TRYBY Sports" },
      { id: "storeTagline",    label: "Tagline",               placeholder: "Play. Train. Win." },
      { id: "defaultCurrency", label: "Currency",              placeholder: "INR" },
      { id: "freeShippingAbove",label: "Free Shipping Above (₹)", placeholder: "999", type: "number" },
      { id: "codCharge",       label: "COD Handling Charge (₹)", placeholder: "49", type: "number" },
      { id: "returnWindowDays",label: "Return Window (days)", placeholder: "7", type: "number", hint: "Days from delivery within which returns are accepted" },
      { id: "minOrderValue",   label: "Minimum Order Value (₹)", placeholder: "0", type: "number" },
    ],
  },
];

type SettingsData = Record<string, Record<string, string>>;

const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/20 outline-none transition-colors bg-[#0D0D0D] border border-white/08 h-10 focus:border-[#E8FF47]/50";
const CARD = "rounded-2xl border p-5";
const CARD_S = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

export default function SettingsCenterPage() {
  const [data,    setData]    = useState<SettingsData>({});
  const [saving,  setSaving]  = useState<string | null>(null);
  const [saved,   setSaved]   = useState<string | null>(null);
  const [active,  setActive]  = useState(SECTIONS[0].key);

  useEffect(() => {
    // Load all settings
    fetch("/api/admin/settings").then(r => r.ok ? r.json() : [])
      .then((rows: { key: string; extraData: Record<string, string> | null }[]) => {
        const parsed: SettingsData = {};
        for (const row of rows) {
          const [section, ...rest] = row.key.split(":");
          if (rest.length) {
            parsed[section] = parsed[section] ?? {};
            parsed[section][rest.join(":")] = (row.extraData as Record<string, string>)?.value ?? "";
          } else if (row.extraData) {
            parsed[row.key] = row.extraData as Record<string, string>;
          }
        }
        setData(parsed);
      }).catch(() => {});
  }, []);

  async function saveSection(sectionKey: string) {
    setSaving(sectionKey);
    try {
      const sectionData = data[sectionKey] ?? {};
      await fetch("/api/admin/settings", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: `__section__${sectionKey}`, extraData: sectionData }),
      });
      setSaved(sectionKey);
      setTimeout(() => setSaved(null), 2000);
    } finally { setSaving(null); }
  }

  function setValue(section: string, field: string, value: string) {
    setData(prev => ({ ...prev, [section]: { ...(prev[section] ?? {}), [field]: value } }));
  }

  const activeSection = SECTIONS.find(s => s.key === active)!;

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>System Settings</h1>
      <p className="text-white/40 text-[13px] mb-6">Company, contact, GST, invoice, and platform configuration</p>

      <div className="flex gap-4">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0">
          <div className="space-y-1 sticky top-6">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActive(s.key)}
                className="w-full flex items-center gap-2.5 h-9 px-3 rounded-xl text-[13px] font-semibold transition-all text-left"
                style={{
                  background: active === s.key ? "rgba(232,255,71,0.12)" : "transparent",
                  color: active === s.key ? "#E8FF47" : "rgba(255,255,255,0.4)",
                }}>
                <s.icon className="h-4 w-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 min-w-0">
          <div className={CARD} style={CARD_S}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(232,255,71,0.12)" }}>
                <activeSection.icon className="h-4 w-4 text-[#E8FF47]" />
              </div>
              <h2 className="text-white font-bold text-[15px]">{activeSection.label}</h2>
            </div>

            <div className="space-y-4">
              {activeSection.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input
                    type={field.type ?? "text"}
                    value={data[activeSection.key]?.[field.id] ?? ""}
                    onChange={e => setValue(activeSection.key, field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={inp}
                  />
                  {field.hint && <p className="text-[11px] text-white/25 mt-1">{field.hint}</p>}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-5 mt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <button onClick={() => saveSection(activeSection.key)}
                disabled={saving === activeSection.key}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all"
                style={{ background: "#E8FF47", color: "#0D0D0D" }}>
                {saving === activeSection.key
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <Save className="h-4 w-4" />}
                {saved === activeSection.key ? "Saved ✓" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
