"use client";

import { useCallback, useEffect, useState } from "react";
import type { SafeUser } from "@/lib/auth";
import {
  cartUpdatedAtMs,
  getCart,
  mergeCarts,
  setCart,
} from "@/app/cart/cartStorage";

// ─── useAuth ──────────────────────────────────────────────────────────────────
// Restores session on mount, syncs cart between local storage and the server
// whenever the logged-in user changes.

export function useAuth() {
  const [authUser, setAuthUser] = useState<SafeUser | null>(null);

  // Restore session from /api/auth/me on first render
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) return null;
        try {
          return (await r.json()) as { user: SafeUser };
        } catch {
          return null;
        }
      })
      .then((p) => { if (!cancelled && p?.user) setAuthUser(p.user); })
      .catch(() => { if (!cancelled) setAuthUser(null); });
    return () => { cancelled = true; };
  }, []);

  // Hydrate / merge cart after login
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    void fetch("/api/cart", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return { ok: false, data: {} as { cart?: unknown } };
        try {
          return { ok: true, data: (await r.json()) as { cart?: unknown } };
        } catch {
          return { ok: false, data: {} as { cart?: unknown } };
        }
      })
      .then(({ ok, data }) => {
        if (cancelled || !ok || !data.cart) return;
        const remote = data.cart as ReturnType<typeof getCart>;
        const local  = getCart();
        const localTs  = cartUpdatedAtMs(local);
        const remoteTs = cartUpdatedAtMs(remote);

        if (localTs > remoteTs) {
          void fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: local }) });
          return;
        }
        if (remoteTs > localTs) { setCart(remote); return; }

        const merged = mergeCarts(local, remote);
        setCart(merged);
        void fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: merged }) });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [authUser]);

  // Persist cart on every update (debounced, 120 ms)
  useEffect(() => {
    if (!authUser) return;
    let timer: number | null = null;
    const handler = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: getCart() }) });
      }, 120);
    };
    window.addEventListener("subhlaxmi_cart_updated", handler);
    return () => { if (timer) window.clearTimeout(timer); window.removeEventListener("subhlaxmi_cart_updated", handler); };
  }, [authUser]);

  const updateAuthedUser = useCallback((user: SafeUser | null) => setAuthUser(user), []);

  return { authUser, setAuthUser, updateAuthedUser };
}