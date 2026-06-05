"use client";

import { useEffect, useState, useCallback } from "react";
import { Percent, Plus, Trash2, Globe, User, Layers, CheckCircle2 } from "lucide-react";

type Rule = {
  id: string; scope: string; rate: number; label: string | null;
  isActive: boolean; validFrom: string; validUntil: string | null;
  supplierId: string | null; categoryId: string | null;
  supplierName: string | null; categoryName: string | null;
  createdAt: string;
};

type Supplier = { id: string; companyName: string };
type Category = { id: string; name: string };

const SCOPE_COLOR: Record<string, string> = {
  GLOBAL:   "#F5C518",
  SUPPLIER: "#60A5FA",
  CATEGORY: "#A78BFA",
};
const SCOPE_ICON: Record<string, React.ElementType> = {
  GLOBAL:   Globe,
  SUPPLIER: User,
  CATEGORY: Layers,
};

export default function CommissionRulesPage() {
  const [rules, setRules]         = useState<Rule[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const [form, setForm] = useState({
    scope:      "GLOBAL",
    rate:       "15",
    supplierId: "",
    categoryId: "",
    label:      "",
    validUntil: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [rulesRes, suppRes, catRes] = await Promise.all([
      fetch("/api/admin/suppliers/commission-rules"),
      fetch("/api/admin/suppliers?page=1&limit=100"),
      fetch("/api/admin/categories"),
    ]);
    const [rulesData, suppData, catData] = await Promise.all([
      rulesRes.json(), suppRes.json(), catRes.json(),
    ]);
    setRules(rulesData.rules ?? []);
    setSuppliers(suppData.suppliers ?? []);
    setCategories(catData.categories ?? catData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setSaving(true);
    const rate = parseFloat(form.rate) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) { setSaving(false); return; }

    await fetch("/api/admin/suppliers/commission-rules", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        scope:      form.scope,
        rate,
        supplierId: form.scope === "SUPPLIER" ? form.supplierId || undefined : undefined,
        categoryId: form.scope === "CATEGORY" ? form.categoryId || undefined : undefined,
        label:      form.label || undefined,
        validUntil: form.validUntil || undefined,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ scope: "GLOBAL", rate: "15", supplierId: "", categoryId: "", label: "", validUntil: "" });
    load();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch("/api/admin/suppliers/commission-rules", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    setDeleting(null);
    load();
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Group rules by scope
  const global   = rules.filter(r => r.scope === "GLOBAL");
  const supplier = rules.filter(r => r.scope === "SUPPLIER");
  const category = rules.filter(r => r.scope === "CATEGORY");

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Commission Rules
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            Layered rules: Category → Supplier → Global. Most specific wins.
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[13px] transition-all hover:brightness-110"
          style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          <Plus className="h-4 w-4" /> New Rule
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(245,197,24,0.20)" }}>
          <h2 className="text-white font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>
            New Commission Rule
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Scope</label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <option value="GLOBAL">Global (all suppliers)</option>
                <option value="SUPPLIER">Supplier-specific</option>
                <option value="CATEGORY">Category-specific</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Rate (%)</label>
              <div className="flex items-center gap-2">
                <input value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                  className="flex-1 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                  placeholder="15.0"
                />
                <Percent className="h-4 w-4 text-white/30 shrink-0" />
              </div>
            </div>
            {form.scope === "SUPPLIER" && (
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Supplier</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                </select>
              </div>
            )}
            {form.scope === "CATEGORY" && (
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Category</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Label (optional)</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                placeholder="e.g. Q4 promotion rate"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Expires (optional)</label>
              <input value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                type="date"
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06 transition-all">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-black disabled:opacity-50 hover:brightness-110 transition-all"
              style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {saving ? "Creating…" : "Create Rule"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { title: "Global Rules",   scope: "GLOBAL",   list: global,   desc: "Applied to all suppliers unless overridden" },
            { title: "Supplier Rules", scope: "SUPPLIER", list: supplier, desc: "Override rate for a specific supplier" },
            { title: "Category Rules", scope: "CATEGORY", list: category, desc: "Override rate for a product category" },
          ].map(group => {
            const Icon  = SCOPE_ICON[group.scope];
            const color = SCOPE_COLOR[group.scope];
            return (
              <div key={group.scope}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4" style={{ color }} />
                  <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>
                    {group.title}
                  </h2>
                  <span className="text-[11px] text-white/30 ml-1">{group.desc}</span>
                </div>
                {group.list.length === 0 ? (
                  <div className="rounded-xl px-5 py-4 text-[12px] text-white/30"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    No {group.title.toLowerCase()} — click "New Rule" above
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {group.list.map(rule => (
                        <div key={rule.id} className="flex items-center gap-4 px-5 py-3.5">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                            style={{ background: `${color}18` }}
                          >
                            <Percent className="h-3.5 w-3.5" style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-white text-[17px]"
                                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {(Number(rule.rate) * 100).toFixed(1)}%
                              </span>
                              {rule.label && (
                                <span className="text-[11px] text-white/40">{rule.label}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-white/30">
                              {rule.supplierName && <span>Supplier: {rule.supplierName}</span>}
                              {rule.categoryName && <span>Category: {rule.categoryName}</span>}
                              <span>Since {fmtDate(rule.validFrom)}</span>
                              {rule.validUntil && <span>· Expires {fmtDate(rule.validUntil)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="flex items-center gap-1 text-[11px] text-[#4ADE80] font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                            <button
                              onClick={() => handleDelete(rule.id)}
                              disabled={deleting === rule.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-[#F87171] hover:bg-white/06 transition-all disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
