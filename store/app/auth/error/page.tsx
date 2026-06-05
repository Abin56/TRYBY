"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "This email is already registered with a different sign-in method. Please use the original method.",
  OAuthSignin: "Could not sign in with Google. Please try again.",
  OAuthCallback: "Authentication failed. Please try again.",
  SessionRequired: "Please sign in to continue.",
  Default: "An authentication error occurred. Please try again.",
};

function AuthError() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";
  const message = MESSAGES[error] ?? MESSAGES.Default;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F8F8F8" }}>
      <div className="w-full max-w-[380px] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-5" style={{ background: "rgba(248,113,113,0.1)" }}>
          <AlertTriangle className="h-8 w-8 text-[#F87171]" />
        </div>
        <h1 className="text-[22px] font-black text-[#0D0D0D] mb-2">Sign in error</h1>
        <p className="text-[14px] text-[#888] mb-6 leading-relaxed">{message}</p>
        <Link href="/auth/login" className="inline-flex h-12 items-center justify-center px-8 rounded-2xl font-black text-[14px] text-[#0D0D0D]" style={{ background: "#F5C518" }}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return <Suspense><AuthError /></Suspense>;
}
