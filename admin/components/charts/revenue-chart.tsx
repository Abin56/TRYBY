"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { dailyRevenue } from "@/data/mock";
import { cn } from "@/lib/cn";

const PERIODS = [
  { label: "7D",  days: 7  },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const dateLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-[#6B7280] mb-2">{dateLabel}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-[#6B7280]">{p.name}:</span>
          <span className="text-xs font-bold text-[#111827]">
            {p.name === "Revenue" ? `₹${p.value.toLocaleString("en-IN")}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart() {
  const [period, setPeriod] = useState(30);
  const [view, setView]     = useState<"area" | "bar">("area");

  const data = dailyRevenue.slice(-period).map(d => ({
    date: d.date,
    Revenue: d.revenue,
    Orders:  d.orders,
  }));

  const totalRevenue = data.reduce((s, d) => s + d.Revenue, 0);
  const totalOrders  = data.reduce((s, d) => s + d.Orders, 0);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-[#6B7280]">Revenue Overview</p>
          <p className="text-2xl font-extrabold text-[#111827] mt-1">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{totalOrders.toLocaleString("en-IN")} orders in {period} days</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {(["area", "bar"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn("px-3 py-1.5 text-xs font-medium capitalize transition-colors", view === v ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827]")}>
                {v}
              </button>
            ))}
          </div>
          {/* Period toggle */}
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setPeriod(p.days)} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", period === p.days ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827]")}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        {view === "area" ? (
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}
              tickFormatter={d => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; }}
              interval={period === 7 ? 0 : period === 14 ? 1 : 4}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E5E7EB" }} />
            <Area type="monotone" dataKey="Revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: "#2563EB" }} />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={period === 7 ? 20 : 10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}
              tickFormatter={d => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; }}
              interval={period === 7 ? 0 : period === 14 ? 1 : 4}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
            <Bar dataKey="Revenue" fill="#2563EB" radius={[4,4,0,0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
