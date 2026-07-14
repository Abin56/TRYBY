"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Consistent error banner for when a store API call fails. Render it near the
 * top of a page's content: `{error && <FetchError message={error} onRetry={load} loading={loading} />}`.
 */
export function FetchError({
  message,
  onRetry,
  loading = false,
}: {
  message: string;
  onRetry?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#B91C1C]">Couldn&rsquo;t load this page</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 rounded-lg border border-[#FCA5A5] bg-white px-3 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Retry
        </button>
      )}
    </div>
  );
}
