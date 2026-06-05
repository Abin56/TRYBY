import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "./_components/sidebar";
import { PanelThemeProvider } from "@/components/providers/panel-theme-provider";

export const metadata: Metadata = {
  title: { default: "Admin — TRYBY", template: "%s | TRYBY Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <PanelThemeProvider>
      <div
        className="min-h-screen flex"
        style={{ background: "var(--pt-bg, #0F0F0F)" }}
      >
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </PanelThemeProvider>
  );
}
