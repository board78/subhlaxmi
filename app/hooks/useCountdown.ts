"use client";

import { useEffect, useMemo, useState } from "react";
import { msToCountdown, parseDrawDateTime } from "@/lib/utils";
import type { DrawSummaryPublic } from "@/lib/draws";

// ─── useCountdown ─────────────────────────────────────────────────────────────
// Ticks every second and returns the countdown and target date for the next
// scheduled draw. If no future draws are scheduled, it returns nextDraw as null.

export function useCountdown(draws: DrawSummaryPublic[]) {
  const [nextDraw, setNextDraw] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!draws || draws.length === 0) {
      setNextDraw(null);
      setRemaining(0);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();

      // Find the next upcoming draw from draws list
      const activeOrUpcoming = draws.filter(
        (d) => d.status === "active" || d.status === "upcoming"
      );

      const futureDraws = activeOrUpcoming
        .map((d) => {
          const targetDate = parseDrawDateTime(d.drawDate, d.drawTime);
          return { draw: d, targetDate };
        })
        .filter((item) => item.targetDate.getTime() > now.getTime());

      if (futureDraws.length === 0) {
        setNextDraw(null);
        setRemaining(0);
        return;
      }

      // Sort by targetDate ascending
      futureDraws.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

      const soonest = futureDraws[0].targetDate;
      setNextDraw(soonest);
      setRemaining(Math.max(0, soonest.getTime() - now.getTime()));
    }, 1000);

    return () => clearInterval(timer);
  }, [draws]);

  const countdown = useMemo(() => msToCountdown(remaining), [remaining]);

  return { countdown, nextDraw };
}