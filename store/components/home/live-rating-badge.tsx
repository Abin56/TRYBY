"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";

interface Stats {
  total:     number;
  avgRating: string;
}

export function LiveRatingBadge() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/reviews/featured")
      .then(r => r.json())
      .then(d => { if (d.stats?.total > 0) setStats(d.stats); })
      .catch(() => {});
  }, []);

  if (!stats) {
    // Fallback to static display while loading or if no real data yet
    return null;
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-6 py-3 shadow-sm">
      <div className="flex gap-0.5" aria-label={`${stats.avgRating} out of 5 stars`}>
        {[1,2,3,4,5].map(s => (
          <Star key={s} className="h-5 w-5 text-[#FFB800]" fill="#FFB800" />
        ))}
      </div>
      <span className="text-2xl font-black text-[#111827]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {stats.avgRating}
      </span>
      <span className="text-sm text-[#6B7280]">
        from {stats.total.toLocaleString("en-IN")}+ verified reviews
      </span>
      <Link href="/community" className="text-[12px] font-bold text-[#F5C518] hover:underline ml-2">
        View all →
      </Link>
    </div>
  );
}
