"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";

interface ProofEvent {
  id:           string;
  productName:  string;
  productSlug:  string;
  productImage: string | null;
  city:         string | null;
  timeAgo:      string;
}

const DISPLAY_DURATION = 4500; // ms each popup shows
const BETWEEN_DELAY    = 8000; // ms between popups
const STORAGE_KEY      = "tryby_proof_dismissed";
const DISMISS_HOURS    = 24;

export function SocialProofTicker() {
  const [events,  setEvents]  = useState<ProofEvent[]>([]);
  const [current, setCurrent] = useState<ProofEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const indexRef  = useRef(0);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check dismissal
  useEffect(() => {
    try {
      const ts = localStorage.getItem(STORAGE_KEY);
      if (ts && Date.now() - Number(ts) < DISMISS_HOURS * 3600 * 1000) {
        setDismissed(true);
      }
    } catch {}
  }, []);

  // Fetch events
  useEffect(() => {
    if (dismissed) return;
    fetch("/api/social-proof")
      .then(r => r.json())
      .then((data: ProofEvent[]) => setEvents(data))
      .catch(() => {});
  }, [dismissed]);

  const showNext = useCallback(() => {
    if (events.length === 0) return;
    const event = events[indexRef.current % events.length];
    indexRef.current++;
    setCurrent(event);

    timerRef.current = setTimeout(() => {
      setCurrent(null);
      timerRef.current = setTimeout(showNext, BETWEEN_DELAY);
    }, DISPLAY_DURATION);
  }, [events]);

  // Start cycle after initial delay
  useEffect(() => {
    if (dismissed || events.length === 0) return;
    const init = setTimeout(showNext, 6000);
    return () => {
      clearTimeout(init);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [events, dismissed, showNext]);

  const dismiss = () => {
    setCurrent(null);
    setDismissed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
  };

  if (dismissed || !current) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0, x: -20, y: 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="fixed bottom-6 left-4 z-[300] max-w-[300px]"
      >
        <div
          className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid #F0F0F0" }}
        >
          {/* Product image or icon */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden"
            style={{ background: "#F5F5F5" }}
          >
            {current.productImage ? (
              <img src={current.productImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag className="h-5 w-5 text-[#9CA3AF]" />
            )}
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#0D0D0D] leading-snug line-clamp-1">
              Someone in {current.city ?? "India"}
            </p>
            <p className="text-[11px] text-[#555] line-clamp-1 leading-snug">
              just bought <span className="font-bold text-[#0D0D0D]">{current.productName}</span>
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{current.timeAgo}</p>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[#C0C0C0] hover:text-[#555] transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Progress bar */}
        <motion.div
          className="h-0.5 mt-1.5 rounded-full mx-2"
          style={{ background: "#F5C518", originX: 0 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: DISPLAY_DURATION / 1000, ease: "linear" }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
