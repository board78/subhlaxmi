"use client";

import { useEffect, useMemo, useState } from "react";
import { msToCountdown, parseDrawDateTime } from "@/lib/utils";
import type { DrawSummaryPublic } from "@/lib/draws";

// ─── useCountdown ─────────────────────────────────────────────────────────────
// Ticks every second and returns the countdown and target date for the next
// scheduled draw. If no future draws are scheduled, it returns nextDraw as null.

export function useCountdown(draws: DrawSummaryPublic[]) {
  // 1. Find the soonest draw date
  const soonestDrawDate = useMemo(() => {
    if (!draws || draws.length === 0) return null;
    const now = new Date();
    const activeOrUpcoming = draws.filter(
      (d) => d.status === "active" || d.status === "upcoming"
    );
    const futureDraws = activeOrUpcoming
      .map((d) => ({ draw: d, targetDate: parseDrawDateTime(d.drawDate, d.drawTime) }))
      .filter((item) => item.targetDate.getTime() > now.getTime());
    if (futureDraws.length === 0) return null;
    futureDraws.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
    return futureDraws[0].targetDate;
  }, [draws]);

  const soonestDrawTime = soonestDrawDate ? soonestDrawDate.getTime() : null;

  // 2. Track remaining state
  const [remaining, setRemaining] = useState(0);

  // 3. Keep ticking every second
  useEffect(() => {
    if (!soonestDrawTime) {
      const t = setTimeout(() => setRemaining(0), 0);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setRemaining(Math.max(0, soonestDrawTime - Date.now()));
    }, 0);

    const timer = setInterval(() => {
      setRemaining(Math.max(0, soonestDrawTime - Date.now()));
    }, 1000);

    return () => {
      clearTimeout(t);
      clearInterval(timer);
    };
  }, [soonestDrawTime]);

  const countdown = useMemo(() => msToCountdown(remaining), [remaining]);

  return { countdown, nextDraw: soonestDrawDate };
}