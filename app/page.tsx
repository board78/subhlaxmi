"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "./components/AuthModal";
import { FrameOverlay } from "./components/FrameOverlay";
import { HeaderBar, type HeaderBarProps } from "./components/HeaderBar";
import { ProfilePanel } from "./components/ProfilePanel";
import {
  MarketingTicket,
  siteCopy,
  type CopyPack,
  type Language,
  type Stat,
} from "./siteCopy";
import {
  cartUpdatedAtMs,
  getCart,
  mergeCarts,
  setCart,
} from "@/app/cart/cartStorage";
import type { SafeUser } from "@/lib/auth";
import type { DrawSummaryPublic } from "@/lib/draws";

const sliderImages = [
  "/slider1.png",
  "/slider2.png",
  "/slider3.png",
  "/slider4.png",
  "/slider5.png",
  "/slider7.png",
  "/slider8.png",
  "/slider9.png",
  "/slider10.png",
] as const;

const winners = [
  { image: "devendra j bansal.jpeg", amount: "₹1 Lakh" },
  { image: "nazir j balsara.jpeg", amount: "₹1 Lakh" },
  { image: "magnesh y pawar.jpeg", amount: "₹5 Lakhs" },
  { image: "krushmi y vira.jpeg", amount: "₹1 Lakh" },
  { image: "vikash vishwakarma.jpeg", amount: "₹2 Lakhs" },
] as const;

