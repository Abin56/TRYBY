"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Search, Shield, ShieldOff, RefreshCw,
  Key, Loader2, MoreVertical, CheckCircle2, XCircle,
  Lock, Unlock, Trash2, Edit2, Eye, UserX, LogOut,
  ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS, PERMISSION_GROUPS, ROLE_PERMISSIONS } from "@/lib/rbac";
import { AdminRole } from "@prisma/client";

// ── Types ───────────────────────────────────────────────────────────────────

interface AdminMember {
  id:        string;
  name:      string | null;
  email:     string | null;
  image:     string | null;
  isActive:  boolean;
  createdAt: string;
  adminProfile: {
    id:           string;
    adminRole:    AdminRole;
    permissions:  string[];
    isDisabled:   boolean;
    lastLoginAt:  string | null;
    mustResetPwd: boolean;
  } | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

function RoleBadge({ role }: { role: AdminRole }) {
  const c = ROLE_COLORS[role];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: c.bg, color: c.text }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);
  return `${m}m ago`;
}

// ── Permission Editor ────────────────────────────────────────────────────────

function PermissionEditor({
  role, extras, onChange,
}: {
  role:     AdminRole;
  extras:   string[];
  onChange: (p: string[]) => void;
}) {
  const defaults = ROLE_PERMISSIONS[role] ?? [];

  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.permissions.map(perm => {
              const isDefault = defaults.includes(perm as never);
              const isExtra   = extras.includes(perm);
              const active    = isDefault || isExtra;
              return (
                <button
                  key={perm}
                  disabled={isDefault}
                  onClick={() => {
                    if (isDefault) return;
                    if (isExtra) onChange(extras.filter(p => p !== perm));
                    else         onChange([...extras, perm]);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all"
                  style={{
                    background:   active  ? "rgba(232,255,71,0.12)" : "rgba(255,255,255,0.04)",
                    color:        active  ? "#E8FF47" : "rgba(255,255,255,0.3)",
                    border:       `1px solid ${active ? "rgba(232,255,71,0.3)" : "rgba(255,255,255,0.08)"}`,
                    cursor:       isDefault ? "default" : "pointer",
                    opacity:      isDefault ? 0.6 : 1,
                  }}
                  title={isDefault ? "Granted by role" : isExtra ? "Extra grant — click to revoke" : "Click to grant"}
                >
                  {isDefault ? "✓ " : isExtra ? "+ " : ""}{perm.replace(":", ": ")}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Create Admin Modal ───────────────────────────────────────────────────────

function CreateAdminModal({
  onClose, onCreated,
}: {
  onClose:   () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", adminRole: "ORDER_MANAGER" as AdminRole, permissions: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [showPerms, setShowPerms] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed");
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border"
        style={{ background: "#111", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <h2 className="text-white font-black text-[18px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Create Admin Account
            </h2>
            <p className="text-white/40 text-[12px] mt-0.5">New team member with role-based access</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Full Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full h-10 rounded-xl px-3 text-[13px] text-white outline-none focus:ring-1"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", "--tw-ring-color": "#E8FF47" } as React.CSSProperties}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Email</label>
              <input
                required type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full h-10 rounded-xl px-3 text-[13px] text-white outline-none focus:ring-1"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", "--tw-ring-color": "#E8FF47" } as React.CSSProperties}
                placeholder="jane@tryby.in"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Temporary Password</label>
              <input
                required minLength={8}
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full h-10 rounded-xl px-3 text-[13px] text-white outline-none focus:ring-1"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", "--tw-ring-color": "#E8FF47" } as React.CSSProperties}
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Role</label>
              <select
                value={form.adminRole}
                onChange={e => setForm(f => ({ ...f, adminRole: e.target.value as AdminRole, permissions: [] }))}
                className="w-full h-10 rounded-xl px-3 text-[13px] text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {(Object.keys(ROLE_LABELS) as AdminRole[])
                  .filter(r => r !== "SUPER_ADMIN")
                  .map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Extra permissions toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowPerms(v => !v)}
              className="flex items-center gap-2 text-[12px] font-bold text-white/50 hover:text-white/80 transition-colors"
            >
              {showPerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Extra permissions (optional — beyond role defaults)
            </button>
            {showPerms && (
              <div className="mt-3 p-4 rounded-xl" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
                <PermissionEditor
                  role={form.adminRole}
                  extras={form.permissions}
                  onChange={p => setForm(f => ({ ...f, permissions: p }))}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="h-10 px-5 rounded-xl text-[13px] font-bold text-white/50 hover:text-white/80 border transition-all"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="h-10 px-5 rounded-xl text-[13px] font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "#E8FF47", color: "#0D0D0D" }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Admin Drawer ────────────────────────────────────────────────────────

function EditAdminDrawer({
  member, onClose, onUpdated,
}: {
  member:    AdminMember;
  onClose:   () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    name:         member.name ?? "",
    adminRole:    member.adminProfile?.adminRole ?? ("ORDER_MANAGER" as AdminRole),
    permissions:  member.adminProfile?.permissions ?? [],
    newPassword:  "",
    mustResetPwd: member.adminProfile?.mustResetPwd ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [showPerms, setShowPerms] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:         form.name,
          adminRole:    form.adminRole,
          permissions:  form.permissions,
          mustResetPwd: form.mustResetPwd,
          ...(form.newPassword ? { newPassword: form.newPassword } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg h-full overflow-y-auto border-l"
        style={{ background: "#111", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
          style={{ background: "#111", borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <h2 className="text-white font-black text-[18px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Edit Admin
            </h2>
            <p className="text-white/40 text-[12px]">{member.email}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full h-10 rounded-xl px-3 text-[13px] text-white outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Role</label>
            <select
              value={form.adminRole}
              onChange={e => setForm(f => ({ ...f, adminRole: e.target.value as AdminRole, permissions: [] }))}
              className="w-full h-10 rounded-xl px-3 text-[13px] text-white outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {(Object.keys(ROLE_LABELS) as AdminRole[])
                .filter(r => r !== "SUPER_ADMIN")
                .map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowPerms(v => !v)}
              className="flex items-center gap-2 text-[12px] font-bold text-white/50 hover:text-white/80 transition-colors"
            >
              {showPerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Extra permissions
            </button>
            {showPerms && (
              <div className="mt-3 p-4 rounded-xl" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
                <PermissionEditor
                  role={form.adminRole}
                  extras={form.permissions}
                  onChange={p => setForm(f => ({ ...f, permissions: p }))}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
              Reset Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              className="w-full h-10 rounded-xl px-3 text-[13px] text-white outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="New password (min 8 chars)"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.mustResetPwd}
              onChange={e => setForm(f => ({ ...f, mustResetPwd: e.target.checked }))}
              className="h-4 w-4 rounded"
              style={{ accentColor: "#E8FF47" }}
            />
            <span className="text-[13px] text-white/70">Force password reset on next login</span>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13px]"
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({
  member, onEdit, onAction, acting,
}: {
  member:   AdminMember;
  onEdit:   (m: AdminMember) => void;
  onAction: (id: string, payload: Record<string, unknown>) => Promise<void>;
  acting:   string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ap      = member.adminProfile;
  const disabled = ap?.isDisabled ?? !member.isActive;
  const busy    = acting === member.id;

  return (
    <div className={`${CARD} relative`} style={{ ...CD, opacity: disabled ? 0.65 : 1 }}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {member.image ? (
          <img src={member.image} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold text-[15px]"
            style={{ background: "#1E1E1E", color: "#E8FF47" }}>
            {(member.name ?? member.email ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-[14px] truncate">{member.name ?? "—"}</p>
            {ap && <RoleBadge role={ap.adminRole} />}
            {disabled && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                <ShieldOff className="h-2.5 w-2.5" /> Suspended
              </span>
            )}
            {ap?.mustResetPwd && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                <Key className="h-2.5 w-2.5" /> Must reset pwd
              </span>
            )}
          </div>
          <p className="text-white/40 text-[12px] truncate mt-0.5">{member.email}</p>
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border py-1.5 shadow-2xl"
              style={{ background: "#1A1A1A", borderColor: "rgba(255,255,255,0.1)" }}>
              {[
                { label: "Edit",           icon: Edit2,    key: "edit"          },
                { label: "View Activity",  icon: Eye,      key: "view"          },
                { label: "Force Logout",   icon: LogOut,   key: "force_logout"  },
                { label: "Reset Password", icon: Key,      key: "reset_pwd"     },
                disabled
                  ? { label: "Activate",   icon: Unlock,   key: "activate"      }
                  : { label: "Suspend",    icon: Lock,     key: "suspend"       },
                { label: "Delete",         icon: Trash2,   key: "delete", danger: true },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={async () => {
                    setMenuOpen(false);
                    if (item.key === "edit") { onEdit(member); return; }
                    if (item.key === "view") { window.location.href = `/admin/audit?adminId=${ap?.id}`; return; }
                    if (item.key === "force_logout") {
                      await onAction(member.id, { action: "force_logout_user", userId: member.id });
                    }
                    if (item.key === "reset_pwd") {
                      await onAction(member.id, { mustResetPwd: true });
                    }
                    if (item.key === "suspend") {
                      await onAction(member.id, { isDisabled: true });
                    }
                    if (item.key === "activate") {
                      await onAction(member.id, { isDisabled: false });
                    }
                    if (item.key === "delete") {
                      if (!confirm(`Delete admin account for ${member.email}? This cannot be undone.`)) return;
                      await onAction(member.id, { _delete: true });
                    }
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-[13px] hover:bg-white/5 transition-colors"
                  style={{ color: (item as { danger?: boolean }).danger ? "#F87171" : "rgba(255,255,255,0.7)" }}>
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-[11px] text-white/30"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span>Last login: {ap?.lastLoginAt ? timeAgo(ap.lastLoginAt) : "Never"}</span>
        <span>Joined: {timeAgo(member.createdAt)}</span>
        {ap?.permissions && ap.permissions.length > 0 && (
          <span className="ml-auto" style={{ color: "#E8FF47" }}>+{ap.permissions.length} extra perms</span>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [members, setMembers]     = useState<AdminMember[]>([]);
  const [total,   setTotal]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [q,       setQ]           = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page,    setPage]        = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminMember | null>(null);
  const [acting,  setActing]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (q)          params.set("q",    q);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/team?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, q, roleFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id: string, payload: Record<string, unknown>) {
    setActing(id);
    try {
      if (payload._delete) {
        await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      } else if (payload.action === "force_logout_user") {
        await fetch("/api/admin/sessions", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ action: "force_logout_user", userId: id }),
        });
      } else {
        await fetch(`/api/admin/team/${id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
      }
      await load();
    } finally {
      setActing(null);
    }
  }

  const pages    = Math.max(1, Math.ceil(total / 20));
  const allRoles = Object.keys(ROLE_LABELS) as AdminRole[];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Admin Management
          </h1>
          <p className="text-white/40 text-[13px]">
            {total} team {total === 1 ? "member" : "members"} · Role-based access control
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold transition-all"
          style={{ background: "#E8FF47", color: "#0D0D0D" }}>
          <Plus className="h-4 w-4" /> Create Admin
        </button>
      </div>

      {/* Role summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {allRoles.slice(0, 5).map(r => {
          const count = members.filter(m => m.adminProfile?.adminRole === r).length;
          const c = ROLE_COLORS[r];
          return (
            <button
              key={r}
              onClick={() => setRoleFilter(roleFilter === r ? "" : r)}
              className="rounded-xl p-3 text-left border transition-all"
              style={{
                background:  roleFilter === r ? c.bg : "#111",
                borderColor: roleFilter === r ? c.text : "rgba(255,255,255,0.06)",
              }}>
              <p className="text-[11px] font-bold truncate" style={{ color: c.text }}>{ROLE_LABELS[r]}</p>
              <p className="font-black text-[22px] leading-tight mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: roleFilter === r ? c.text : "#fff" }}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13px] text-white outline-none"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-xl text-[13px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">All Roles</option>
          {allRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <button
          onClick={() => load()}
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-[15px] font-semibold">No admins found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              onEdit={setEditTarget}
              onAction={handleAction}
              acting={acting}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="h-9 px-4 rounded-xl text-[13px] font-bold border disabled:opacity-40 transition-all hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            Previous
          </button>
          <span className="text-white/40 text-[13px]">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="h-9 px-4 rounded-xl text-[13px] font-bold border disabled:opacity-40 transition-all hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreate  && <CreateAdminModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {editTarget  && <EditAdminDrawer member={editTarget} onClose={() => setEditTarget(null)} onUpdated={load} />}
    </div>
  );
}
