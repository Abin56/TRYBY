"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export type ToastKind = "error" | "success";

interface SizeToastProps {
  show:    boolean;
  kind:    ToastKind;
  message: string;
}

export function SizeToast({ show, kind, message }: SizeToastProps) {
  const isError = kind === "error";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-[88px] left-1/2 z-[300] -translate-x-1/2 pointer-events-none"
          style={{ width: "max-content", maxWidth: "calc(100vw - 32px)" }}
        >
          <div
            className="flex items-center gap-2.5 rounded-full px-5 py-3"
            style={{
              background: "#0D0D0D",
              border: isError
                ? "1px solid rgba(245,197,24,0.40)"
                : "1px solid rgba(5,150,105,0.45)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14)",
            }}
          >
            {isError ? (
              <AlertTriangle
                className="h-4 w-4 shrink-0"
                style={{ color: "#F5C518" }}
                strokeWidth={2.2}
              />
            ) : (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-[#059669]"
                strokeWidth={2.2}
              />
            )}
            <span
              className="text-white font-semibold leading-none whitespace-nowrap"
              style={{ fontSize: "13.5px" }}
            >
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
