"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee, ShoppingCart, Users, TrendingUp, Package,
  AlertTriangle, Star, ChevronRight, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { StatsCard } from "@/components/ui/stats-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { OrderStatusBadge, ProductStatusBadge } from "@/components/ui/badge";
import { kpis, orders, products } from "@/data/mock";
import { formatPrice, formatRelative } from "@/lib/format";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  const recentOrders   = orders.slice(0, 5);
  const lowStock       = products.filter(p => p.inventory > 0 && p.inventory <= p.lowStockThreshold);
  const outOfStock     = products.filter(p => p.inventory === 0);
  const topProducts    = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  const pendingReviews = 3;

  const CARDS = [
    { label: "Revenue Today",     value: `₹${kpis.revenueToday.value.toLocaleString("en-IN")}`,    current: kpis.revenueToday.value,  prev: kpis.revenueToday.prev,  icon: <IndianRupee className="h-4 w-4 text-[#2563EB]" />, iconBg: "#EFF6FF" },
    { label: "Revenue This Month",value: `₹${(kpis.revenueMonth.value/100000).toFixed(1)}L`,        current: kpis.revenueMonth.value,  prev: kpis.revenueMonth.prev,  icon: <TrendingUp   className="h-4 w-4 text-[#7C3AED]" />, iconBg: "#F5F3FF" },
    { label: "Orders Today",      value: `${kpis.ordersToday.value}`,                               current: kpis.ordersToday.value,   prev: kpis.ordersToday.prev,   icon: <ShoppingCart className="h-4 w-4 text-[#0891B2]" />, iconBg: "#ECFEFF" },
    { label: "Avg Order Value",   value: `₹${kpis.avgOrderValue.value.toLocaleString("en-IN")}`,    current: kpis.avgOrderValue.value, prev: kpis.avgOrderValue.prev, icon: <IndianRupee  className="h-4 w-4 text-[#059669]" />, iconBg: "#F0FDF4" },
    { label: "Conversion Rate",   value: `${kpis.conversionRate.value}%`,                           current: kpis.conversionRate.value,prev: kpis.conversionRate.prev,icon: <TrendingUp   className="h-4 w-4 text-[#D97706]" />, iconBg: "#FFFBEB", suffix: "" },
    { label: "Total Customers",   value: `${kpis.totalCustomers.value}`,                            current: kpis.totalCustomers.value,prev: kpis.totalCustomers.prev,icon: <Users        className="h-4 w-4 text-[#DC2626]" />, iconBg: "#FFF1F2" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Dashboard</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          All systems operational
        </div>
      </div>

      {/* Alerts */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3">
          {outOfStock.length > 0 && (
            <Link href="/admin/products?status=out_of_stock" className="flex items-center gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FFE4E6] transition-colors">
              <AlertTriangle className="h-3.5 w-3.5" />
              {outOfStock.length} product{outOfStock.length > 1 ? "s" : ""} out of stock
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
          {lowStock.length > 0 && (
            <Link href="/admin/products" className="flex items-center gap-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs font-semibold text-[#D97706] hover:bg-[#FEF9C3] transition-colors">
              <AlertTriangle className="h-3.5 w-3.5" />
              {lowStock.length} product{lowStock.length > 1 ? "s" : ""} running low
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link href="/admin/reviews" className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-[#DBEAFE] transition-colors">
              <Star className="h-3.5 w-3.5" />
              {pendingReviews} reviews awaiting moderation
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </motion.div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {CARDS.map((card, i) => (
          <StatsCard key={card.label} {...card} index={i} loading={loading} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-[1fr_320px] gap-4">
        {loading ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <div className="skeleton h-5 w-40 mb-2" />
            <div className="skeleton h-7 w-32 mb-4" />
            <div className="skeleton h-60 w-full" />
          </div>
        ) : <RevenueChart />}
        {loading ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <div className="skeleton h-5 w-32 mb-4" />
            <div className="skeleton h-48 w-full rounded-full mx-auto" />
          </div>
        ) : <CategoryChart />}
      </div>

      {/* Bottom tables row */}
      <div className="grid xl:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
            <h2 className="text-sm font-bold text-[#111827]">Recent Orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders`}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold text-[#374151]">
                      {order.customer.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{order.customer.name}</p>
                      <p className="text-xs text-[#9CA3AF] font-mono">{order.orderNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#111827]">{formatPrice(order.total)}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{formatRelative(order.createdAt)}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
            <h2 className="text-sm font-bold text-[#111827]">Top Products</h2>
            <Link href="/admin/products" className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-[#F9FAFB]">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors">
                  <span className="text-xs font-bold text-[#9CA3AF] w-4 shrink-0">#{i+1}</span>
                  <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-[#F3F4F6]">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{product.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{product.salesCount.toLocaleString("en-IN")} sold · {product.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#111827]">{formatPrice(product.price)}</p>
                    <ProductStatusBadge status={product.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
