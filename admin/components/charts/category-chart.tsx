"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { categoryPerformance } from "@/data/mock";
import { formatCompact } from "@/lib/format";

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-bold text-[#111827] mb-1">{d.category}</p>
      <p className="text-xs text-[#6B7280]">Revenue: <span className="font-bold text-[#111827]">{formatCompact(d.revenue)}</span></p>
      <p className="text-xs text-[#6B7280]">Orders: <span className="font-bold text-[#111827]">{d.orders.toLocaleString("en-IN")}</span></p>
    </div>
  );
}

export function CategoryChart() {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 h-full">
      <div className="mb-4">
        <p className="text-sm font-medium text-[#6B7280]">Category Performance</p>
        <p className="text-lg font-extrabold text-[#111827] mt-1">Revenue Split</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={categoryPerformance} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="revenue" nameKey="category" strokeWidth={0} paddingAngle={2}>
            {categoryPerformance.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {categoryPerformance.slice(0, 6).map((c) => (
          <div key={c.category} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-[11px] text-[#6B7280] truncate">{c.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
