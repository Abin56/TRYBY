"use client";

/**
 * TEST-ONLY panel that lists the mock SERVICEABLE_AREAS so a tester can see, at
 * a glance, which pincodes are deliverable while the dummy serviceability
 * harness is active. Renders nothing unless mock mode is enabled
 * (NEXT_PUBLIC_SHIPPING_MOCK_MODE=true), so it never shows in real production.
 */

import { MapPin, Truck, FlaskConical } from "lucide-react";
import {
  SERVICEABLE_AREAS,
  isMockServiceabilityEnabled,
} from "@/lib/shipping/serviceable-pincodes";

export function ServiceableAreasTest() {
  if (!isMockServiceabilityEnabled()) return null;

  return (
    <div className="rounded-[20px] border border-dashed border-[#F5C518] bg-[#FFFBEB] overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <FlaskConical className="h-4 w-4 text-[#D4A800]" />
        <h2 className="text-[14px] font-bold text-[#0D0D0D]">Test Mode · Available Delivery Areas</h2>
        <span className="ml-auto rounded-full bg-[#F5C518]/20 px-2 py-0.5 text-[10px] font-bold text-[#D4A800]">MOCK</span>
      </div>
      <p className="px-5 pb-3 text-[11px] text-[#9A8500]">
        Live couriers are bypassed. Only these pincodes are serviceable right now.
      </p>

      <div className="divide-y divide-[#F2E6B8]">
        {SERVICEABLE_AREAS.map(area => (
          <div key={area.pincode} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <MapPin className="h-3.5 w-3.5 text-[#888] shrink-0" />
              <span className="text-[13px] font-semibold text-[#0D0D0D]">{area.city}</span>
              <span className="text-[12px] text-[#888]">{area.state}</span>
            </div>
            <span className="font-mono text-[13px] font-bold text-[#0D0D0D]">{area.pincode}</span>
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[#059669] shrink-0" />
              <span className="text-[12px] text-[#555]">{area.couriers.join(" · ")}</span>
            </div>
            <span className="ml-auto rounded-full bg-white border border-[#EFE3B0] px-2.5 py-0.5 text-[11px] font-semibold text-[#7A6A00]">
              ETA {area.etaLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
