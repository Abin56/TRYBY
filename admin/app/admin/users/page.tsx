"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Search, RefreshCw, Shield, ShieldOff, Key,
  MoreVertical, Check, X, Loader2, Clock, Activity,
  Eye, EyeOff, ChevronDown, AlertTriangle, Lock,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminRole = "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "CONTENT_MANAGER" | "ORDER_MANAGER" | "SUPPORT_AGENT";

interface AdminProfile {
  id:           string;
  adminRole:    AdminRole;
  permissions:  string[];
  isDisabled:   boolean;
  lastLoginAt?: string;
  mustResetPwd: boolean;
  createdAt:    string;
}

interface TeamMember {
  id:           string;
  name?:        string;
  email?:       string;
  image?:       string;
  isActive:     boolean;
  adminProfile: AdminProfile | null;
  createdAt:    string;
}

interface AuditLog {
  id:           string;
  action:       string;
  resourceType?: string;
  resourceName?: string;
  createdAt:    string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META: Record<AdminRole, { label: string; bg: string; text: string; description: string }> = {
  SUPER_ADMIN:     { label: "Super Admin",     bg: "#FEF3C7", text: "#D97706", description: "Full platform access. Can manage team and all settings." },
  ADMIN:           { label: "Admin",           bg: "#EDE9FE", text: "#7C3AED", description: "Broad access. Cannot manage team or store settings." },
  PRODUCT_MANAGER: { label: "Product Manager", bg: "#DBEAFE", text: "#2563EB", description: "Products, inventory, and media." },
  CONTENT_MANAGER: { label: "Content Manager", bg: "#D1FAE5", text: "#059669", description: "CMS, SEO, media. Read-only products." },
  ORDER_MANAGER:   { label: "Order Manager",   bg: "#FCE7F3", text: "#BE185D", description: "Orders, returns, customer read access." },
  SUPPORT_AGENT:   { label: "Support Agent",   bg: "#F3F4F6", text: "#6B7280", description: "Read-only orders and returns. Customer support." },
};

const ROLE_OPTS = Object.entries(ROLE_META).map(([value, meta]) => ({ value: value as AdminRole, ...meta }));

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminRole }) {
  const meta = ROLE_META[role];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.text }}
    >
      {role === "SUPER_ADMIN" && <Shield className="h-3 w-3" />}
      {meta.label}
    </span>
  );
}

// ─── Create / Edit form ───────────────────────────────────────────────────────

