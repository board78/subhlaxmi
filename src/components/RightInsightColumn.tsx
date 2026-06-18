"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CopyPack } from "@/app/siteCopy";
import { formatDrawTime } from "@/lib/utils";
import { Counter, TimeBox } from "./CounterAndTimeBox";
import { useTestimonials } from "@/hooks/useHomeData";

type Props = {
  currentCopy: CopyPack;
  countdown: { days: string; hours: string; minutes: string; seconds: string };
  nextDraw: Date | null;
};

export function RightInsightColumn({ currentCopy, countdown, nextDraw }: Props) {
  // SWR-backed testimonials — falls back to static copy; refreshes every 5 min in background
  const testimonials = useTestimonials(currentCopy.testimonials) as typeof currentCopy.testimonials;
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonialCanvasRef = useRef<HTMLCanvasElement>(null);
  const skipInitialConfetti = useRef(true);

  // Auto-rotate testimonials
  useEffect(() => {
    const id = window.setInterval(() => setActiveIndex((i) => (i + 1) % testimonials.length), 4200);
    return () => window.clearInterval(id);
  }, [testimonials.length]);

  // Confetti burst on testimonial change (skip the very first render)
  useEffect(() => {
    if (skipInitialConfetti.current) { skipInitialConfetti.current = false; return; }
    const canvas = testimonialCanvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const colors = ["#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309"];

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const fire = confetti.create(canvas, { resize: true, useWorker: true });
      fire({ particleCount: 52, spread: 56, startVelocity: 28, ticks: 100, gravity: 0.92, scalar: 0.85, origin: { x: 0.5, y: 0.48 }, colors });
      fire({ particleCount: 32, spread: 118, startVelocity: 38, ticks: 125, gravity: 0.78, scalar: 0.52, origin: { x: 0.5, y: 0.4 }, colors, shapes: ["circle"] });
    });

    return () => { cancelled = true; };
  }, [activeIndex]);

  const active = testimonials[activeIndex] || currentCopy.testimonials[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="royal-panel sl-insight-column flex w-full min-w-0 flex-col gap-3 rounded-[24px] border border-white/10 bg-[#140912] p-4 sm:gap-3.5 sm:rounded-[28px] sm:p-4"
    >
      {/* Goddess illustration */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-amber-300/15 bg-[radial-gradient(circle_at_top,rgba(255,191,36,0.08),transparent_50%),#1a0f14]">
        <Image src="/goddesslaxmi.png" alt="Goddess Laxmi illustration" fill priority sizes="(max-width: 1279px) 100vw, 320px" className="object-contain p-3 sm:p-3.5" />
      </div>

      {/* Testimonials */}
      <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border border-amber-300/12 bg-[#0c0812] px-3 py-3.5 sm:px-4 sm:py-4">
        <canvas ref={testimonialCanvasRef} className="pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden />

        <div className="relative z-[5] flex flex-col gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px]">{currentCopy.testimonialLabel}</p>
            <h3 className="mt-1 text-sm font-semibold leading-snug text-white sm:text-base">{currentCopy.testimonialTitle}</h3>
            <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500 sm:text-[11px]">{currentCopy.testimonialHelper}</p>
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
                  <p className="text-[11px] font-semibold text-white sm:text-xs">{active.name}</p>
                  <p className="text-[10px] text-zinc-500 sm:text-[11px]">{active.location}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-zinc-200 sm:text-[10px]">{active.tag}</span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-zinc-300 sm:text-xs sm:leading-relaxed">&quot;{active.quote}&quot;</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-1.5 pt-0.5">
            {testimonials.map((item, i) => (
              <button key={(item as { id?: string }).id ?? item.name} type="button" onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition sm:h-2 ${i === activeIndex ? "w-5 bg-amber-300 sm:w-6" : "w-1.5 bg-white/25 hover:bg-white/40"}`}
                aria-label={`Show testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px]">{currentCopy.statsTitle}</p>
        <div className="flex flex-col gap-2">
          {currentCopy.stats.map((item) => <Counter key={item.label} {...item} compact />)}
        </div>
      </div>

      {/* Countdown */}
      {nextDraw && (
        <div className="sl-mega-countdown rounded-2xl border border-amber-400/25 bg-gradient-to-br from-[#2a1810] via-[#1a0f0e] to-[#0f0908] px-3 py-3.5 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)] sm:px-4 sm:py-4">
          <p className="sl-countdown-kicker text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/90 sm:text-xs">{currentCopy.countdownTitle}</p>
          <div className="mt-2 flex gap-1.5 sm:gap-2">
            <TimeBox value={countdown.days} label={currentCopy.days} />
            <TimeBox value={countdown.hours} label={currentCopy.hrs} />
            <TimeBox value={countdown.minutes} label={currentCopy.mins} />
            <TimeBox value={countdown.seconds} label={currentCopy.secs} />
          </div>
          <p className="sl-countdown-foot mt-2 text-[10px] text-amber-100/75 sm:text-xs">{currentCopy.nextDrawAt} {formatDrawTime(nextDraw)}</p>
        </div>
      )}
    </motion.section>
  );
}