function formatWinnerName(fileName: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  return baseName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic sample ticket id for marketing / results list (matches sl-a-10001 style). */
function formatSampleTicket(seed: string): string {
  const series = ["a", "b", "c", "d", "e"][hashString(seed) % 5];
  const n = 10000 + (hashString(`${seed}:n`) % 90000);
  return `sl-${series}-${n}`;
}

function WinnerCard({
  imageName,
  amount,
  gradientClass,
  burstKey,
  onBurst,
}: {
  imageName: string;
  amount: string;
  gradientClass: string;
  burstKey: number;
  onBurst: () => void;
}) {
  const winnerName = formatWinnerName(imageName);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || burstKey === 0) {
      const context = canvas?.getContext("2d");
      if (canvas && context)
        context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const fire = confetti.create(canvas, { resize: true, useWorker: false });
      const colors = [
        "#fffbeb",
        "#fef3c7",
        "#fde68a",
        "#fcd34d",
        "#fbbf24",
        "#f59e0b",
        "#d97706",
        "#b45309",
      ];

      fire({
        particleCount: 32,
        spread: 42,
        startVelocity: 26,
        ticks: 90,
        gravity: 1.05,
        scalar: 0.6,
        origin: { x: 0.5, y: 0.35 },
        colors,
      });

      fire({
        particleCount: 18,
        spread: 70,
        startVelocity: 32,
        ticks: 110,
        gravity: 0.9,
        scalar: 0.45,
        origin: { x: 0.5, y: 0.3 },
        colors,
        shapes: ["circle"],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [burstKey]);

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.18 }}
      onPointerEnter={onBurst}
    >
      <div
        className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradientClass} p-[1px] shadow-lg shadow-black/35`}
      >
        <div className="sl-winner-card-face relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f0a0c]/90 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
          </div>

          <div className="relative z-[4] flex flex-col items-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Winner
            </p>
            <span className="mt-2 inline-flex items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-[11px] font-bold leading-none text-amber-200 sm:text-xs">
              Won {amount}
            </span>
            <p className="mt-3 max-w-[15rem] text-base font-semibold leading-snug text-white sm:max-w-none">
              {winnerName}
            </p>

            <div className="mt-5 flex w-full items-center justify-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/15 bg-white/5 shadow-[0_0_0_6px_rgba(251,191,36,0.06)]">
                <Image
                  src={`/winner_image/${imageName}`}
                  alt={`${winnerName} winner image`}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/8 text-[11px]">
                🎉
              </span>
              <span className="font-semibold text-zinc-300">
                Congratulations!
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function VerticalImageCarousel({
  className,
  intervalMs = 1000,
}: {
  className?: string;
  intervalMs?: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const restartKeyRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      timerRef.current = window.setTimeout(() => {
        setActiveIndex((i) => (i + 1) % sliderImages.length);
        tick();
      }, intervalMs);
    };

    tick();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [intervalMs]);

  const setActiveAndRestart = (index: number) => {
    setActiveIndex(index);
    restartKeyRef.current += 1;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setActiveIndex((i) => (i + 1) % sliderImages.length);
    }, intervalMs);
  };

  const src = sliderImages[activeIndex];

  return (
    <div
      className={["relative flex w-full flex-col", className ?? ""].join(" ")}
    >
      <div className="relative aspect-[1672/941] w-full overflow-hidden rounded-[22px] bg-black/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 28, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -22, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={src}
              alt={`Slider image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1200px"
              className="object-contain object-center"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveAndRestart(index)}
            className={`h-2 cursor-pointer rounded-full transition ${
              index === activeIndex
                ? "w-7 bg-amber-300"
                : "w-2 bg-white/25 hover:bg-white/40"
            }`}
            aria-label={`Show slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function getNextDrawTime(baseDate: Date): Date {
  const drawHours = [13, 18, 21];
  const now = new Date(baseDate);

  for (const hour of drawHours) {
    const candidate = new Date(now);
    candidate.setHours(hour, 0, 0, 0);
    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(drawHours[0], 0, 0, 0);
  return tomorrow;
}

function formatDrawTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
  }).format(date);
}

function Counter({
  label,
  value,
  suffix,
  compact,
}: Stat & { compact?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 1400;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * value));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (compact) {
    return (
      <motion.article
        whileHover={{ y: -2, boxShadow: "0 0 18px rgba(251, 191, 36, 0.12)" }}
        className="rounded-xl border border-white/10 bg-[#1b0b1d]/95 px-3 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
      >
        <p className="text-base font-bold tabular-nums leading-none text-amber-300 sm:text-lg">
          {displayValue.toLocaleString("en-IN")}
          {suffix}
        </p>
        <p className="mt-1 text-[10px] leading-snug text-zinc-400 sm:text-[11px]">
          {label}
        </p>
      </motion.article>
    );
  }

  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: "0 0 28px rgba(251, 191, 36, 0.22)" }}
      className="rounded-2xl border border-white/10 bg-[#1b0b1d]/90 p-4 transition"
    >
      <p className="text-2xl font-bold text-amber-300">
        {displayValue.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-zinc-300/85">{label}</p>
    </motion.article>
  );
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="sl-time-box flex min-w-0 flex-1 flex-col items-center rounded-xl border border-amber-500/25 bg-gradient-to-b from-white/[0.09] to-black/40 px-2 py-2 shadow-[inset_0_1px_0_rgba(253,230,138,0.12)] sm:px-3">
      <span className="sl-time-value text-lg font-bold tabular-nums text-amber-300 sm:text-xl">
        {value}
      </span>
      <span className="sl-time-label mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200/50 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function RightInsightColumn({
  currentCopy,
  countdown,
  nextDraw,
}: {
  currentCopy: CopyPack;
  countdown: { hours: string; minutes: string; seconds: string };
  nextDraw: Date;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonialCanvasRef = useRef<HTMLCanvasElement>(null);
  const skipInitialConfetti = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % currentCopy.testimonials.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [currentCopy.testimonials.length]);

  useEffect(() => {
    if (skipInitialConfetti.current) {
      skipInitialConfetti.current = false;
      return;
    }
    const canvas = testimonialCanvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const fire = confetti.create(canvas, { resize: true, useWorker: true });
      const colors = [
        "#fffbeb",
        "#fef3c7",
        "#fde68a",
        "#fcd34d",
        "#fbbf24",
        "#f59e0b",
        "#d97706",
        "#b45309",
      ];

      fire({
        particleCount: 52,
        spread: 56,
        startVelocity: 28,
        ticks: 100,
        gravity: 0.92,
        scalar: 0.85,
        origin: { x: 0.5, y: 0.48 },
        colors,
      });
      fire({
        particleCount: 32,
        spread: 118,
        startVelocity: 38,
        ticks: 125,
        gravity: 0.78,
        scalar: 0.52,
        origin: { x: 0.5, y: 0.4 },
        colors,
        shapes: ["circle"],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeIndex]);

  const active = currentCopy.testimonials[activeIndex];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="royal-panel sl-insight-column flex w-full min-w-0 flex-col gap-3 rounded-[24px] border border-white/10 bg-[#140912] p-4 sm:gap-3.5 sm:rounded-[28px] sm:p-4"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-amber-300/15 bg-[radial-gradient(circle_at_top,rgba(255,191,36,0.08),transparent_50%),#1a0f14]">
        <Image
          src="/goddesslaxmi.png"
          alt="Goddess Laxmi illustration"
          fill
          priority
          sizes="(max-width: 1279px) 100vw, 320px"
          className="object-contain p-3 sm:p-3.5"
        />
      </div>

      <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border border-amber-300/12 bg-[#0c0812] px-3 py-3.5 sm:px-4 sm:py-4">
        <canvas
          ref={testimonialCanvasRef}
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
          aria-hidden
        />

        <div className="relative z-[5] flex flex-col gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px]">
              {currentCopy.testimonialLabel}
            </p>
            <h3 className="mt-1 text-sm font-semibold leading-snug text-white sm:text-base">
              {currentCopy.testimonialTitle}
            </h3>
            <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500 sm:text-[11px]">
              {currentCopy.testimonialHelper}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.name}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col rounded-xl border border-white/8 bg-black/30 p-2.5 sm:p-3.5"
            >
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[11px] font-bold text-[#301000] sm:h-9 sm:w-9 sm:text-xs">
                  {active.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white sm:text-xs">
                    {active.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 sm:text-[11px]">
                    {active.location}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-zinc-200 sm:text-[10px]">
                  {active.tag}
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-zinc-300 sm:text-xs sm:leading-relaxed">
                &quot;{active.quote}&quot;
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-1.5 pt-0.5">
            {currentCopy.testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition sm:h-2 ${
                  index === activeIndex
                    ? "w-5 bg-amber-300 sm:w-6"
                    : "w-1.5 bg-white/25 hover:bg-white/40"
                }`}
                aria-label={`Show testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px]">
          {currentCopy.statsTitle}
        </p>
        <div className="flex flex-col gap-2">
          {currentCopy.stats.map((item) => (
            <Counter key={item.label} {...item} compact />
          ))}
        </div>
      </div>

      <div className="sl-mega-countdown rounded-2xl border border-amber-400/25 bg-gradient-to-br from-[#2a1810] via-[#1a0f0e] to-[#0f0908] px-3 py-3.5 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)] sm:px-4 sm:py-4">
        <p className="sl-countdown-kicker text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/90 sm:text-xs">
          {currentCopy.countdownTitle}
        </p>
        <div className="mt-2 flex gap-1.5 sm:gap-2">
          <TimeBox value={countdown.hours} label={currentCopy.hrs} />
          <TimeBox value={countdown.minutes} label={currentCopy.mins} />
          <TimeBox value={countdown.seconds} label={currentCopy.secs} />
        </div>
        <p className="sl-countdown-foot mt-2 text-[10px] text-amber-100/75 sm:text-xs">
          {currentCopy.nextDrawAt} {formatDrawTime(nextDraw)}
        </p>
      </div>
    </motion.section>
  );
}

function PanelCorners() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="royal-corner royal-corner-tl left-2 top-2 scale-75" />
      <div className="royal-corner royal-corner-tr right-2 top-2 scale-75" />
      <div className="royal-corner royal-corner-bl bottom-2 left-2 scale-75" />
      <div className="royal-corner royal-corner-br bottom-2 right-2 scale-75" />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const currentCopy = siteCopy[language];
  const [nextDraw, setNextDraw] = useState<Date>(() =>
    getNextDrawTime(new Date()),
  );
  const [remainingTime, setRemainingTime] = useState(0);
  const [authUser, setAuthUser] = useState<SafeUser | null>(null);
  const [authOpen, setAuthOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    return auth === "signin" || auth === "register";
  });
  const [authMode, setAuthMode] = useState<"signin" | "register">(() => {
    if (typeof window === "undefined") return "signin";
    const params = new URLSearchParams(window.location.search);
    return params.get("auth") === "register" ? "register" : "signin";
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  // Live draws from DB
  const [liveDraws, setLiveDraws] = useState<DrawSummaryPublic[]>([]);
  const [drawsPage, setDrawsPage] = useState(1);
  const [winnerBurst, setWinnerBurst] = useState({ image: "", key: 0 });

  // Live results from DB
  type LiveResult = { id: string; drawName: string; winningTicket: string; prize: string; winnerName: string | null; declaredAt: string };
  const [liveResults, setLiveResults] = useState<LiveResult[]>([]);

  const openAuth = (mode: "signin" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const updateAuthedUser = useCallback((user: SafeUser | null) => {
    setAuthUser(user);
  }, []);

  // Restore session on page load
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user: SafeUser };
      })
      .then((profile) => {
        if (!cancelled && profile?.user) setAuthUser(profile.user);
      })
      .catch(() => {
        if (!cancelled) setAuthUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hydrate from server after login — do not merge a *stale* remote cart over a newer local one
  // (e.g. user cleared cart on /cart then navigates home before PUT debounce finished).
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    void fetch("/api/cart", { cache: "no-store" })
      .then(async (r) => ({
        ok: r.ok,
        data: (await r.json()) as { cart?: unknown },
      }))
      .then(({ ok, data }) => {
        if (cancelled || !ok || !data.cart) return;
        const remote = data.cart as ReturnType<typeof getCart>;
        const local = getCart();
        const localTs = cartUpdatedAtMs(local);
        const remoteTs = cartUpdatedAtMs(remote);

        if (localTs > remoteTs) {
          void fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: local }),
          });
          return;
        }

        if (remoteTs > localTs) {
          setCart(remote);
          return;
        }

        const merged = mergeCarts(local, remote);
        setCart(merged);
        void fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart: merged }),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  // Persist cart to DB on updates (when signed in)
  useEffect(() => {
    if (!authUser) return;
    let timer: number | null = null;
    const handler = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart: getCart() }),
        });
      }, 120);
    };
    window.addEventListener("subhlaxmi_cart_updated", handler);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("subhlaxmi_cart_updated", handler);
    };
  }, [authUser]);

  // Fetch live draws from DB
  useEffect(() => {
    fetch("/api/draws")
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as { draws: DrawSummaryPublic[] };
        setLiveDraws(data.draws);
      })
      .catch(() => {});
  }, []);

  // Fetch declared results from DB
  useEffect(() => {
    type Res = { results: LiveResult[] };
    fetch("/api/results")
      .then(async (r) => (r.ok ? ((await r.json()) as Res) : null))
      .then((d) => { if (d?.results) setLiveResults(d.results); })
      .catch(() => {});
  }, []);

  const openBookPage = (draw: DrawSummaryPublic) => {
    router.push(`/book/${draw.id}`);
  };

  // For static draw cards, find matching DB draw by name fragment
  const findLiveDraw = (staticName: string): DrawSummaryPublic | null => {
    const norm = staticName.toLowerCase();
    return (
      liveDraws.find((d) =>
        d.name.toLowerCase().includes(norm.split(" ")[0]),
      ) ?? null
    );
  };

  const bookTicket = (ticket: MarketingTicket) => {
    setBookingMessage("");
    const liveDraw = findLiveDraw(ticket.name);
    if (liveDraw) {
      openBookPage(liveDraw);
    } else {
      // No DB draw yet – prompt auth or show info
      if (!authUser) {
        openAuth("signin");
      } else {
        setBookingMessage(
          `${ticket.name} is not yet available in the system. Run npm run seed to load draws.`,
        );
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let target = nextDraw;

      if (target.getTime() <= now.getTime()) {
        target = getNextDrawTime(now);
        setNextDraw(target);
      }

      setRemainingTime(Math.max(target.getTime() - now.getTime(), 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [nextDraw]);

  const countdown = useMemo(() => {
    const totalSeconds = Math.floor(remainingTime / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");

    return { hours, minutes, seconds };
  }, [remainingTime]);

  const headerBarProps: HeaderBarProps = {
    heroTitle: currentCopy.heroTitle,
    menu: currentCopy.menu,
    signIn: currentCopy.signIn,
    register: currentCopy.register,
    language,
    onLanguageChange: setLanguage,
    authUser,
    onSignIn: () => openAuth("signin"),
    onRegister: () => openAuth("register"),
    onProfileClick: () => setProfileOpen(true),
  };

  return (
    <div className="royal-surface royal-grid royal-frame relative min-h-screen overflow-hidden bg-[#12040c] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-orange-500/16 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-amber-300/12 blur-3xl" />
      </div>
      <FrameOverlay />

      <main className="relative h-screen overflow-hidden">
        <div className="flex h-full flex-col bg-[#17060d]/90 backdrop-blur-xl">
          <HeaderBar {...headerBarProps} />

          <div className="mx-auto w-full max-w-[1800px] min-h-0 flex-1 px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
            <section className="hide-scrollbar h-full overflow-y-auto p-5 md:p-7">
              <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.2fr)_290px] xl:items-start">
                <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                  <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="royal-panel royal-panel-strong sl-hero-outline relative w-full overflow-hidden rounded-[24px] border-2 border-amber-500/35 bg-transparent px-5 pb-3 pt-5 sm:rounded-[28px] sm:px-6 sm:pt-6"
                  >
                    <PanelCorners />
                    <div className="relative flex w-full flex-col items-center gap-4">
                      <div className="relative w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                        <div className="w-full">
                          <VerticalImageCarousel
                            className="p-0"
                            intervalMs={3000}
                          />
                        </div>
                      </div>

                      <div className="w-full max-w-4xl text-center">
                        <p className="mx-auto mt-4 max-w-3xl text-sm font-medium leading-7 text-[var(--foreground)] opacity-[0.92] md:text-base">
                          {currentCopy.heroDescription}
                        </p>
                      </div>
                    </div>
                  </motion.section>

                  <section className="royal-panel rounded-[24px] border border-white/10 bg-[#14070f] p-4 sm:rounded-[28px] sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                      <h2 className="text-lg font-semibold sm:text-xl">
                        {currentCopy.popularTitle}
                      </h2>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">
                        IST
                      </span>
                    </div>
                    {bookingMessage ? (
                      <p className="mb-3 rounded-2xl border border-amber-200/15 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
                        {bookingMessage}
                      </p>
                    ) : null}

                    {liveDraws.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
                        <p className="text-sm font-semibold text-zinc-400">No active draws available</p>
                        <p className="mt-1 text-xs text-zinc-600">New draws will appear here once activated by the admin.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid items-start gap-3 md:grid-cols-2">
                          {liveDraws
                            .slice((drawsPage - 1) * 6, drawsPage * 6)
                            .map((draw, index) => {
                            const gradients = [
                              "from-[#2ca7ff] to-[#6157ff]",
                              "from-[#ff7b38] to-[#ff3d6e]",
                              "from-[#7a5cff] to-[#c052ff]",
                              "from-[#e0a60d] to-[#ff7b38]",
                              "from-[#00c6ff] to-[#0072ff]",
                              "from-[#f857a6] to-[#ff5858]",
                              "from-[#56ab2f] to-[#a8e063]",
                            ];
                            const accent = gradients[index % gradients.length];
                            const remaining = draw.availableTickets;
                            const total = draw.totalTickets;
                            const pctLeft =
                              total > 0
                                ? Math.max(0, Math.min(100, (remaining / total) * 100))
                                : null;
                            const drawDate = new Date(draw.drawDate);
                            const drawTimeLabel = `${drawDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${draw.drawTime}`;

                            return (
                              <motion.article
                                key={draw.id}
                                onClick={() => openBookPage(draw)}
                                whileHover={{ boxShadow: "0 0 28px rgba(255, 153, 0, 0.18)" }}
                                transition={{ duration: 0.18 }}
                                className={`group self-start rounded-3xl bg-gradient-to-r p-[2px] ${accent} transition cursor-pointer`}
                              >
                                <div className="flex flex-col overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                                  <div className="sl-popular-draw-card flex flex-col bg-[#120b0f] p-3 transition-[border-radius] duration-300 ease-out sm:p-4 rounded-[22px] group-hover:rounded-t-[22px] group-hover:rounded-b-[14px]">
                                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                                      <div className="min-w-0 flex-1">
                                        <p className="sl-ticket-draw-name text-[11px] font-semibold leading-snug sm:text-xs md:text-sm">
                                          {draw.name}
                                        </p>
                                        <p className="mt-1 text-base font-bold leading-tight text-amber-300 sm:text-lg md:text-xl">
                                          ₹{draw.pricePerTicket.toLocaleString("en-IN")}/ticket
                                        </p>
                                      </div>
                                      <div className="sl-ticket-draw-time-pill max-w-[48%] shrink-0 rounded-xl bg-white/10 px-2 py-1.5 text-right text-[9px] leading-tight text-zinc-100 sm:rounded-2xl sm:px-2.5 sm:py-2 sm:text-[10px] md:text-xs">
                                        {drawTimeLabel}
                                      </div>
                                    </div>
                                    {pctLeft != null ? (
                                      <div className="mt-3">
                                        <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500">
                                          <span>
                                            Only{" "}
                                            <span className="text-amber-200">
                                              {remaining.toLocaleString("en-IN")}
                                            </span>{" "}
                                            left
                                          </span>
                                          <span>{total.toLocaleString("en-IN")} total</span>
                                        </div>
                                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border border-emerald-200/15 bg-gradient-to-r from-emerald-950/70 via-amber-950/50 to-red-950/60 shadow-inner shadow-black/30">
                                          <div
                                            className="sl-progress-fill h-full rounded-full"
                                            style={{ width: `${pctLeft}%` }}
                                          />
                                        </div>
                                      </div>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); openBookPage(draw); }}
                                      className="mt-3 w-fit cursor-pointer rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-semibold text-white sm:mt-4 sm:px-4 sm:py-2 sm:text-xs"
                                    >
                                      {currentCopy.buyTicket}
                                    </button>
                                  </div>
                                  <div
                                    className={`h-0 shrink-0 overflow-hidden bg-gradient-to-r transition-[height] duration-300 ease-out rounded-b-[22px] group-hover:h-[36px] group-hover:rounded-t-[14px] ${accent}`}
                                    aria-hidden
                                  />
                                </div>
                              </motion.article>
                            );
                          })}
                        </div>
                        
                        {/* Pagination controls */}
                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                          <button
                            type="button"
                            onClick={() => setDrawsPage((p) => Math.max(1, p - 1))}
                            disabled={drawsPage === 1}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                              <path d="M15 18l-6-6 6-6" />
                            </svg>
                            Previous
                          </button>
                          <span className="text-[11px] font-semibold text-zinc-500">
                            Page {drawsPage} of {Math.max(1, Math.ceil(liveDraws.length / 6))}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDrawsPage((p) => Math.min(Math.max(1, Math.ceil(liveDraws.length / 6)), p + 1))}
                            disabled={drawsPage >= Math.ceil(liveDraws.length / 6)}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Next
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                </div>

                <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                  <RightInsightColumn
                    currentCopy={currentCopy}
                    countdown={countdown}
                    nextDraw={nextDraw}
                  />

                  <section className="sl-live-results-board royal-panel min-w-0 rounded-[24px] border border-white/10 bg-[#14070f] p-4 sm:rounded-[28px] sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold sm:text-xl">
                        {currentCopy.liveResultsTitle}
                      </h2>
                      {liveResults.length > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                      {liveResults.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
                          <p className="text-sm font-semibold text-zinc-400">No results declared yet</p>
                          <p className="mt-1 text-xs text-zinc-600">Results will appear here after each draw.</p>
                        </div>
                      ) : (
                        liveResults.map((result) => (
                          <motion.div
                            key={result.id}
                            whileHover={{ x: 3 }}
                            transition={{ duration: 0.16 }}
                            className="sl-live-result-row flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5 sm:py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="sl-live-result-label block truncate text-sm font-medium text-zinc-200">
                                {result.drawName}
                              </span>
                              {result.winnerName && (
                                <span className="block truncate text-[10px] text-zinc-500">
                                  Winner: {result.winnerName}
                                </span>
                              )}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="sl-ticket-pill rounded-full px-3 py-1 font-mono text-xs font-semibold tabular-nums shadow-sm">
                                {result.winningTicket}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-400">
                                {result.prize}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </section>

                  <motion.section
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.18 }}
                    className="royal-panel sl-upi-promo rounded-[24px] border border-orange-300/15 bg-gradient-to-r from-[#582313] via-[#8a2b13] to-[#d37b13] p-4 sm:rounded-[28px] sm:p-5"
                  >
                    <p className="sl-upi-kicker text-[11px] uppercase tracking-[0.18em] text-orange-100/85 sm:text-xs">
                      UPI • Instant results
                    </p>
                    <h2 className="sl-upi-title mt-2 max-w-lg text-xl font-semibold leading-snug sm:mt-3 sm:text-2xl">
                      {currentCopy.footerTitle}
                    </h2>
                    {currentCopy.footerDescription ? (
                      <p className="sl-upi-body mt-2 max-w-xl text-xs leading-6 text-orange-50/90 sm:text-sm sm:leading-7">
                        {currentCopy.footerDescription}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        if (!authUser) openAuth("register");
                        else if (liveDraws.length)
                          router.push(`/book/${liveDraws[0].id}`);
                        else setProfileOpen(true);
                      }}
                      className="sl-force-light-text mt-4 rounded-full border border-white/10 bg-[#180808] px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.03] sm:mt-5"
                    >
                      {currentCopy.footerButton}
                    </button>
                  </motion.section>
                </div>
              </div>

              <section className="royal-panel sl-winners-section mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#14070f] p-5 sm:mt-5">
                <div className="pointer-events-none absolute inset-0 opacity-60">
                  <div className="absolute left-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
                  <div className="absolute right-[-7rem] bottom-[-7rem] h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
                </div>

                <div className="relative mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="sl-winners-kicker text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
                      Trusted results
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Celebrating Our Winners
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Recent wins from verified ticket buyers.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                    {winners.length} winners
                  </span>
                </div>

                <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {winners.map((winner, index) => {
                    const palette = [
                      "from-amber-400/30 to-orange-500/25",
                      "from-cyan-400/25 to-blue-500/25",
                      "from-emerald-400/25 to-lime-500/20",
                      "from-fuchsia-400/25 to-purple-500/25",
                      "from-sky-400/25 to-teal-500/20",
                    ];

                    return (
                      <WinnerCard
                        key={winner.image}
                        imageName={winner.image}
                        amount={winner.amount}
                        gradientClass={palette[index % palette.length]}
                        burstKey={
                          winnerBurst.image === winner.image
                            ? winnerBurst.key
                            : 0
                        }
                        onBurst={() => {
                          setWinnerBurst((current) => ({
                            image: winner.image,
                            key: current.key + 1,
                          }));
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            </section>
          </div>
        </div>
      </main>
      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onAuthed={(user) => {
          setAuthUser(user);
          const params = new URLSearchParams(window.location.search);
          const next = params.get("next");
          if (next) router.push(next);
          else setProfileOpen(true);
        }}
      />
      <ProfilePanel
        open={profileOpen}
        user={authUser}
        onClose={() => setProfileOpen(false)}
        onUserUpdated={updateAuthedUser}
      />
    </div>
  );
}
