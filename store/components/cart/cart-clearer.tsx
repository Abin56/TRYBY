"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";

/**
 * Mounts invisibly in the root layout.
 * Clears the Zustand/localStorage cart whenever the signed-in user changes
 * (logout, or a different user logs in on the same browser).
 * This prevents cross-user cart leakage.
 */
export function CartClearer() {
  const { data: session, status } = useSession();
  const clearCart = useCartStore((s) => s.clearCart);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;

    const currentUserId = session?.user?.id ?? null;

    // On first mount, record who's logged in without clearing.
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = currentUserId;
      return;
    }

    // User changed.
    if (prevUserIdRef.current !== currentUserId) {
      // Only clear when LEAVING an authenticated session (logout) or switching
      // to a different account. Do NOT clear on guest(null) → user login: a guest
      // who builds a cart and then signs in at checkout must keep their cart,
      // otherwise the guest → login → checkout flow loses all items.
      if (prevUserIdRef.current !== null) {
        clearCart();
      }
      prevUserIdRef.current = currentUserId;
    }
  }, [session?.user?.id, status, clearCart]);

  return null;
}
