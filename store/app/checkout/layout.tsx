import type { Metadata } from "next";

// Auth guard is handled entirely by proxy.ts at the edge.
// Removing the server-side auth() call here prevents RSC navigation failures
// where the layout's redirect() breaks the RSC stream during client navigation.
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
