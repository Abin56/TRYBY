import type { Metadata } from "next";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <h1 className="text-white font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
        Customers
      </h1>
      <p className="text-white/40 text-[13px] mb-10">Customer management coming in next phase.</p>
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ background: "rgba(245,197,24,0.10)" }}>
          <Users className="h-6 w-6 text-[#F5C518]" />
        </div>
        <p className="text-white font-bold text-[15px] mb-2">Customer Management</p>
        <p className="text-white/35 text-[13px] text-center max-w-xs">
          View customer profiles, order history, and lifetime value. Coming in Phase 3.
        </p>
      </div>
    </div>
  );
}
