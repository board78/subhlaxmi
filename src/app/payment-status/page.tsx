"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clearCart } from "@/app/cart/cartStorage";

type Status = "checking" | "success" | "failed" | "timeout";
type LoopKey = number;

type DrawInfo = { name: string; tickets: number; numbers: string[] };

type QpcStatusResponse = {
  status?: string;
  draws?: DrawInfo[];
  amount?: number;
  error?: string;
};

function useFireworks(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d")!;

    const COLORS = [
      "#f59e0b", "#fbbf24", "#f97316", "#ef4444",
      "#a855f7", "#8b5cf6", "#06b6d4", "#22d3ee",
      "#ec4899", "#f472b6", "#22c55e", "#4ade80",
      "#ffffff", "#fde68a",
    ];

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      alpha: number; color: string; r: number; trail: boolean;
    };
    type Rocket = {
      x: number; y: number; vy: number; targetY: number;
      color: string;
    };

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    let lastLaunch = 0;
    let elapsed = 0;
    let prev = 0;

    const explode = (x: number, y: number, color: string) => {
      const count = 70 + Math.floor(Math.random() * 50);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
        const speed = Math.random() * 7 + 1.5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          alpha: 1,
          color,
          r: Math.random() * 2.5 + 0.8,
          trail: false,
        });
      }
      // sparkling center
      for (let i = 0; i < 12; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          alpha: 1,
          color: "#ffffff",
          r: 1.5,
          trail: true,
        });
      }
    };

    const launch = () => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      rockets.push({
        x: canvas.width * (0.15 + Math.random() * 0.7),
        y: canvas.height,
        vy: -(14 + Math.random() * 8),
        targetY: canvas.height * (0.08 + Math.random() * 0.35),
        color,
      });
    };

    const draw = (ts: number) => {
      const dt = prev ? Math.min(ts - prev, 50) : 16;
      prev = ts;
      elapsed += dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (elapsed < 7000 && ts - lastLaunch > (elapsed < 2000 ? 350 : 600)) {
        launch();
        lastLaunch = ts;
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy *= 0.985;

        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        const trail = 6;
        for (let t = 1; t <= trail; t++) {
          ctx.globalAlpha = (1 - t / trail) * 0.5;
          ctx.beginPath();
          ctx.arc(r.x, r.y + r.vy * t * 0.6, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.fill();
        }

        if (r.y <= r.targetY || r.vy >= -0.5) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.98;
        p.alpha -= p.trail ? 0.025 : 0.013;

        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (elapsed < 9000 || rockets.length || particles.length) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return canvasRef;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 52 52" fill="none" className="h-16 w-16">
      <motion.circle
        cx="26" cy="26" r="24"
        stroke="#22c55e" strokeWidth="2.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M15 26l8 9 14-16"
        stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
      />
    </svg>
  );
}

function FailIcon() {
  return (
    <svg viewBox="0 0 52 52" fill="none" className="h-16 w-16">
      <motion.circle
        cx="26" cy="26" r="24"
        stroke="#ef4444" strokeWidth="2.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M17 17l18 18M35 17L17 35"
        stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 rounded-full border-4 border-amber-400/20" />
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-2xl">🎫</div>
    </div>
  );
}

function PaymentStatusContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [status, setStatus] = useState<Status>("checking");
  const [draws, setDraws] = useState<DrawInfo[]>([]);
  const [amount, setAmount] = useState<number | null>(null);
  const [polls, setPolls] = useState(0);
  // Bumping this key restarts the polling loop (used by "Check Again")
  const [loopKey, setLoopKey] = useState<LoopKey>(0);

  const canvasRef = useFireworks(status === "success");

  // First poll waits 2 s to give the QPC server-to-server callback a head start.
  // Subsequent polls every 3 s for up to 30 attempts (≈ 92 s total).
  const FIRST_DELAY_MS = 2000;
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLLS = 30;

  const checkStatus = useCallback(async (): Promise<boolean> => {
    if (!orderId) return false;
    try {
      const res = await fetch(`/api/payments/qpc/status?orderId=${orderId}`);
      if (res.status === 401) {
        router.push(`/?auth=signin&next=${encodeURIComponent(`/payment-status?orderId=${orderId}`)}`);
        return true;
      }
      // Any non-2xx that isn't 401 — keep polling (order record may not exist yet)
      if (!res.ok && res.status !== 404) return false;

      const data = (await res.json()) as QpcStatusResponse;

      if (data.status === "SUCCESS") {
        clearCart();
        setDraws(data.draws ?? []);
        setAmount(data.amount ?? null);
        setStatus("success");
        import("react-facebook-pixel")
          .then((x) => x.default)
          .then((ReactPixel) => {
            ReactPixel.track("Purchase", {
              value: data.amount ?? 0,
              currency: "INR",
              content_type: "product",
              contents: (data.draws ?? []).map((d) => ({
                id: d.name,
                quantity: d.tickets,
              })),
            });
          })
          .catch(() => {});
        return true;
      }
      if (data.status === "FAILED") {
        setStatus("failed");
        return true;
      }
    } catch {
      // network error — keep polling
    }
    return false;
  }, [orderId, router]);

  useEffect(() => {
    if (!orderId) { setStatus("failed"); return; }

    let cancelled = false;
    let count = 0;

    const tick = async () => {
      if (cancelled) return;
      count++;
      setPolls(count);
      const done = await checkStatus();
      if (done || cancelled) return;
      if (count >= MAX_POLLS) { setStatus("timeout"); return; }
      setTimeout(tick, POLL_INTERVAL_MS);
    };

    // Small initial delay so the QPC callback has time to mark the order processed
    // before we even hit the DB — removes an unnecessary round-trip in the happy path.
    const init = setTimeout(tick, FIRST_DELAY_MS);
    return () => { cancelled = true; clearTimeout(init); };
  }, [orderId, checkStatus, loopKey]);

  // Automatically redirect to My Tickets 4 seconds after a successful payment
  useEffect(() => {
    if (status === "success") {
      const redirectTimer = setTimeout(() => {
        router.push("/my-tickets");
      }, 4000);
      return () => clearTimeout(redirectTimer);
    }
  }, [status, router]);

  const totalTickets = draws.reduce((s, d) => s + d.tickets, 0);

  return (
    <div className="royal-surface royal-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#12040c] px-4 py-8">
      {status === "success" && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden
        />
      )}

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[25%] h-80 w-80 rounded-full bg-amber-300/8 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {status === "checking" && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative z-10 w-full max-w-sm text-center"
          >
            <div className="royal-panel rounded-[28px] border border-white/10 bg-[#17060d]/90 p-8 backdrop-blur-xl">
              <div className="flex justify-center">
                <Spinner />
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/70">
                QPC Secure Pay
              </p>
              <h1 className="mt-2 text-xl font-bold text-white">Confirming payment…</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Please wait while we verify your transaction.
              </p>
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: "4%" }}
                  animate={{ width: `${Math.min(98, (polls / MAX_POLLS) * 100 + 4)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
              <p className="mt-2 text-[10px] text-zinc-600">
                {polls}/{MAX_POLLS} checks · up to ~90 s
              </p>
            </div>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="royal-panel rounded-[32px] border border-emerald-400/20 bg-[#0b1a10]/90 p-8 shadow-[0_0_80px_rgba(34,197,94,0.12)] backdrop-blur-xl">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.15, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.7, 1], ease: "easeOut" }}
                >
                  <CheckIcon />
                </motion.div>

                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/80">
                  Payment Confirmed
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                  🎉 Tickets Booked!
                </h1>
                {amount != null && (
                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} paid
                  </p>
                )}
              </div>

              {draws.length > 0 && (
                <div className="mt-6 space-y-3">
                  {draws.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.12 }}
                      className="rounded-2xl border border-white/8 bg-white/[0.04] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{d.name}</p>
                        <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                          {d.tickets} ticket{d.tickets !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {d.numbers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {d.numbers.map((n) => (
                            <span
                              key={n}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-200"
                            >
                              {n}
                            </span>
                          ))}
                          {d.tickets > d.numbers.length && (
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
                              +{d.tickets - d.numbers.length} more
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              <p className="mt-5 text-center text-xs text-zinc-500">
                {totalTickets} ticket{totalTickets !== 1 ? "s" : ""} confirmed · check your profile for full history
              </p>

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/my-tickets")}
                  className="w-full rounded-full sl-cta-gradient py-3 text-sm font-bold sl-force-light-text"
                >
                  View My Tickets
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {status === "failed" && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-sm text-center"
          >
            <div className="royal-panel rounded-[28px] border border-red-400/20 bg-[#1a0c0c]/90 p-8 backdrop-blur-xl">
              <div className="flex justify-center">
                <FailIcon />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400/80">
                Payment Failed
              </p>
              <h1 className="mt-1 text-xl font-bold text-white">Transaction Declined</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Your payment could not be processed. No amount has been deducted.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="w-full rounded-full sl-cta-gradient py-3 text-sm font-bold sl-force-light-text"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {status === "timeout" && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-sm text-center"
          >
            <div className="royal-panel rounded-[28px] border border-amber-400/20 bg-[#1a1408]/90 p-8 backdrop-blur-xl">
              <div className="flex justify-center text-5xl">⏳</div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/80">
                Payment Pending
              </p>
              <h1 className="mt-1 text-xl font-bold text-white">Still Processing</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Your payment is being processed by the bank. If amount was deducted, your tickets will appear in your profile within a few minutes.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => { setPolls(0); setStatus("checking"); setLoopKey((k) => k + 1); }}
                  className="w-full rounded-full sl-cta-gradient py-3 text-sm font-bold sl-force-light-text"
                >
                  Check Again
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="royal-surface flex min-h-screen items-center justify-center bg-[#12040c]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400/30 border-t-amber-400" />
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
