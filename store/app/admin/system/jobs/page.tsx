"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Play, XCircle, RotateCcw, CheckCircle2, AlertTriangle, Clock, Loader2 } from "lucide-react";

interface SystemJob {
  id:          string;
  type:        string;
  name:        string;
  status:      string;
  triggeredBy: string | null;
  error:       string | null;
  attempts:    number;
  maxAttempts: number;
  startedAt:   string | null;
  completedAt: string | null;
  createdAt:   string;
}

interface JobsData {
  jobs:         SystemJob[];
  total:        number;
  page:         number;
  pages:        number;
  statusCounts: Record<string, number>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: "rgba(251,191,36,0.12)",  text: "#FBBF24" },
  RUNNING:   { bg: "rgba(96,165,250,0.12)",  text: "#60A5FA" },
  COMPLETED: { bg: "rgba(74,222,128,0.12)",  text: "#4ADE80" },
  FAILED:    { bg: "rgba(248,113,113,0.12)", text: "#F87171" },
  CANCELLED: { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.3)" },
};

function statusIcon(s: string) {
  if (s === "COMPLETED") return <CheckCircle2 className="h-3.5 w-3.5 text-[#4ADE80]" />;
  if (s === "FAILED")    return <XCircle      className="h-3.5 w-3.5 text-[#F87171]" />;
  if (s === "RUNNING")   return <Loader2      className="h-3.5 w-3.5 text-[#60A5FA] animate-spin" />;
  if (s === "PENDING")   return <Clock        className="h-3.5 w-3.5 text-[#FBBF24]" />;
  return                        <AlertTriangle className="h-3.5 w-3.5 text-white/30" />;
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)   return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  return `${Math.floor(d/3600)}h ago`;
}

const CARD_S = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

export default function JobsPage() {
  const [data,    setData]    = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [acting,  setActing]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/jobs${params}`).catch(() => null);
    if (res?.ok) setData(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function act(jobId: string, action: "retry" | "cancel" | "trigger") {
    setActing(jobId);
    await fetch("/api/admin/jobs", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ jobId, action }),
    });
    await load();
    setActing(null);
  }

  const counts = data?.statusCounts ?? {};
  const FILTERS = [
    { value: "all",       label: "All",       count: data?.total },
    { value: "PENDING",   label: "Pending",   count: counts.PENDING },
    { value: "RUNNING",   label: "Running",   count: counts.RUNNING },
    { value: "FAILED",    label: "Failed",    count: counts.FAILED },
    { value: "COMPLETED", label: "Completed", count: counts.COMPLETED },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Jobs Dashboard</h1>
          <p className="text-white/40 text-[13px]">{data?.total ?? "…"} jobs · background task log</p>
        </div>
        <button onClick={load} disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50"
          style={{ background: "#E8FF47", color: "#0D0D0D" }}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: filter === f.value ? "rgba(232,255,71,0.12)" : "rgba(255,255,255,0.05)",
              color: filter === f.value ? "#E8FF47" : "rgba(255,255,255,0.4)",
            }}>
            {f.label}{f.count !== undefined ? ` (${f.count})` : ""}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div className="rounded-2xl border overflow-hidden" style={CARD_S}>
        {!data?.jobs.length ? (
          <div className="flex flex-col items-center py-16">
            <CheckCircle2 className="h-8 w-8 text-white/20 mb-3" />
            <p className="text-white/40 text-[13px]">No jobs found{filter !== "all" ? ` with status "${filter}"` : ""}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.jobs.map(job => {
              const sc = STATUS_COLORS[job.status] ?? STATUS_COLORS.CANCELLED;
              return (
                <div key={job.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="mt-0.5 shrink-0">{statusIcon(job.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-bold text-white">{job.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.text }}>{job.status}</span>
                      <span className="font-mono text-[10px] text-white/25">{job.type}</span>
                    </div>
                    {job.error && (
                      <p className="text-[11px] text-[#F87171] font-mono mt-1 truncate">{job.error}</p>
                    )}
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {timeAgo(job.createdAt)} · attempt {job.attempts}/{job.maxAttempts}
                      {job.triggeredBy ? ` · by ${job.triggeredBy.slice(0, 8)}…` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {job.status === "FAILED" && job.attempts < job.maxAttempts && (
                      <button onClick={() => act(job.id, "retry")} disabled={acting === job.id}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                        style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                        <RotateCcw className="h-3 w-3" /> Retry
                      </button>
                    )}
                    {job.status === "PENDING" && (
                      <button onClick={() => act(job.id, "cancel")} disabled={acting === job.id}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                        style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                        <XCircle className="h-3 w-3" /> Cancel
                      </button>
                    )}
                    <button onClick={() => act(job.id, "trigger")} disabled={acting === job.id}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                      <Play className="h-3 w-3" /> Run
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
