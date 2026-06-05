"use client";

import { useEffect, useState } from "react";
import { FileText, CheckCircle2, Clock, ExternalLink, ShieldCheck } from "lucide-react";

type Agreement = {
  id: string; version: string; title: string; documentUrl: string;
  acceptedAt: string | null; acceptedByIp: string | null;
  isCurrentVersion: boolean; publishedAt: string;
};

export default function SupplierAgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [accepting, setAccepting]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/supplier/agreements");
    const data = await res.json();
    setAgreements(data.agreements ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function accept(agreementId: string) {
    setAccepting(agreementId);
    await fetch("/api/supplier/agreements", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ agreementId }),
    });
    setAccepting(null);
    load();
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const pendingCount = agreements.filter(a => !a.acceptedAt).length;

  return (
    <div className="p-6 lg:p-8 max-w-[760px]">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
          Agreements
        </h1>
        <p className="text-white/40 text-[13px] mt-0.5">Supplier agreement history and acceptance</p>
      </div>

      {pendingCount > 0 && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4 mb-6"
          style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.20)" }}
        >
          <Clock className="h-5 w-5 text-[#F5C518] mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-bold text-[#F5C518]">Action Required</p>
            <p className="text-[13px] text-white/50 mt-0.5">
              {pendingCount} agreement{pendingCount !== 1 ? "s" : ""} require your acceptance before you can use all features.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : agreements.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <FileText className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No agreements yet</p>
          <p className="text-[12px] text-white/25 mt-1">Agreements will appear here once shared by admin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agreements.map(a => (
            <div
              key={a.id}
              className="rounded-2xl p-5"
              style={{
                background: "#1A1A1A",
                border: `1px solid ${a.isCurrentVersion && !a.acceptedAt ? "rgba(245,197,24,0.25)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 mt-0.5"
                    style={{ background: a.acceptedAt ? "rgba(74,222,128,0.10)" : "rgba(245,197,24,0.10)" }}
                  >
                    {a.acceptedAt
                      ? <ShieldCheck className="h-5 w-5 text-[#4ADE80]" />
                      : <FileText className="h-5 w-5 text-[#F5C518]" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.50)", fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {a.version}
                      </span>
                      {a.isCurrentVersion && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(245,197,24,0.15)", color: "#F5C518" }}
                        >
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-semibold text-white/85">{a.title}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">Published {fmtDate(a.publishedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={a.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white hover:bg-white/06 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </a>
                  {!a.acceptedAt && (
                    <button
                      onClick={() => accept(a.id)}
                      disabled={accepting === a.id}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black disabled:opacity-40 hover:brightness-110 transition-all"
                      style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {accepting === a.id ? "Accepting…" : "Accept"}
                    </button>
                  )}
                </div>
              </div>

              {a.acceptedAt && (
                <div
                  className="flex items-center gap-2 mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#4ADE80]" />
                  <p className="text-[12px] text-[#4ADE80]">
                    Accepted on {fmtDate(a.acceptedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
