"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type DeepLink = {
  upi_intent?: string;
  upi_phonepe?: string;
  upi_gpay?: string;
  upi_paytm?: string;
};

type StoredCheckout = {
  merchantOrderNo?: string;
  paymentLink?: string | null;
  paymentPageUrl?: string | null;
  deepLink?: DeepLink | null;
  amount?: number;
};

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [checkout, setCheckout] = useState<StoredCheckout | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("qpc_checkout");
    if (raw) {
      try {
        setCheckout(JSON.parse(raw) as StoredCheckout);
        return;
      } catch {
        sessionStorage.removeItem("qpc_checkout");
      }
    }
    if (orderId) {
      setCheckout({ merchantOrderNo: orderId });
    }
  }, [orderId]);

  const webUrl = checkout?.paymentLink ?? checkout?.paymentPageUrl;
  const dl = checkout?.deepLink;

  const apps = [
    { label: "PhonePe", href: dl?.upi_phonepe, color: "from-violet-600 to-violet-800" },
    { label: "Paytm", href: dl?.upi_paytm, color: "from-sky-600 to-sky-800" },
    { label: "Google Pay", href: dl?.upi_gpay, color: "from-emerald-600 to-emerald-800" },
    { label: "Any UPI app", href: dl?.upi_intent, color: "from-amber-600 to-orange-700" },
  ].filter((a) => a.href);

  return (
    <div className="royal-surface flex min-h-screen items-center justify-center bg-[#12040c] px-4 py-10">
      <div className="royal-panel w-full max-w-md rounded-[28px] border border-white/10 bg-[#17060d]/95 p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/70">Secure payment</p>
        <h1 className="mt-2 text-xl font-bold text-white">Complete your payment</h1>
        {checkout?.merchantOrderNo && (
          <p className="mt-1 font-mono text-xs text-zinc-500">Order {checkout.merchantOrderNo}</p>
        )}

        {apps.length > 0 ? (
          <div className="mt-6 space-y-2.5">
            <p className="text-sm text-zinc-400">Pay with UPI app</p>
            {apps.map((app) => (
              <a
                key={app.label}
                href={app.href}
                className={`block rounded-2xl bg-gradient-to-r ${app.color} px-4 py-3 text-center text-sm font-bold text-white shadow-lg transition hover:opacity-90`}
              >
                {app.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">UPI deep links are not available for this order. Use the web payment page below.</p>
        )}

        {webUrl && (
          <a
            href={webUrl}
            className="mt-4 block w-full rounded-full border border-white/15 bg-white/8 py-3 text-center text-sm font-semibold text-white hover:bg-white/12"
          >
            Pay on payment page
          </a>
        )}

        <button
          type="button"
          onClick={() => router.push(orderId ? `/payment-status?orderId=${orderId}` : "/payment-status")}
          className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          I have already paid → check status
        </button>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#12040c]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
