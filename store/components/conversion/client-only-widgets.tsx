"use client";

import dynamic from "next/dynamic";

const ExitIntentPopup   = dynamic(() => import("./exit-intent-popup").then(m => ({ default: m.ExitIntentPopup })),   { ssr: false });
const SocialProofTicker = dynamic(() => import("./social-proof-ticker").then(m => ({ default: m.SocialProofTicker })), { ssr: false });

export function ClientOnlyWidgets() {
  return (
    <>
      <ExitIntentPopup couponCode="TRYBY10" couponLabel="10% OFF" discountText="your first order" />
      <SocialProofTicker />
    </>
  );
}
