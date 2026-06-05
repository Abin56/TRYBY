"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Power, RefreshCw, Plus, X, ShieldAlert, Clock } from "lucide-react";

interface MaintenanceState {
  enabled:      boolean;
  title:        string;
  message:      string;
  estimatedEnd: string | null;
  allowedIps:   string[];
}

const CARD = "rounded-2xl border p-5";
const CARD_S = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };
const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors bg-[#0D0D0D] border border-white/08 focus:border-[#E8FF47]/50";

export default function MaintenancePage() {
  const [state,   setState]   = useState<MaintenanceState | null>(null);
  const [form,    setForm]    = useState<MaintenanceState>({ enabled: false, title: "We'll be right back", message: "TRYBY is undergoing scheduled maintenance. We'll be back shortly.", estimatedEnd: null, allowedIps: [] });
  const [saving,  setSaving]  = useState(false);
  const [newIp,   setNewIp]   = useState("");

  useEffect(() => {
    fetch("/api/admin/maintenance").then(r => r.json()).then((d: MaintenanceState) => {
      setState(d);
      setForm(d);
    }).catch(() => {});
  }, []);

  async function save(overrideEnabled?: boolean) {
    setSaving(true);
    try {
      const payload = { ...form, ...(overrideEnabled !== undefined ? { enabled: overrideEnabled } : {}) };
      const res = await fetch("/api/admin/maintenance", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json();
        setState(updated);
        setForm(updated);
      }
    } finally { setSaving(false); }
  }

  function addIp() {
    const ip = newIp.trim();
    if (!ip || form.allowedIps.includes(ip)) return;
    setForm(f => ({ ...f, allowedIps: [...f.allowedIps, ip] }));
    setNewIp("");
  }

  function removeIp(ip: string) {
    setForm(f => ({ ...f, allowedIps: f.allowedIps.filter(i => i !== ip) }));
  }

  const isEnabled = state?.enabled ?? false;

  return (
    <div className="p-6 lg:p-8 max-w-[700px]">
      <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Maintenance Mode</h1>
      <p className="text-white/40 text-[13px] mb-6">When enabled, all public pages show a maintenance screen. Admin routes stay accessible.</p>

      {/* Status banner */}
      <div className="rounded-2xl p-4 mb-6 border flex items-center gap-4" style={{
        background: isEnabled ? "rgba(239,68,68,0.08)" : "rgba(74,222,128,0.06)",
        borderColor: isEnabled ? "rgba(239,68,68,0.25)" : "rgba(74,222,128,0.2)",
      }}>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isEnabled ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.12)" }}>
          {isEnabled ? <ShieldAlert className="h-5 w-5 text-red-400" /> : <CheckCircle2 className="h-5 w-5 text-green-400" />}
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold" style={{ color: isEnabled ? "#F87171" : "#4ADE80" }}>
            {isEnabled ? "Maintenance mode is ACTIVE" : "Site is LIVE — maintenance mode off"}
          </p>
          <p className="text-[12px] text-white/40">
            {isEnabled ? "Customers see the maintenance page. Admins bypass automatically." : "All visitors can access the store normally."}
          </p>
        </div>
        <button onClick={() => save(!isEnabled)} disabled={saving}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
          style={{ background: isEnabled ? "#4ADE80" : "#F87171", color: "#0D0D0D" }}>
          <Power className="h-4 w-4" />
          {isEnabled ? "Disable" : "Enable"}
        </button>
      </div>

      {/* Config form */}
      <div className={`${CARD} space-y-4`} style={CARD_S}>
        <h2 className="text-white font-bold text-[14px]">Maintenance Page Content</h2>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="We'll be right back" className={`${inp} h-10`} />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Message</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={3} placeholder="TRYBY is undergoing scheduled maintenance..."
            className={`${inp} pt-2.5 resize-none`} />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
            <Clock className="inline h-3 w-3 mr-1" />Estimated End (optional)
          </label>
          <input type="datetime-local" value={form.estimatedEnd ? new Date(form.estimatedEnd).toISOString().slice(0, 16) : ""}
            onChange={e => setForm(f => ({ ...f, estimatedEnd: e.target.value ? new Date(e.target.value).toISOString() : null }))}
            className={`${inp} h-10`} />
        </div>

        {/* IP Whitelist */}
        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
            IP Whitelist — bypass maintenance
          </label>
          <div className="flex gap-2 mb-2">
            <input value={newIp} onChange={e => setNewIp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addIp()}
              placeholder="192.168.1.1 or *" className={`${inp} h-9 flex-1`} />
            <button onClick={addIp}
              className="h-9 px-3 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {form.allowedIps.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.allowedIps.map(ip => (
                <span key={ip} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                  {ip}
                  <button onClick={() => removeIp(ip)} className="hover:text-red-400 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-white/25 mt-1.5">Use <code className="text-white/40">*</code> to allow all IPs. Admin users always bypass via their role.</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={() => save()} disabled={saving}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
            Save Settings
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className={`${CARD} mt-4`} style={CARD_S}>
        <p className="text-[12px] font-bold text-white/40 mb-3 uppercase tracking-wider">Customer Preview</p>
        <div className="rounded-xl p-6 text-center" style={{ background: "#0D0D0D" }}>
          <div className="text-[22px] font-black mb-4 tracking-tight">
            TRY<span style={{ color: "#F5C518" }}>BY</span>
          </div>
          <h3 className="text-white font-bold text-[16px] mb-2">{form.title}</h3>
          <p className="text-white/50 text-[13px] max-w-[300px] mx-auto leading-relaxed">{form.message}</p>
          <div className="inline-block mt-4 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{ background: "rgba(245,197,24,0.12)", color: "#F5C518", border: "1px solid rgba(245,197,24,0.25)" }}>
            SCHEDULED MAINTENANCE
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl p-3.5 border" style={{ background: "rgba(245,197,24,0.04)", borderColor: "rgba(245,197,24,0.15)" }}>
        <p className="text-[12px] text-yellow-400/80 font-semibold mb-1 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> Important
        </p>
        <p className="text-[11px] text-white/40 leading-relaxed">
          Maintenance mode applies to public pages only. Admin, supplier, and auth routes always remain accessible.
          The maintenance status is cached for 60 seconds — allow up to 1 minute for changes to propagate.
        </p>
      </div>
    </div>
  );
}
