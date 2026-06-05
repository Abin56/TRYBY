"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "./splash-screen";

export function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setShowSplash(true);
  }, []);

  function handleSplashComplete() {
    setShowSplash(false);
  }

  if (!mounted) return <>{children}</>;

  return (
    <>
      <div
        aria-hidden={showSplash}
        style={{ visibility: showSplash ? "hidden" : "visible" }}
      >
        {children}
      </div>

      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}