function MemberForm({
  member,
  onClose,
  onSaved,
}: {
  member?: TeamMember;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!member;

  const [form, setForm] = useState({
    name:        member?.name        ?? "",
    email:       member?.email       ?? "",
    adminRole:   (member?.adminProfile?.adminRole ?? "CONTENT_MANAGER") as AdminRole,
    password:    "",
    newPassword: "",
    mustResetPwd: true,
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const url    = isEdit ? `${STORE_API}/api/admin/team/${member!.id}` : `${STORE_API}/api/admin/team`;
      const method = isEdit ? "PUT" : "POST";
      const body   = isEdit
        ? { name: form.name, adminRole: form.adminRole, newPassword: form.newPassword || undefined, mustResetPwd: form.mustResetPwd }
        : { name: form.name, email: form.email, adminRole: form.adminRole, password: form.password };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.formErrors?.[0] ?? d.error ?? "Save failed");
      }

      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all";
  const Label    = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold text-[#374151] mb-1.5">{children}</label>
  );

  return (
    <div className="px-6 py-5 space-y-5">
      {error && (
        <div className="rounded-lg border border-[#FCA5A5] bg-[#FFF1F2] px-3 py-2 text-xs text-[#DC2626]">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Full Name</Label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className={inputCls} placeholder="Jane Smith" />
        </div>
        {!isEdit && (
          <div>
            <Label>Email <span className="text-[#EF4444]">*</span></Label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className={inputCls} placeholder="jane@tryby.in" />
          </div>
        )}
      </div>

      {/* Role selector */}
      <div>
        <Label>Role</Label>
        <div className="space-y-2">
          {ROLE_OPTS.map((r) => (
            <label key={r.value}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                form.adminRole === r.value ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#E5E7EB] hover:border-[#D1D5DB]"
              )}>
              <input type="radio" name="role" value={r.value} checked={form.adminRole === r.value}
                onChange={() => setForm(p => ({ ...p, adminRole: r.value }))}
                className="mt-0.5 accent-[#2563EB]" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-[#111827]">{r.label}</span>
                  <RoleBadge role={r.value} />
                </div>
                <p className="text-xs text-[#6B7280]">{r.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Password */}
      <div>
        <Label>{isEdit ? "New Password (leave blank to keep current)" : "Temporary Password *"}</Label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={isEdit ? form.newPassword : form.password}
            onChange={e => setForm(p => isEdit ? { ...p, newPassword: e.target.value } : { ...p, password: e.target.value })}
            className={cn(inputCls, "pr-9")}
            placeholder={isEdit ? "Leave blank to keep unchanged" : "Min 8 characters"}
          />
          <button type="button" onClick={() => setShowPwd(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]">
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.mustResetPwd} onChange={e => setForm(p => ({ ...p, mustResetPwd: e.target.checked }))}
            className="accent-[#2563EB]" />
          <span className="text-sm text-[#374151]">Require password change on next login</span>
        </label>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
        <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
          Cancel
        </button>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-60">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Admin"}
        </button>
      </div>
    </div>
  );
}

// ─── Member detail drawer ─────────────────────────────────────────────────────

function MemberDetail({
  member,
  onClose,
  onUpdated,
}: {
  member: TeamMember;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [activity,  setActivity]  = useState<AuditLog[]>([]);
  const [actLoading, setActLoading] = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [toggling,  setToggling]  = useState(false);

  useEffect(() => {
    if (!member.adminProfile?.id) return;
    fetch(`${STORE_API}/api/admin/audit?adminId=${member.adminProfile.id}&page=1`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setActivity(d.logs ?? []); setActLoading(false); })
      .catch(() => setActLoading(false));
  }, [member.adminProfile?.id]);

  const toggleDisable = async () => {
    setToggling(true);
    try {
      const isDisabled = !member.adminProfile?.isDisabled;
      await fetch(`${STORE_API}/api/admin/team/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDisabled }),
      });
      onUpdated();
      onClose();
    } finally {
      setToggling(false);
    }
  };

  const resetPassword = async () => {
    await fetch(`${STORE_API}/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ mustResetPwd: true }),
    });
    alert("Password reset flag set. User will be prompted on next login.");
  };

  const profile = member.adminProfile;

  const ACTION_LABELS: Record<string, string> = {
    PRODUCT_CREATED: "Created product",   PRODUCT_UPDATED: "Updated product",   PRODUCT_DELETED: "Deleted product",
    ORDER_STATUS_CHANGED: "Changed order status",
    RETURN_APPROVED: "Approved return",   RETURN_REJECTED: "Rejected return",   RETURN_REFUNDED: "Processed refund",
    CONTENT_PUBLISHED: "Published content", CONTENT_UPDATED: "Updated content",
    ADMIN_CREATED: "Created admin",       ADMIN_UPDATED: "Updated admin",       ADMIN_DISABLED: "Disabled admin",
    LOGIN: "Logged in",                   SETTINGS_UPDATED: "Updated settings",
  };

  return (
    <div className="divide-y divide-[#F3F4F6]">
      {/* Identity */}
      <div className="px-6 py-5 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#111827] text-xl font-black text-white">
          {member.name?.[0]?.toUpperCase() ?? member.email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-base font-bold text-[#111827]">{member.name ?? "—"}</p>
          <p className="text-sm text-[#6B7280]">{member.email}</p>
          {profile && <div className="mt-1"><RoleBadge role={profile.adminRole} /></div>}
        </div>
      </div>

      {/* Status + meta */}
      <div className="px-6 py-4 space-y-2">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-[#9CA3AF] mb-0.5">Status</p>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              profile?.isDisabled ? "bg-[#FFF1F2] text-[#DC2626]" : "bg-[#DCFCE7] text-[#16A34A]")}>
              {profile?.isDisabled ? "Disabled" : "Active"}
            </span>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] mb-0.5">Last login</p>
            <p className="text-sm text-[#374151]">{profile?.lastLoginAt ? formatRelative(profile.lastLoginAt) : "Never"}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] mb-0.5">Joined</p>
            <p className="text-sm text-[#374151]">{formatDate(member.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] mb-0.5">Password</p>
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold",
              profile?.mustResetPwd ? "text-[#D97706]" : "text-[#6B7280]")}>
              {profile?.mustResetPwd && <AlertTriangle className="h-3 w-3" />}
              {profile?.mustResetPwd ? "Reset required" : "Set"}
            </span>
          </div>
        </div>

        {profile && profile.permissions.length > 0 && (
          <div>
            <p className="text-xs text-[#9CA3AF] mb-1.5">Extra permissions</p>
            <div className="flex flex-wrap gap-1">
              {profile.permissions.map(p => (
                <span key={p} className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-mono text-[#374151]">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex flex-wrap gap-2">
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 h-8 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
          Edit Role
        </button>
        <button onClick={resetPassword}
          className="flex items-center gap-1.5 h-8 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
          <Key className="h-3.5 w-3.5" /> Force Password Reset
        </button>
        {profile?.adminRole !== "SUPER_ADMIN" && (
          <button onClick={toggleDisable} disabled={toggling}
            className={cn(
              "flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-60",
              profile?.isDisabled
                ? "border border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7]"
                : "border border-[#FECDD3] bg-[#FFF1F2] text-[#DC2626] hover:bg-[#FFE4E6]"
            )}>
            {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : profile?.isDisabled ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
            {profile?.isDisabled ? "Enable Account" : "Disable Account"}
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="px-6 py-4 bg-[#F9FAFB]">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Edit Member</p>
          <MemberForm member={member} onClose={() => setEditing(false)} onSaved={() => { onUpdated(); onClose(); }} />
        </div>
      )}

      {/* Activity log */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Recent Activity
        </p>
        {actLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 rounded bg-[#F3F4F6] animate-pulse" />)}</div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No activity recorded yet</p>
        ) : (
          <div className="space-y-2">
            {activity.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D1D5DB] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#374151]">
                    <span className="font-semibold">{ACTION_LABELS[log.action] ?? log.action}</span>
                    {log.resourceName && <span className="text-[#6B7280]"> — {log.resourceName}</span>}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">{formatRelative(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [members,  setMembers]  = useState<TeamMember[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [roleFilter, setRole]   = useState<AdminRole | "">("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1" });
      if (search) params.set("q", search);
      if (roleFilter) params.set("role", roleFilter);
      const res  = await fetch(`${STORE_API}/api/admin/team?${params}`, { credentials: "include" });
      const data = await res.json();
      setMembers(data.members ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  // Summary counts by role
  const roleCounts = members.reduce<Record<string, number>>((acc, m) => {
    const r = m.adminProfile?.adminRole ?? "unknown";
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Admin Users</h1>
          <p className="text-sm text-[#9CA3AF]">{total} admin{total !== 1 ? "s" : ""} · role-based access control</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
          <UserPlus className="h-3.5 w-3.5" /> Add Admin
        </button>
      </div>

      {/* Role summary chips */}
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTS.map(r => (
          <button key={r.value} onClick={() => setRole(roleFilter === r.value ? "" : r.value)}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all border",
              roleFilter === r.value ? "border-[#111827] bg-[#111827] text-white" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#374151] hover:text-[#111827]")}>
            {r.label}
            {roleCounts[r.value] != null && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", roleFilter === r.value ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#374151]")}>
                {roleCounts[r.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-all" />
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Permission matrix info banner */}
      <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3 flex items-start gap-2.5">
        <Lock className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1D4ED8]">
          <span className="font-semibold">Permission Matrix: </span>
          Super Admin → full access · Admin → broad (no team/settings) · Product Manager → products + media · Content Manager → CMS + SEO · Order Manager → orders + returns · Support Agent → read-only orders
        </div>
      </div>

      {/* Member table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-5 rounded bg-[#F3F4F6] animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#9CA3AF]">
                    No admins found. Create the first one.
                  </td>
                </tr>
              ) : (
                members.map((m, i) => (
                  <motion.tr key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-bold text-white">
                          {m.name?.[0]?.toUpperCase() ?? m.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] truncate">{m.name ?? "—"}</p>
                          <p className="text-xs text-[#9CA3AF] truncate">{m.email}</p>
                        </div>
                        {m.adminProfile?.mustResetPwd && (
                          <span title="Password reset required">
                            <Key className="h-3.5 w-3.5 text-[#D97706]" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.adminProfile ? <RoleBadge role={m.adminProfile.adminRole} /> : <span className="text-xs text-[#9CA3AF]">No profile</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        m.adminProfile?.isDisabled ? "bg-[#FFF1F2] text-[#DC2626]" : "bg-[#DCFCE7] text-[#16A34A]")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", m.adminProfile?.isDisabled ? "bg-[#DC2626]" : "bg-[#16A34A]")} />
                        {m.adminProfile?.isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {m.adminProfile?.lastLoginAt ? formatRelative(m.adminProfile.lastLoginAt) : "Never"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(m)}
                        className="flex items-center gap-1 h-7 px-3 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                        Manage
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create drawer */}
      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Add Admin"
        subtitle="Create a new admin account with role-based access"
        footer={null}
      >
        <MemberForm onClose={() => setCreating(false)} onSaved={load} />
      </Drawer>

      {/* Detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? selected?.email ?? "Admin"}
        subtitle={selected?.adminProfile ? ROLE_META[selected.adminProfile.adminRole].label : ""}
        footer={null}
      >
        {selected && (
          <MemberDetail
            member={selected}
            onClose={() => setSelected(null)}
            onUpdated={load}
          />
        )}
      </Drawer>
    </div>
  );
}
