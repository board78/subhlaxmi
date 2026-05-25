"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RazorpaySuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      await Promise.resolve(); // Defer to microtask to prevent synchronous setState within effect

      // Read params stored in sessionStorage by cart page after payment
      const raw = sessionStorage.getItem("rzp_payment_result");
      if (!raw) {
        setStatus("failed");
        setMessage("Payment details not found. Please contact support.");
        return;
      }

      const params = JSON.parse(raw) as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

      try {
        const res = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (res.ok && data.ok) {
          sessionStorage.removeItem("rzp_payment_result");
          setStatus("success");
          toast.success("Payment successful! Your tickets are booked.");
        } else {
          setStatus("failed");
          setMessage(data.error ?? "Payment verification failed.");
          toast.error("Payment verification failed", { description: data.error });
        }
      } catch {
        setStatus("failed");
        setMessage("Network error during verification.");
        toast.error("Network error during verification.");
      }
    }

    verify();
  }, []);

  return (
    <div className="royal-surface royal-grid flex min-h-screen items-center justify-center bg-[#12040c] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-400/30 border-t-amber-400" />
            <p className="text-xs uppercase tracking-[0.18em] text-amber-200/70">Razorpay</p>
            <h1 className="mt-2 text-2xl font-semibold">Confirming payment…</h1>
            <p className="mt-3 text-sm text-zinc-400">Please wait while we verify your payment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
              ✓
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400/80">Payment confirmed</p>
            <h1 className="mt-2 text-2xl font-semibold text-emerald-300">Tickets Booked!</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Your tickets have been confirmed. Check your profile for booking history.
            </p>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="mt-6 w-full rounded-full sl-cta-gradient py-3 text-sm font-bold sl-force-light-text"
            >
              View My Tickets
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-3 w-full rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              Back to Home
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-3xl">
              ✕
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-red-400/80">Payment failed</p>
            <h1 className="mt-2 text-2xl font-semibold text-red-300">Payment Not Verified</h1>
            <p className="mt-3 text-sm text-zinc-400">{message || "Something went wrong. Please try again."}</p>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="mt-6 w-full rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              Back to Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
