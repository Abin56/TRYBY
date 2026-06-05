"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function PLPPagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase = "flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-semibold transition-all duration-150";

  return (
    <div className="flex items-center justify-center gap-1.5 pt-10 pb-4">
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={cn(btnBase, "border border-[#E0E0E0]", page === 1 ? "opacity-30 cursor-not-allowed" : "hover:border-[#0D0D0D] hover:bg-[#F5F5F5]")}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-[#9CA3AF] text-[13px]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              btnBase,
              p === page
                ? "bg-[#0D0D0D] text-white border border-[#0D0D0D]"
                : "border border-[#E0E0E0] text-[#555] hover:border-[#0D0D0D] hover:text-[#0D0D0D]"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={cn(btnBase, "border border-[#E0E0E0]", page === totalPages ? "opacity-30 cursor-not-allowed" : "hover:border-[#0D0D0D] hover:bg-[#F5F5F5]")}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
