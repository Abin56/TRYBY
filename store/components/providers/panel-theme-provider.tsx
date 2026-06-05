"use client";

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";

export type PanelTheme = "dark" | "light";

interface PanelThemeCtx {
  theme:    PanelTheme;
  isDark:   boolean;
  isLight:  boolean;
  toggle:   () => void;
  setTheme: (t: PanelTheme) => void;
  /** Map a dark-mode color to its light-mode equivalent */
  c: (dark: string, light: string) => string;
}

const Ctx = createContext<PanelThemeCtx>({
  theme:   "dark",
  isDark:  true,
  isLight: false,
  toggle:   () => {},
  setTheme: () => {},
  c: (dark) => dark,
});

const STORAGE_KEY = "tryby-panel-theme";

export function PanelThemeProvider({
  children,
  storageKey = STORAGE_KEY,
}: {
  children:    ReactNode;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<PanelTheme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) as PanelTheme | null;
      if (saved === "light" || saved === "dark") setThemeState(saved);
    } catch {}
  }, [storageKey]);

  const setTheme = useCallback((t: PanelTheme) => {
    setThemeState(t);
    try { localStorage.setItem(storageKey, t); } catch {}
  }, [storageKey]);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // c() = pick color based on current theme
  const c = useCallback((dark: string, light: string) => {
    return theme === "dark" ? dark : light;
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, isDark: theme === "dark", isLight: theme === "light", toggle, setTheme, c }}>
      <div
        data-theme={theme}
        className="contents"
        style={{ colorScheme: theme }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function usePanelTheme() {
  return useContext(Ctx);
}

// ── Shared color maps ─────────────────────────────────────────────────────────
// Use these in components via: const { t } = useThemeColors()
// t.bg = background, t.surface = card bg, etc.

export function useThemeColors() {
  const { isDark } = usePanelTheme();

  return {
    // Backgrounds
    bg:           isDark ? "#0D0D0D"               : "#F4F5F7",
    bgAlt:        isDark ? "#0F0F0F"               : "#ECEEF2",
    surface:      isDark ? "#1A1A1A"               : "#FFFFFF",
    surface2:     isDark ? "rgba(255,255,255,0.03)": "#F8F9FB",
    // Borders
    border:       isDark ? "rgba(255,255,255,0.07)": "rgba(0,0,0,0.08)",
    border2:      isDark ? "rgba(255,255,255,0.10)": "rgba(0,0,0,0.12)",
    borderSubtle: isDark ? "rgba(255,255,255,0.04)": "rgba(0,0,0,0.06)",
    // Text
    text:         isDark ? "#FFFFFF"               : "#0D0D0D",
    text2:        isDark ? "rgba(255,255,255,0.70)": "rgba(0,0,0,0.70)",
    text3:        isDark ? "rgba(255,255,255,0.40)": "rgba(0,0,0,0.45)",
    text4:        isDark ? "rgba(255,255,255,0.25)": "rgba(0,0,0,0.28)",
    text5:        isDark ? "rgba(255,255,255,0.15)": "rgba(0,0,0,0.18)",
    // Hover
    hover:        isDark ? "rgba(255,255,255,0.06)": "rgba(0,0,0,0.05)",
    // Accent
    accent:       "#F5C518",
    accentFg:     "#0D0D0D",
    // Semantic
    green:        isDark ? "#4ADE80" : "#16A34A",
    red:          isDark ? "#F87171" : "#DC2626",
    blue:         isDark ? "#60A5FA" : "#2563EB",
    purple:       isDark ? "#A78BFA" : "#7C3AED",
    yellow:       "#F5C518",
    // Input
    input:        isDark ? "rgba(255,255,255,0.05)": "#FFFFFF",
    inputBorder:  isDark ? "rgba(255,255,255,0.10)": "rgba(0,0,0,0.15)",
    placeholder:  isDark ? "rgba(255,255,255,0.20)": "rgba(0,0,0,0.30)",
  };
}
