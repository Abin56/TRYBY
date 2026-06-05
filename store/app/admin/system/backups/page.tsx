"use client";

import { useState, useEffect } from "react";
import { Database, RefreshCw, AlertTriangle, CheckCircle, Clock, FileText, Terminal } from "lucide-react";

interface Migration {
  name: string;
  appliedAt: string;
  steps: number;
}

interface SystemData {
  status: string;
  checkedAt: string;
  services: {
    database: { ok: boolean; latencyMs: number; error?: string };
  };
  counts: {
    users: { total: number };
    products: { total: number; variants: number };
    orders: { total: number };
    content: { media: number };
  };
  migrations: Migration[];
}

const CMD_BLOCK = "font-mono text-[11px] px-3 py-2 rounded-xl text-white/60 select-all";
const CARD = "rounded-2xl p-5 border";
const CARD_STYLE = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ background: ok ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: ok ? "#4ADE80" : "#F87171" }}>
      {ok ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {ok ? "Healthy" : "Error"}
    </span>
  );
}

export default function BackupsPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const latestMigration = data?.migrations?.[0];

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            DB Status & Recovery
          </h1>
          {data && (
            <p className="text-white/40 text-[13px]">
              Last checked: {new Date(data.checkedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button onClick={refresh} disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
          style={{ background: "#E8FF47", color: "#0D0D0D" }}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* DB Status */}
      <div className={`${CARD} mb-4`} style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
              <Database className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold text-[14px]">Neon PostgreSQL</p>
              <p className="text-white/40 text-[11px]">ap-southeast-1 · Pooled connection</p>
            </div>
          </div>
          {data ? <StatusBadge ok={data.services.database.ok} /> : <div className="h-6 w-20 rounded-full bg-white/05 animate-pulse" />}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Latency",  value: data ? `${data.services.database.latencyMs}ms` : "—" },
            { label: "Users",    value: data?.counts.users.total.toLocaleString() ?? "—" },
            { label: "Products", value: data?.counts.products.total.toLocaleString() ?? "—" },
            { label: "Orders",   value: data?.counts.orders.total.toLocaleString() ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#1A1A1A" }}>
              <p className="text-white font-black text-[18px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
              <p className="text-white/35 text-[11px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {data?.services.database.error && (
          <div className="mt-3 rounded-xl px-3 py-2 border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}>
            <p className="text-[#F87171] text-[12px] font-mono">{data.services.database.error}</p>
          </div>
        )}
      </div>

      {/* Latest migration */}
      <div className={`${CARD} mb-4`} style={CARD_STYLE}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,197,24,0.12)" }}>
            <Clock className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-white font-bold text-[14px]">Migration History</p>
        </div>
        {data?.migrations?.length ? (
          <div className="space-y-2">
            {data.migrations.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "#1A1A1A" }}>
                <div className={`h-2 w-2 rounded-full shrink-0 ${i === 0 ? "bg-[#4ADE80]" : "bg-white/20"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white/80 truncate font-mono">{m.name}</p>
                  <p className="text-[11px] text-white/30">{new Date(m.appliedAt).toLocaleString()} · {m.steps} step{m.steps !== 1 ? "s" : ""}</p>
                </div>
                {i === 0 && <span className="text-[10px] font-bold text-[#4ADE80] shrink-0">LATEST</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-[13px]">No migrations found</p>
        )}
      </div>

      {/* Backup instructions */}
      <div className={`${CARD} mb-4`} style={CARD_STYLE}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
            <FileText className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-white font-bold text-[14px]">Backup Procedures</p>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[12px] font-bold text-white/50 uppercase tracking-wider mb-2">Neon Automated Backups</p>
            <p className="text-[13px] text-white/60 leading-relaxed">
              Neon automatically creates daily backups retained for 7 days (free tier) or 30 days (pro).
              Access them at: <code className="text-[#E8FF47] text-[11px]">console.neon.tech → Project → Backups</code>
            </p>
          </div>
          <div>
            <p className="text-[12px] font-bold text-white/50 uppercase tracking-wider mb-2">Manual Snapshot</p>
            <div className={CMD_BLOCK} style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.06)" }}>
              pg_dump &quot;$DATABASE_URL&quot; --no-owner --no-acl &gt; backup_$(date +%Y%m%d_%H%M%S).sql
            </div>
          </div>
          <div>
            <p className="text-[12px] font-bold text-white/50 uppercase tracking-wider mb-2">Restore from Snapshot</p>
            <div className={CMD_BLOCK} style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.06)" }}>
              psql &quot;$DATABASE_URL&quot; &lt; backup_YYYYMMDD_HHMMSS.sql
            </div>
          </div>
        </div>
      </div>

      {/* Recovery CLI */}
      <div className={`${CARD}`} style={CARD_STYLE}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
            <Terminal className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-white font-bold text-[14px]">Recovery Commands</p>
        </div>
        <div className="space-y-3">
          {[
            { label: "Re-run migrations (safe)", cmd: "npm run db:migrate" },
            { label: "Push schema without migration", cmd: "npm run db:push" },
            { label: "Seed reference data", cmd: "npm run db:seed" },
            { label: "Reset DB (⚠ destructive)", cmd: "npm run db:reset" },
            { label: "Open Prisma Studio", cmd: "npm run db:studio" },
          ].map(({ label, cmd }) => (
            <div key={cmd}>
              <p className="text-[11px] font-semibold text-white/35 mb-1">{label}</p>
              <div className={CMD_BLOCK} style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.06)" }}>
                {cmd}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/25 mt-4">
          ⚠ Run <code className="text-white/40">npm run db:reset</code> only in development — it wipes all data.
        </p>
      </div>

      {latestMigration && (
        <div className="mt-4 rounded-xl px-4 py-3 border" style={{ background: "rgba(74,222,128,0.04)", borderColor: "rgba(74,222,128,0.12)" }}>
          <p className="text-[12px] font-semibold text-[#4ADE80]">
            ✓ Latest migration: <span className="font-mono">{latestMigration.name}</span> applied {new Date(latestMigration.appliedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
