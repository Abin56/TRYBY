"use client";

import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUIStore } from "@/store/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-1 flex-col min-w-0"
      >
        <Topbar />
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-6 max-w-[1440px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
