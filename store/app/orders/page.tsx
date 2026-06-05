import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = { title: "My Orders — TRYBY Sports" };

function EmptyOrdersIllustration() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="rgba(245,197,24,0.08)" stroke="rgba(245,197,24,0.20)" strokeWidth="2" />
      {/* Jersey hanger */}
      <path d="M50 22 Q50 18 54 18 Q58 18 58 22 L50 22Z" stroke="#F5C518" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M50 22 L38 34 L28 34" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 22 L62 34 L72 34" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" />
      {/* Jersey body outline */}
      <path
        d="M34 36 L28 34 L28 50 L36 50 L36 72 L64 72 L64 50 L72 50 L72 34 L66 36 Q60 30 50 30 Q40 30 34 36Z"
        stroke="#555"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function OrdersPage() {
  const session = await auth();
  // Authenticated customers go straight to the real orders page.
  if (session?.user?.role === "CUSTOMER") redirect("/account/orders");
  // Unauthenticated visitors get the login page with a callbackUrl.
  if (!session?.user) redirect("/auth/login?callbackUrl=/account/orders");
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <h1
          className="font-black text-[#0D0D0D] mb-8"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 3vw, 32px)", letterSpacing: "-0.01em" }}
        >
          My Orders
        </h1>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center gap-5 py-16 text-center rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA]">
          <EmptyOrdersIllustration />
          <div>
            <h2
              className="font-black text-[#0D0D0D] mb-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}
            >
              No Matches Played Yet
            </h2>
            <p className="text-[14px] text-[#888] max-w-xs mx-auto leading-relaxed">
              You haven&apos;t placed any orders. Start shopping to see your order history here.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full font-bold text-[14px] text-white bg-[#0D0D0D] hover:opacity-85 transition-opacity"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
          >
            Shop Jerseys
          </Link>
        </div>

        {/* Track order link */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-[#888]">
            Already ordered?{" "}
            <Link href="/orders/track" className="font-semibold text-[#F5C518] hover:underline">
              Track your order →
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
