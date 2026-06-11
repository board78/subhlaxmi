"use client";

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
import { Navbar } from "@/components/Navbar";
import type { SafeUser } from "@/lib/auth";
import { useSearchParams } from "next/navigation";

const TICKET_PREVIEW = 12;
const EMPTY_CART: CartState = { items: [], updatedAt: new Date(0).toISOString() };

function formatMoney(amount: number) {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

import { Suspense } from "react";

function CartContent() {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [cartReady, setCartReady] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [error, setError] = useState("");
  const [expandedItem, setExpandedItem] = useState<CartTicketItem | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const searchParams = useSearchParams();

  // Auto-fill referral code from URL or sessionStorage
  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      setReferralCode(urlRef);
      sessionStorage.setItem("subhlaxmi_ref", urlRef);
    } else {
      const storedRef = sessionStorage.getItem("subhlaxmi_ref");
      if (storedRef) setReferralCode(storedRef);
    }
  }, [searchParams]);

  useEffect(() => {
    setCart(getCart());
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (cartReady && cart.items.length > 0) {
      import("react-facebook-pixel")
        .then((x) => x.default)
        .then((ReactPixel) => {
          ReactPixel.track("InitiateCheckout", {
            num_items: cart.items.reduce((sum, item) => sum + item.ticketNumbers.length, 0),
            value: cart.items.reduce((sum, item) => sum + item.ticketNumbers.length * item.pricePerTicket, 0),
            currency: "INR",
          });
        })
        .catch(() => {});
    }
  }, [cartReady, cart.items]);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => r.ok ? (await r.json() as { user: SafeUser }) : null)
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sync = () => setCart(getCart());
    window.addEventListener("subhlaxmi_cart_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("subhlaxmi_cart_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!expandedItem) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpandedItem(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedItem]);

  useEffect(() => {
    if (!expandedItem) return;
    if (!cart.items.some((i) => i.drawId === expandedItem.drawId)) {
      setTimeout(() => setExpandedItem(null), 0);
    }
  }, [cart.items, expandedItem]);

  const totals = useMemo(() => {
    const subtotal = cart.items.reduce((sum, item) => sum + item.ticketNumbers.length * item.pricePerTicket, 0);
    const hasDiscount = Boolean(user && user.availableDiscounts && user.availableDiscounts > 0);
    const discountAmount = hasDiscount ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const discountedSubtotal = subtotal - discountAmount;
    
    const gst = Math.round(discountedSubtotal * 0.18 * 100) / 100;
    const grandTotal = Math.round((discountedSubtotal + gst) * 100) / 100;
    const totalTickets = cart.items.reduce((sum, item) => sum + item.ticketNumbers.length, 0);
    return { subtotal, discountAmount, gst, grandTotal, totalTickets, hasDiscount };
  }, [cart.items, user]);

  const startCheckout = async () => {
    setError("");
    if (!cart.items.length) return;
    setLoadingCheckout(true);

    try {
      let res: Response;
      try {
        res = await fetch("/api/payments/qpc/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart, referralCode }),
          signal: AbortSignal.timeout(60_000),
        });
      } catch {
        throw new Error(
          "Could not reach the payment server. Keep the dev server running, refresh the page, and try again.",
        );
      }

      if (res.status === 401) {
        window.location.href = `/?auth=signin&next=${encodeURIComponent("/cart")}`;
        return;
      }

      const text = await res.text();
      let data: {
        paymentLink?: string | null;
        paymentPageUrl?: string | null;
        deepLink?: { upi_intent?: string; upi_phonepe?: string; upi_gpay?: string; upi_paytm?: string };
        merchantOrderNo?: string;
        error?: string;
      };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid response from payment server.");
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Unable to create payment order.");
      }

      const webPayUrl = data.paymentLink ?? data.paymentPageUrl;
      const hasUpi = Boolean(
        data.deepLink?.upi_intent || data.deepLink?.upi_phonepe || data.deepLink?.upi_paytm,
      );

      if (webPayUrl) {
        window.location.href = webPayUrl;
        return;
      }

      if (hasUpi && data.merchantOrderNo) {
        sessionStorage.setItem("qpc_checkout", JSON.stringify(data));
        router.push(`/payment/checkout?orderId=${data.merchantOrderNo}`);
        return;
      }

      throw new Error("QPC did not return a payment page or UPI link.");
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : "Checkout failed.";
      setError(msg);
      toast.error("Checkout failed", { description: msg });
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="royal-surface royal-grid min-h-screen bg-[var(--background)] text-[var(--foreground)]">
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

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
          <section className="sl-cart-scroll space-y-4 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2">
            {!cartReady ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
                <p className="mt-3 text-sm text-zinc-500">Loading cart…</p>
              </div>
            ) : cart.items.length === 0 ? (
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

                  {item.ticketNumbers.length > TICKET_PREVIEW && (
                    <button
                      type="button"
                      className="sl-cart-more-btn mt-3 text-left text-xs font-semibold text-amber-600 underline decoration-amber-600/50 underline-offset-2 hover:text-amber-700"
                      onClick={() => setExpandedItem(item)}
                    >
                      +{item.ticketNumbers.length - TICKET_PREVIEW} more selected — view all
                    </button>
                  )}

                  <div className="sl-cart-price-row mt-4 flex items-center justify-between text-xs text-zinc-400">
                    <span>Price per ticket</span>
                    <span className="sl-cart-price-val font-semibold text-zinc-200">₹{item.pricePerTicket}</span>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="sl-cart-aside mt-6 rounded-3xl border border-white/10 bg-[#0f0a0c] p-5 lg:mt-0 lg:self-start lg:sticky lg:top-24">
            <p className="sl-cart-summary-title text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Order summary
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="sl-cart-row flex justify-between text-zinc-400">
                <span>Tickets</span>
                <span className="sl-cart-value text-zinc-200">{totals.totalTickets}</span>
              </div>
              <div className="sl-cart-row flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="sl-cart-value text-zinc-200">₹{formatMoney(totals.subtotal)}</span>
              </div>
              {totals.hasDiscount && (
                <div className="sl-cart-row flex justify-between text-amber-400">
                  <span>Referral Discount (10%)</span>
                  <span className="sl-cart-value">-₹{formatMoney(totals.discountAmount)}</span>
                </div>
              )}
              <div className="sl-cart-row flex justify-between text-zinc-400">
                <span>GST (18%)</span>
                <span className="sl-cart-value text-zinc-200">₹{formatMoney(totals.gst)}</span>
              </div>
              
              <div className="mt-4 border-t border-white/10 pt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
                />
              </div>

              <div className="sl-cart-total flex justify-between border-t border-white/10 pt-3 text-base font-bold text-amber-300 mt-4">
                <span>Total</span>
                <span>₹{formatMoney(totals.grandTotal)}</span>
              </div>
            </div>

            {error && (
              <p className="sl-cart-error mt-4 rounded-2xl bg-red-950/30 px-4 py-3 text-sm leading-snug text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={!cartReady || !cart.items.length || loadingCheckout}
              onClick={startCheckout}
              className="mt-5 w-full rounded-full sl-cta-gradient py-3 text-sm font-bold sl-force-light-text disabled:opacity-50"
            >
              {loadingCheckout ? "Redirecting to payment…" : "Buy & Pay Securely"}
            </button>

            <div className="mt-3 flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-[11px] font-semibold text-zinc-500">Secured by QPC · UPI · IMPS</span>
            </div>

            <p className="mt-2 text-[11px] leading-5 text-zinc-600">
              After payment, tickets appear in your profile instantly.
            </p>
          </aside>
        </div>
      </div>

      {expandedItem && (
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
      )}
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}
