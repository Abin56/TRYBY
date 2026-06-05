"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Warehouse, Plus, Edit2, Trash2, X, Check, AlertTriangle,
  MapPin, Package, Star, ChevronDown, CheckCircle2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WarehouseRow {
  id: string; name: string; code: string;
  addressLine: string | null; city: string | null; state: string | null;
  pincode: string | null; phone: string | null;
  isActive: boolean; isDefault: boolean; notes: string | null;
  totalUnits: number; _count: { stocks: number };
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function WarehouseForm({
  initial,
  onSave,
  onClose,
  saving,
  err,
}: {
  initial?: Partial<WarehouseRow>;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  saving: boolean;
  err: string;
}) {
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [code,        setCode]        = useState(initial?.code        ?? "");
  const [addressLine, setAddressLine] = useState(initial?.addressLine ?? "");
  const [city,        setCity]        = useState(initial?.city        ?? "");
  const [state,       setState]       = useState(initial?.state       ?? "");
  const [pincode,     setPincode]     = useState(initial?.pincode     ?? "");
  const [phone,       setPhone]       = useState(initial?.phone       ?? "");
  const [isActive,    setIsActive]    = useState(initial?.isActive    ?? true);
  const [isDefault,   setIsDefault]   = useState(initial?.isDefault   ?? false);
  const [notes,       setNotes]       = useState(initial?.notes       ?? "");

  function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
      <div>
        <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">{label}</label>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
          style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-[520px] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            {initial?.id ? "Edit Warehouse" : "New Warehouse"}
          </p>
          <button onClick={onClose} className="text-white/30 hover:text-white/70"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Warehouse Name *" value={name} onChange={setName} placeholder="e.g. Mumbai Central" />
            <Field label="Code *" value={code} onChange={v => setCode(v.toUpperCase())} placeholder="e.g. MUM-01" />
          </div>
          <Field label="Address" value={addressLine} onChange={setAddressLine} placeholder="Street address" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" value={city} onChange={setCity} placeholder="Mumbai" />
            <Field label="State" value={state} onChange={setState} placeholder="Maharashtra" />
            <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="400001" />
          </div>
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="9xxxxxxxxx" />
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal notes..."
              className="w-full rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20 outline-none resize-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "Active", value: isActive, onChange: setIsActive },
              { label: "Default Warehouse", value: isDefault, onChange: setIsDefault },
            ].map(({ label, value, onChange }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <button type="button" onClick={() => onChange(!value)}
                  className="flex h-5 w-5 items-center justify-center rounded border-2 transition-all"
                  style={{ background: value ? "#F5C518" : "transparent", borderColor: value ? "#F5C518" : "rgba(255,255,255,0.2)" }}>
                  {value && <Check className="h-3 w-3 text-[#0D0D0D]" />}
                </button>
                <span className="text-[12px] font-semibold text-white/60">{label}</span>
              </label>
            ))}
          </div>
          {err && <p className="text-[12px] font-semibold text-[#F87171]">{err}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6 shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
          <button
            onClick={() => onSave({ name, code, addressLine: addressLine || undefined, city: city || undefined, state: state || undefined, pincode: pincode || undefined, phone: phone || undefined, isActive, isDefault, notes: notes || undefined })}
            disabled={saving || !name || !code}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#F5C518" }}>
            {saving ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <><Check className="h-4 w-4" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<WarehouseRow | null>(null);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRow | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/warehouses");
      if (res.ok) setWarehouses(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(data: Record<string, unknown>) {
    setErr(""); setSaving(true);
    try {
      const url    = editTarget ? `/api/admin/warehouses/${editTarget.id}` : "/api/admin/warehouses";
      const method = editTarget ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json   = await res.json();
      if (!res.ok) { setErr(json.error ?? "Save failed"); setSaving(false); return; }
      setShowForm(false); setEditTarget(null); load();
    } catch { setErr("Network error"); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/warehouses/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { setErr(json.error ?? "Delete failed"); setDeleting(false); return; }
      setDeleteTarget(null); load();
    } catch { setErr("Network error"); }
    finally { setDeleting(false); }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Warehouses</h1>
          <p className="text-white/40 text-[13px]">Storage locations · Stock allocation · Inventory distribution</p>
        </div>
        <button onClick={() => { setEditTarget(null); setErr(""); setShowForm(true); }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-black text-[#0D0D0D]"
          style={{ background: "#F5C518" }}>
          <Plus className="h-4 w-4" /> New Warehouse
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Warehouses", value: warehouses.length },
          { label: "Active",           value: warehouses.filter(w => w.isActive).length },
          { label: "Total SKUs",       value: warehouses.reduce((s, w) => s + w._count.stocks, 0) },
          { label: "Total Units",      value: warehouses.reduce((s, w) => s + w.totalUnits, 0).toLocaleString("en-IN") },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[11px] text-white/40 mb-1.5">{label}</p>
            <p className="font-black text-white text-[22px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Warehouse cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Warehouse className="h-12 w-12 text-white/10" />
          <p className="text-[13px] text-white/30">No warehouses yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {warehouses.map(wh => (
            <div key={wh.id} className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: `1px solid ${wh.isDefault ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.06)"}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-black text-white">{wh.name}</p>
                    {wh.isDefault && (
                      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                        style={{ background: "rgba(245,197,24,0.12)", color: "#F5C518" }}>
                        <Star className="h-2.5 w-2.5" /> Default
                      </span>
                    )}
                    {!wh.isActive && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
                        style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>Inactive</span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono font-bold text-white/30 mt-0.5">{wh.code}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditTarget(wh); setErr(""); setShowForm(true); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/08 transition-all">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  {!wh.isDefault && (
                    <button onClick={() => setDeleteTarget(wh)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-[#F87171] hover:bg-white/08 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {(wh.city || wh.state) && (
                <div className="flex items-center gap-1.5 mb-3 text-[12px] text-white/40">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[wh.addressLine, wh.city, wh.state, wh.pincode].filter(Boolean).join(", ")}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] text-white/30 mb-0.5">SKUs Tracked</p>
                  <p className="font-black text-white text-[18px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{wh._count.stocks}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] text-white/30 mb-0.5">Total Units</p>
                  <p className="font-black text-white text-[18px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{wh.totalUnits.toLocaleString("en-IN")}</p>
                </div>
              </div>

              {wh.notes && <p className="text-[11px] text-white/30 mt-3 italic">{wh.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <WarehouseForm
          initial={editTarget ?? undefined}
          onSave={save}
          onClose={() => { setShowForm(false); setEditTarget(null); setErr(""); }}
          saving={saving}
          err={err}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-[380px] rounded-2xl p-6 text-center"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <AlertTriangle className="h-10 w-10 text-[#F87171] mx-auto mb-3" />
            <p className="text-white font-black text-[16px] mb-1">Delete {deleteTarget.name}?</p>
            <p className="text-[12px] text-white/40 mb-5">This cannot be undone. The warehouse must have no stock to be deleted.</p>
            {err && <p className="text-[12px] text-[#F87171] mb-3">{err}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
              <button onClick={remove} disabled={deleting}
                className="flex-1 h-10 rounded-xl text-[13px] font-black text-white disabled:opacity-50 flex items-center justify-center"
                style={{ background: "#F87171" }}>
                {deleting ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
