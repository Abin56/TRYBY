"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function SupplierError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { section: "supplier" } });
    console.error("[Supplier Error]", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen p-8" style={{ background: "#0F0F0F" }}>
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-white font-black mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}>
          Supplier Portal Error
        </h1>
        <p className="text-white/40 text-[13px] mb-2 leading-relaxed">
          Something went wrong. Please try again or contact your account manager.
        </p>

        {error.digest && (
          <p className="font-mono text-[11px] text-white/20 mb-6">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          <a
            href="/supplier/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white/60 hover:text-white transition-all border"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <Home className="h-4 w-4" /> Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
