"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  clearCart,
  getCart,
  removeDraw,
  removeTickets,
  type CartTicketItem,
  type CartState,
} from "./cartStorage";
import { Navbar } from "@/app/components/Navbar";
import type { SafeUser } from "@/lib/auth";

const TICKET_PREVIEW = 12;

/* ── Razorpay types ─────────────────────────────────────────── */
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}
/* ─────────────────────────────────────────────────────────── */

function formatMoney(amount: number) {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>(() => getCart());
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [error, setError] = useState("");
  const [expandedItem, setExpandedItem] = useState<CartTicketItem | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  /* ── Auth check ── */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuth();
  }, []);

  /* ── Cart sync ── */
  useEffect(() => {
    const sync = () => setCart(getCart());
    window.addEventListener("subhlaxmi_cart_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("subhlaxmi_cart_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /* ── Escape key for modal ── */
  useEffect(() => {
    if (!expandedItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedItem(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedItem]);

  useEffect(() => {
    if (!expandedItem) return;
    if (!cart.items.some((i) => i.drawId === expandedItem.drawId)) {
      setExpandedItem(null);
    }
  }, [cart.items, expandedItem]);

  /* ── Totals ── */
  const totals = useMemo(() => {
    const gstRate = 0.18;
    const subtotal = cart.items.reduce((sum, item) => sum + item.ticketNumbers.length * item.pricePerTicket, 0);
    const gst = Math.round(subtotal * gstRate * 100) / 100;
    const grandTotal = Math.round((subtotal + gst) * 100) / 100;
    const totalTickets = cart.items.reduce((sum, item) => sum + item.ticketNumbers.length, 0);
    return { subtotal, gst, grandTotal, totalTickets };
  }, [cart.items]);

  /* ── Razorpay Checkout ── */
  const startCheckout = async () => {
    setError("");
    if (!cart.items.length) return;

    if (!razorpayLoaded || !window.Razorpay) {
      const msg = "Payment SDK not loaded. Please refresh and try again.";
      setError(msg);
      toast.error("Payment SDK not ready", { description: msg });
      return;
    }

    setLoadingCheckout(true);
    try {
      /* 1. Create order on server */
      const res = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      });

      if (res.status === 401) {
        window.location.href = `/?auth=signin&next=${encodeURIComponent("/cart")}`;
        return;
      }

      const data = (await res.json()) as {
        order_id?: string;
        amount?: number;
        currency?: string;
        key_id?: string;
        user?: { name: string; email: string };
        error?: string;
      };

      if (!res.ok || !data.order_id || !data.key_id) {
        throw new Error(data.error ?? "Unable to create payment order.");
      }

      /* 2. Open Razorpay checkout */
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount!,
        currency: data.currency ?? "INR",
        name: "Subhlaxmi Lottery",
        description: `${totals.totalTickets} ticket${totals.totalTickets > 1 ? "s" : ""}`,
        order_id: data.order_id,
        prefill: {
          name: data.user?.name ?? user?.name ?? "",
          email: data.user?.email ?? user?.email ?? "",
        },
        theme: { color: "#b45309" },
        handler: async (response: RazorpayPaymentResponse) => {
          /* 3. On payment success → verify on server */
          try {
            sessionStorage.setItem("rzp_payment_result", JSON.stringify(response));
            router.push("/payment/razorpay");
          } catch {
            toast.error("Redirect failed. Please visit your profile to confirm booking.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingCheckout(false);
            toast.info("Payment cancelled.");
          },
        },
      });

      rzp.open();
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : "Checkout failed.";
      setError(msg);
      toast.error("Checkout failed", { description: msg });
      setLoadingCheckout(false);
    }
    /* Note: setLoadingCheckout(false) is also called in modal.ondismiss and handler */
  };

  return (
    <div className="royal-surface royal-grid min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Razorpay SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <Navbar
        user={user}
        onAuthChange={(newUser) => {
          setUser(newUser);
          if (!newUser) router.push("/");
        }}
      />

      <div className="sl-cart-page mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="sl-cart-page-eyebrow text-xs uppercase tracking-[0.18em] text-amber-200/70">Cart</p>
            <h1 className="mt-2 text-2xl font-semibold">Your selected tickets</h1>
            <p className="sl-cart-subtitle mt-1 text-sm text-zinc-400">
              Review ticket numbers, then pay securely to confirm.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearCart();
                setCart(getCart());
                setExpandedItem(null);
                setError("");
                toast.success("Cart cleared");
              }}
              className="sl-cart-clear-btn rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-white/25"
            >
              Clear cart
            </button>
          </div>
        </div>

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
          <section className="sl-cart-scroll space-y-4 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2">
            {cart.items.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
                <p className="text-lg font-semibold text-zinc-100">Cart is empty</p>
                <p className="mt-2 text-sm text-zinc-500">Select ticket numbers from a draw and add them to cart.</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <article
                  key={item.drawId}
                  className="sl-cart-item rounded-3xl border border-white/10 bg-[#14070f] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="sl-cart-draw-title text-sm font-semibold text-white">{item.drawName}</p>
                      <p className="sl-cart-meta mt-1 text-xs text-zinc-500">
                        {new Date(item.drawDate).toLocaleDateString("en-IN")} • {item.drawTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-300/12 px-3 py-1 text-xs font-semibold text-amber-200">
                        {item.ticketNumbers.length} tickets
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          removeDraw(item.drawId);
                          setCart(getCart());
                          if (expandedItem?.drawId === item.drawId) setExpandedItem(null);
                          toast.success("Draw removed from cart", { description: item.drawName });
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 hover:border-white/25"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {item.ticketNumbers.slice(0, TICKET_PREVIEW).map((num) => (
                      <div
                        key={num}
                        className="flex items-center justify-between gap-1 rounded-full border border-white/12 bg-white/5 py-1.5 pl-3 pr-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-center font-mono text-xs font-semibold text-zinc-100">
                          {num}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            removeTickets(item.drawId, [num]);
                            setCart(getCart());
                            toast.success("Ticket removed", { description: num });
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 text-sm font-bold text-zinc-300 transition hover:border-red-400/50 hover:bg-red-950/40 hover:text-red-200"
                          aria-label={`Remove ticket ${num}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {item.ticketNumbers.length > TICKET_PREVIEW ? (
                    <button
                      type="button"
                      className="sl-cart-more-btn mt-3 text-left text-xs font-semibold text-amber-600 underline decoration-amber-600/50 underline-offset-2 hover:text-amber-700"
                      onClick={() => setExpandedItem(item)}
                    >
                      +{item.ticketNumbers.length - TICKET_PREVIEW} more selected — view all
                    </button>
                  ) : null}

                  <div className="sl-cart-price-row mt-4 flex items-center justify-between text-xs text-zinc-400">
                    <span>Price per ticket</span>
                    <span className="sl-cart-price-val font-semibold text-zinc-200">₹{item.pricePerTicket}</span>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="sl-cart-aside mt-6 rounded-3xl border border-white/10 bg-[#0f0a0c] p-5 lg:mt-0 lg:self-start lg:sticky lg:top-24">
            <p className="sl-cart-summary-title text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Order summary</p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="sl-cart-row flex justify-between text-zinc-400">
                <span>Tickets</span>
                <span className="sl-cart-value text-zinc-200">{totals.totalTickets}</span>
              </div>
              <div className="sl-cart-row flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="sl-cart-value text-zinc-200">₹{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="sl-cart-row flex justify-between text-zinc-400">
                <span>GST (18%)</span>
                <span className="sl-cart-value text-zinc-200">₹{formatMoney(totals.gst)}</span>
              </div>
              <div className="sl-cart-total flex justify-between border-t border-white/10 pt-3 text-base font-bold text-amber-300">
                <span>Total</span>
                <span>₹{formatMoney(totals.grandTotal)}</span>
              </div>
            </div>

            {error ? (
              <p className="sl-cart-error mt-4 rounded-2xl bg-red-950/30 px-4 py-3 text-sm leading-snug text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!cart.items.length || loadingCheckout}
              onClick={startCheckout}
              className="mt-5 w-full rounded-full sl-cta-gradient py-3 text-sm font-bold sl-force-light-text disabled:opacity-50"
            >
              {loadingCheckout ? "Opening payment…" : "Buy & Pay Securely"}
            </button>

            {/* Test mode badge */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                🧪 Razorpay Test Mode
              </span>
            </div>

            <p className="mt-2 text-[11px] leading-5 text-zinc-500">
              After payment, your ticket booking will appear in your profile history.
            </p>
          </aside>
        </div>
      </div>

      {/* Expanded tickets modal */}
      {expandedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-tickets-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={() => setExpandedItem(null)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl border border-white/10 bg-[#14070f] shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <h2 id="cart-tickets-dialog-title" className="text-base font-semibold text-white">
                  All tickets
                </h2>
                <p className="mt-1 text-xs text-zinc-400">{expandedItem.drawName}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {expandedItem.ticketNumbers.length} numbers · ₹{expandedItem.pricePerTicket} each
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
                onClick={() => setExpandedItem(null)}
              >
                Close
              </button>
            </div>
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {expandedItem.ticketNumbers.map((num) => (
                  <div
                    key={num}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2"
                  >
                    <span className="min-w-0 truncate font-mono text-xs font-semibold text-zinc-100">{num}</span>
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-sm text-zinc-400 hover:border-red-400/40 hover:text-red-300"
                      onClick={() => {
                        removeTickets(expandedItem.drawId, [num]);
                        const next = getCart();
                        setCart(next);
                        const updated = next.items.find((i) => i.drawId === expandedItem.drawId);
                        setExpandedItem(updated ?? null);
                        toast.success("Ticket removed", { description: num });
                      }}
                      aria-label={`Remove ${num}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
