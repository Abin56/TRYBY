"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Truck, Zap, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ServiceabilityResult {
  serviceable:   boolean;
  codAvailable:  boolean;
  estimatedDays: number | null;
  quotes:        Array<{ provider: string; rate: number; estimatedDays: number; isFastest?: boolean; isCheapest?: boolean; isBest?: boolean }>;
  reason?:       string;
}

interface Props {
  /** Optional: pass subtotal so COD availability is calculated accurately */
  orderValue?: number;
  /** Optional: variant weight in grams */
  weightGrams?: number;
  /** Callback when serviceability changes — useful for checkout to block/unblock button */
  onResult?: (pincode: string, result: ServiceabilityResult | null) => void;
  /** Pre-fill pincode (e.g. from a saved address) */
  initialPincode?: string;
  /** Compact mode — used inside cart summary */
  compact?: boolean;
  /** Storage key for persisting pincode across sessions */
  storageKey?: string;
}

const SESSION_KEY = "tryby_delivery_pincode";

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function PincodeChecker({
  orderValue = 499,
  weightGrams = 500,
  onResult,
  initialPincode,
  compact = false,
  storageKey = SESSION_KEY,
}: Props) {
  const [pincode, setPincode] = useState(() => {
    if (initialPincode) return initialPincode;
    if (typeof window !== "undefined") return sessionStorage.getItem(storageKey) ?? "";
    return "";
  });
  const [result,  setResult]  = useState<ServiceabilityResult | null>(null);
  const [status,  setStatus]  = useState<"idle" | "loading" | "done" | "error">("idle");
  const [checked, setChecked] = useState("");   // last-checked pincode
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedPin = useDebounce(pincode, 600);

  const check = useCallback(async (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return;
    if (pin === checked) return;
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/shipping/serviceability?pincode=${pin}&weight=${weightGrams}&value=${orderValue}`
      );
      if (!res.ok) throw new Error("failed");
      const data: ServiceabilityResult = await res.json();
      setResult(data);
      setChecked(pin);
      setStatus("done");
      sessionStorage.setItem(storageKey, pin);
      onResult?.(pin, data);
    } catch {
      setStatus("error");
      setResult(null);
      onResult?.(pin, null);
    }
  }, [checked, weightGrams, orderValue, onResult, storageKey]);

  // Auto-check when pincode reaches 6 digits (debounced)
  useEffect(() => {
    if (/^\d{6}$/.test(debouncedPin)) check(debouncedPin);
  }, [debouncedPin, check]);

  // Auto-check on mount if we have a stored pincode
  useEffect(() => {
    if (/^\d{6}$/.test(pincode) && !checked) check(pincode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setPincode("");
    setResult(null);
    setStatus("idle");
    setChecked("");
    sessionStorage.removeItem(storageKey);
    onResult?.("", null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const isServiceable = result?.serviceable === true;
  const isBlocked     = result?.serviceable === false;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF] pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={e => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setResult(null); setStatus("idle"); }}
              onKeyDown={e => { if (e.key === "Enter" && /^\d{6}$/.test(pincode)) check(pincode); }}
              placeholder="Enter pincode"
              className={cn(
                "w-full h-9 rounded-xl border pl-9 pr-3 text-[13px] text-[#0D0D0D] placeholder:text-[#C0C0C0] outline-none transition-all bg-white",
                isBlocked     ? "border-[#DC2626] focus:border-[#DC2626]" :
                isServiceable ? "border-[#059669] focus:border-[#059669]" :
                "border-[#E0E0E0] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]"
              )}
            />
          </div>
          <button
            onClick={() => /^\d{6}$/.test(pincode) ? check(pincode) : inputRef.current?.focus()}
            disabled={status === "loading"}
            className="h-9 px-3 rounded-xl border border-[#E0E0E0] bg-white text-[12px] font-semibold text-[#555] hover:bg-[#F5F5F5] transition-colors disabled:opacity-40"
          >
            {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Check"}
          </button>
          {checked && (
            <button onClick={reset} className="h-9 w-9 flex items-center justify-center rounded-xl border border-[#E0E0E0] text-[#9CA3AF] hover:text-[#DC2626] hover:border-[#DC2626] transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <CompactResult result={result} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#E8E8E8]">
          <Truck className="h-4 w-4 text-[#555]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#0D0D0D]">Check Delivery</p>
          <p className="text-[11px] text-[#9CA3AF]">Enter your pincode to check availability</p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={e => {
              setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setResult(null);
              setStatus("idle");
            }}
            onKeyDown={e => { if (e.key === "Enter" && /^\d{6}$/.test(pincode)) check(pincode); }}
            placeholder="6-digit pincode"
            className={cn(
              "w-full h-11 rounded-xl border pl-10 pr-4 text-[14px] text-[#0D0D0D] placeholder:text-[#C0C0C0] outline-none transition-all bg-white font-medium",
              isBlocked     ? "border-[#DC2626] focus:border-[#DC2626]" :
              isServiceable ? "border-[#059669] focus:border-[#059669]" :
              "border-[#E0E0E0] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]"
            )}
          />
        </div>
        {checked ? (
          <button
            onClick={reset}
            className="h-11 px-4 rounded-xl border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#9CA3AF] hover:text-[#DC2626] hover:border-[#DC2626] transition-all flex items-center gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> Change
          </button>
        ) : (
          <button
            onClick={() => /^\d{6}$/.test(pincode) ? check(pincode) : inputRef.current?.focus()}
            disabled={status === "loading" || pincode.length < 6}
            className="h-11 px-5 rounded-xl font-bold text-[13px] text-white disabled:opacity-40 transition-all flex items-center gap-2"
            style={{ background: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "CHECK"}
          </button>
        )}
      </div>

      {/* Result */}
      {status === "loading" && (
        <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking availability…
        </div>
      )}

      {status === "error" && (
        <p className="text-[12px] font-semibold text-[#DC2626]">Could not check serviceability. Please try again.</p>
      )}

      {status === "done" && result && (
        <ServiceabilityPanel result={result} pincode={checked} />
      )}
    </div>
  );
}

// ── Compact result (cart page) ─────────────────────────────────────────────────

function CompactResult({ result }: { result: ServiceabilityResult | null }) {
  if (!result) return null;
  if (!result.serviceable) {
    return (
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#DC2626]">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        {result.reason ?? "Delivery not available to this location"}
      </div>
    );
  }
  const days = result.estimatedDays;
  return (
    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#059669]">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      Delivery available
      {days !== null && <span className="text-[#9CA3AF] font-normal">· Est. {days}–{days + 1} days</span>}
    </div>
  );
}

// ── Full result panel (product page) ──────────────────────────────────────────

function ServiceabilityPanel({ result, pincode }: { result: ServiceabilityResult; pincode: string }) {
  if (!result.serviceable) {
    return (
      <div className="rounded-xl border border-[#FECACA] bg-[#FFF5F5] px-4 py-3 space-y-1">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
          <p className="text-[13px] font-bold text-[#DC2626]">Delivery unavailable</p>
        </div>
        <p className="text-[12px] text-[#9CA3AF] pl-6">
          {result.reason ?? "Sorry, delivery is currently unavailable to this location."}
        </p>
      </div>
    );
  }

  const days = result.estimatedDays;
  const best = result.quotes.find(q => q.isBest) ?? result.quotes[0];
  const hasExpress = result.quotes.some(q => q.estimatedDays <= 2);

  return (
    <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 space-y-2.5">
      {/* Available headline */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
        <p className="text-[13px] font-bold text-[#059669]">
          Delivery available to {pincode}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-1.5 pl-6">
        {/* Standard */}
        <div className="flex items-center gap-1.5 text-[12px]">
          <Truck className="h-3.5 w-3.5 text-[#059669] shrink-0" />
          <span className="font-semibold text-[#0D0D0D]">Standard Delivery</span>
          {days !== null ? (
            <span className="text-[#9CA3AF]">· Estimated {days}–{days + 2} days</span>
          ) : (
            <span className="text-[#9CA3AF]">· 3–5 business days</span>
          )}
        </div>

        {/* Express — only if a courier offers ≤2 days */}
        {hasExpress && (
          <div className="flex items-center gap-1.5 text-[12px]">
            <Zap className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" />
            <span className="font-semibold text-[#0D0D0D]">Express Delivery</span>
            <span className="text-[#9CA3AF]">· 1–2 business days</span>
          </div>
        )}

        {/* COD note */}
        {result.codAvailable && (
          <p className="text-[11px] text-[#059669] font-medium">✓ Cash on Delivery available</p>
        )}
        {!result.codAvailable && (
          <p className="text-[11px] text-[#9CA3AF]">Cash on Delivery not available for this pincode</p>
        )}

        {/* Best rate hint */}
        {best && (
          <p className="text-[11px] text-[#9CA3AF]">
            via {best.provider}{best.rate > 0 ? ` · ₹${best.rate} shipping` : " · FREE shipping"}
          </p>
        )}
      </div>
    </div>
  );
}
