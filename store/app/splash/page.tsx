/**
 * /splash — standalone route for direct testing of the splash + onboarding flow.
 * Clears the localStorage flag so the full flow always plays.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/onboarding/splash-screen";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { useState } from "react";

const STORAGE_KEY = "tryby_onboarding_v1";

type Stage = "splash" | "onboarding" | "done";

export default function SplashPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("splash");

  // Clear the flag so this route always shows the full flow
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  function handleSplashComplete() {
    setStage("onboarding");
  }

  function handleOnboardingComplete() {
    localStorage.setItem(STORAGE_KEY, "1");
    router.replace("/");
  }

  if (stage === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (stage === "onboarding") {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return null;
}
