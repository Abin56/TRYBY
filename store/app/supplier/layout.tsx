import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SupplierSidebar } from "./_components/sidebar";
import { PanelThemeProvider } from "@/components/providers/panel-theme-provider";

export const metadata: Metadata = {
  title: { default: "Supplier — TRYBY", template: "%s | TRYBY Supplier" },
  robots: { index: false, follow: false },
};

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/supplier/login");
  }
  if (session.user.role !== "SUPPLIER") {
    redirect("/");
  }

  return (
    <PanelThemeProvider storageKey="tryby-supplier-theme">
      <div
        className="min-h-screen flex"
        style={{ background: "var(--pt-bg, #0F0F0F)" }}
      >
        <SupplierSidebar />
        <main className="flex-1 min-w-0 overflow-auto pt-[52px] md:pt-0">
          {children}
        </main>
      </div>
    </PanelThemeProvider>
  );
}
