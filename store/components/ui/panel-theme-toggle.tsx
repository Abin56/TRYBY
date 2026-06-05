"use client";

import { Sun, Moon } from "lucide-react";
import { usePanelTheme } from "@/components/providers/panel-theme-provider";
import { cn } from "@/lib/cn";

// ── Inline pill (for sidebar header — always visible) ────────────────────────
// Shows a Sun|Moon pill that swaps the panel theme.
// collapsed=true → icon only, no label
export function PanelThemeToggle({
  collapsed = false,
  className = "",
}: {
  collapsed?: boolean;
  className?: string;
}) {
  const { theme, toggle } = usePanelTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn("group relative flex items-center transition-all duration-200 shrink-0", className)}
    >
      {collapsed ? (
        // Icon-only pill when sidebar is collapsed
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200"
          style={{
            background: isDark ? "rgba(245,197,24,0.12)" : "rgba(0,0,0,0.07)",
            color:      isDark ? "#F5C518" : "#555",
          }}
        >
          {isDark
            ? <Sun  className="h-3.5 w-3.5" />
            : <Moon className="h-3.5 w-3.5" />}
        </span>
      ) : (
        // Full pill — two-segment toggle
        <span
          className="flex items-center rounded-lg overflow-hidden"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
            border:     isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.10)",
            height: "28px",
          }}
        >
          {/* Dark segment */}
          <span
            className="flex items-center justify-center gap-1.5 px-3 transition-all duration-200"
            style={{
              height:     "100%",
              background: isDark ? "#F5C518" : "transparent",
              color:      isDark ? "#0D0D0D" : "rgba(255,255,255,0.30)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize:   "11px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            <Moon className="h-3 w-3" />
            {!collapsed && "Dark"}
          </span>

          {/* Divider */}
          <span
            className="w-px self-stretch"
            style={{ background: isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}
          />

          {/* Light segment */}
          <span
            className="flex items-center justify-center gap-1.5 px-3 transition-all duration-200"
            style={{
              height:     "100%",
              background: !isDark ? "#F5C518" : "transparent",
              color:      !isDark ? "#0D0D0D" : "rgba(255,255,255,0.30)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize:   "11px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            <Sun className="h-3 w-3" />
            {!collapsed && "Light"}
          </span>
        </span>
      )}
    </button>
  );
}
