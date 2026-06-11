"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Stats = {
  totalUsers: number;
  totalDraws: number;
  activeDraws: number;
  ticketsSold: number;
};

const CARD_CONFIG = [
  {
    key: "totalUsers" as keyof Stats,
    label: "Total Users",
    sublabel: "Registered accounts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
    gradient: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-400/25",
    accent: "text-blue-300",
    iconBg: "bg-blue-500/20 text-blue-300",
  },
  {
    key: "totalDraws" as keyof Stats,
    label: "Total Draws",
    sublabel: "All lottery draws",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    gradient: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-400/25",
    accent: "text-purple-300",
    iconBg: "bg-purple-500/20 text-purple-300",
  },
  {
    key: "activeDraws" as keyof Stats,
    label: "Active Draws",
    sublabel: "Live & upcoming draws",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    gradient: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-400/25",
    accent: "text-emerald-300",
    iconBg: "bg-emerald-500/20 text-emerald-300",
  },
  {
    key: "ticketsSold" as keyof Stats,
    label: "Tickets Sold",
    sublabel: "Across all draws",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
      </svg>
    ),
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-400/25",
    accent: "text-amber-300",
    iconBg: "bg-amber-500/20 text-amber-300",
  },
];

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toLocaleString("en-IN")}</>;
}

export function OverviewStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load stats.");
        return (await r.json()) as Stats;
      })
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error loading stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARD_CONFIG.map((cfg, i) => (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className={`rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.gradient} p-5`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {cfg.label}
                </p>
                <p className={`mt-2 text-3xl font-bold tabular-nums ${cfg.accent}`}>
                  {stats ? <AnimatedNumber value={stats[cfg.key]} /> : "—"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{cfg.sublabel}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
                {cfg.icon}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick info banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-200">Admin Control Panel</p>
            <p className="text-xs text-zinc-500">
              You have full access to manage all platform resources. Use with care.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
