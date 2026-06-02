"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ── External / project imports ────────────────────────────────────────────────
import { AuthModal } from "./components/AuthModal";
// import { FrameOverlay } from "./components/FrameOverlay";
import { HeaderBar, type HeaderBarProps } from "./components/HeaderBar";
import { ProfilePanel } from "./components/ProfilePanel";
import { PanelCorners } from "./components/PanelCorners";
import { RightInsightColumn } from "./components/RightInsightColumn";
import { VerticalImageCarousel } from "./components/VerticalImageCarousel";
import { WinnerCard } from "./components/WinnerCard";
import { DrawTicketCard } from "./components/DrawTicketCard";
import { LiveBookingToast } from "./components/LiveBookingToast";
import { VisitorCounter } from "./components/VisitorCounter";
import { Footer } from "./components/Footer";
import { FaTrophy } from "react-icons/fa6";

import { siteCopy, type Language } from "./siteCopy";
import type { DrawSummaryPublic } from "@/lib/draws";
import type { LiveResult } from "@/lib/types";

// ── Custom hooks ──────────────────────────────────────────────────────────────
import { useAuth } from "./hooks/useAuth";
import { useCountdown } from "./hooks/useCountdown";

// ── Data-fetching hooks (inline for brevity – move out if they grow) ──────────

function useDraws() {
  const [draws, setDraws] = useState<DrawSummaryPublic[]>([]);
  useEffect(() => {
    fetch("/api/draws")
      .then(async (r) => r.ok ? (await r.json() as { draws: DrawSummaryPublic[] }) : null)
      .then((d) => { if (d?.draws) setDraws(d.draws); })
      .catch(() => { });
  }, []);
  return draws;
}

function useResults() {
  const [results, setResults] = useState<LiveResult[]>([]);
  useEffect(() => {
    fetch("/api/results")
      .then(async (r) => r.ok ? (await r.json() as { results: LiveResult[] }) : null)
      .then((d) => { if (d?.results) setResults(d.results); })
      .catch(() => { });
  }, []);
  return results;
}

function usePlatformStats() {
  const [stats, setStats] = useState<{ totalUsers: number; totalWinners: number; ticketsSold: number } | null>(null);
  useEffect(() => {
    fetch("/api/stats")
      .then(async (r) => r.ok ? (await r.json() as { totalUsers: number; totalWinners: number; ticketsSold: number }) : null)
      .then((d) => { if (d) setStats(d); })
      .catch(() => { });
  }, []);
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const currentCopy = siteCopy[language];

  // Live stats from Database
  const dynamicStats = usePlatformStats();

  const displayCopy = useMemo(() => {
    if (!dynamicStats) return currentCopy;
    return {
      ...currentCopy,
      stats: currentCopy.stats.map((s, index) => {
        if (index === 0) {
          return {
            ...s,
            label: language === "hi" ? "सक्रिय खिलाड़ी" : "Active Players",
            value: dynamicStats.totalUsers,
            suffix: "",
          };
        }
        if (index === 1) {
          return {
            ...s,
            label: language === "hi" ? "विजेता" : "Winners",
            value: dynamicStats.totalWinners,
            suffix: "",
          };
        }
        if (index === 2) {
          return {
            ...s,
            label: language === "hi" ? "बिके हुए टिकट" : "Tickets Sold",
            value: dynamicStats.ticketsSold,
            suffix: "",
          };
        }
        return s;
      }),
    };
  }, [currentCopy, dynamicStats, language]);

  // Auth + cart sync
  const { authUser, setAuthUser, updateAuthedUser } = useAuth();

  // Remote data
  const liveDraws = useDraws();
  const liveResults = useResults();

  // Countdown to next draw
  const { countdown, nextDraw } = useCountdown(liveDraws);

  // UI state
  const [authOpen, setAuthOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return ["signin", "register"].includes(new URLSearchParams(window.location.search).get("auth") ?? "");
  });
  const [authMode, setAuthMode] = useState<"signin" | "register">(() => {
    if (typeof window === "undefined") return "signin";
    return new URLSearchParams(window.location.search).get("auth") === "register" ? "register" : "signin";
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawsPage, setDrawsPage] = useState(1);
  const [winnerBurst, setWinnerBurst] = useState({ image: "", key: 0 });

  // ── Sorted Draws Logic ───────────────────────────────────────────────────────
  const sortedDraws = useMemo(() => {
    if (!liveDraws.length) return [];

    const active = liveDraws.filter(d => d.status === "active");
    const upcoming = [...liveDraws.filter(d => d.status === "upcoming")].sort((a, b) =>
      new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
    );
    const closed = liveDraws.filter(d => d.status === "closed");

    const nextUpcoming = upcoming.length > 0 ? upcoming[0] : null;
    const remainingUpcoming = upcoming.slice(1);

    const result = [];
    if (nextUpcoming) result.push(nextUpcoming);
    result.push(...active);
    result.push(...remainingUpcoming);
    result.push(...closed);

    return result;
  }, [liveDraws]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const openAuth = (mode: "signin" | "register") => { setAuthMode(mode); setAuthOpen(true); };

  const openBookPage = (draw: DrawSummaryPublic) => router.push(`/book/${draw.id}`);

  const totalPages = Math.max(1, Math.ceil(sortedDraws.length / 6));

  // ── Header props ─────────────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="royal-surface royal-grid royal-frame relative min-h-screen overflow-hidden bg-[#12040c] text-white">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-orange-500/16 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-amber-300/12 blur-3xl" />
      </div>
      {/* <FrameOverlay /> */}

      <main className="relative h-screen overflow-hidden">
        <div className="flex h-full flex-col bg-[#17060d]/90 backdrop-blur-xl">
          <HeaderBar {...headerBarProps} />

          <div className="mx-auto w-full max-w-[1800px] min-h-0 flex-1 px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
            <section className="hide-scrollbar h-full overflow-y-auto p-5 md:p-7">
              <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.2fr)_290px] xl:items-start">

                {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
                <div className="flex min-w-0 flex-col gap-3 sm:gap-4">

                  {/* Hero carousel */}
                  <motion.section
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="royal-panel royal-panel-strong sl-hero-outline relative w-full overflow-hidden rounded-[24px] border-2 border-amber-500/35 bg-transparent px-5 pb-3 pt-5 sm:rounded-[28px] sm:px-6 sm:pt-6"
                  >
                    {/* <PanelCorners /> */}
                    <div className="relative flex w-full flex-col items-center gap-4">
                      <div className="">
                        <VerticalImageCarousel className="p-0" intervalMs={3000} />
                      </div>
                      <div className="w-full max-w-4xl text-center">
                        <p className="mx-auto mt-4 max-w-3xl text-[10px] leading-4 font-medium text-[var(--foreground)] opacity-[0.92] sm:text-xs sm:leading-6 md:text-sm">
                          {currentCopy.heroDescription}
                        </p>
                      </div>
                    </div>
                  </motion.section>

                  {/* Popular draws */}
                  <section className="royal-panel rounded-[24px] border border-white/10 bg-[#14070f] p-4 sm:rounded-[28px] sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                      <h2 className="text-lg font-semibold sm:text-xl">{currentCopy.popularTitle}</h2>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">IST</span>
                    </div>

                    {sortedDraws.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
                        <p className="text-sm font-semibold text-zinc-400">No active draws available</p>
                        <p className="mt-1 text-xs text-zinc-600">New draws will appear here once activated by the admin.</p>
                      </div>
                    ) : (
                      <>
                        {/* <div className="grid items-start gap-4 md:grid-cols-2 max-w-[700px] mx-auto w-full"> */}
                        {/* <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full"> */}
                       <div className="grid items-start gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 w-full">
                          {sortedDraws.slice((drawsPage - 1) * 6, drawsPage * 6).map((draw, index) => (
                            <DrawTicketCard
                              key={draw.id}
                              draw={draw}
                              index={index}
                              language={language}
                              buyLabel={currentCopy.buyTicket}
                              onBuy={() => openBookPage(draw)}
                            />
                          ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                          <button type="button" onClick={() => setDrawsPage((p) => Math.max(1, p - 1))} disabled={drawsPage === 1}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
                            Previous
                          </button>
                          <span className="text-[11px] font-semibold text-zinc-500">Page {drawsPage} of {totalPages}</span>
                          <button type="button" onClick={() => setDrawsPage((p) => Math.min(totalPages, p + 1))} disabled={drawsPage >= totalPages}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                            Next
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                </div>

                {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
                <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                  <RightInsightColumn currentCopy={displayCopy} countdown={countdown} nextDraw={nextDraw} />

                  {/* Live results */}
                  <section className="sl-live-results-board royal-panel min-w-0 rounded-[24px] border border-white/10 bg-[#14070f] p-4 sm:rounded-[28px] sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold sm:text-xl">{currentCopy.liveResultsTitle}</h2>
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
                      ) : liveResults.map((result) => (
                        <motion.div key={result.id} whileHover={{ x: 3 }} transition={{ duration: 0.16 }}
                          className="sl-live-result-row flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5 sm:py-3">
                          <div className="min-w-0 flex-1">
                            <span className="sl-live-result-label block truncate text-sm font-medium text-zinc-200">{result.drawName}</span>
                            {result.winnerName && <span className="block truncate text-[10px] text-zinc-500">Winner: {result.winnerName}</span>}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="sl-ticket-pill rounded-full px-3 py-1 font-mono text-xs font-semibold tabular-nums shadow-sm">{result.winningTicket}</span>
                            <span className="text-[10px] font-semibold text-emerald-400">{result.prize}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* UPI promo */}
                  <motion.section whileHover={{ y: -3 }} transition={{ duration: 0.18 }}
                    className="royal-panel sl-upi-promo rounded-[24px] border border-orange-300/15 bg-gradient-to-r from-[#582313] via-[#8a2b13] to-[#d37b13] p-4 sm:rounded-[28px] sm:p-5">
                    <p className="sl-upi-kicker text-[11px] uppercase tracking-[0.18em] text-orange-100/85 sm:text-xs">UPI • Instant results</p>
                    <h2 className="sl-upi-title mt-2 max-w-lg text-xl font-semibold leading-snug sm:mt-3 sm:text-2xl">{currentCopy.footerTitle}</h2>
                    {currentCopy.footerDescription && (
                      <p className="sl-upi-body mt-2 max-w-xl text-xs leading-6 text-orange-50/90 sm:text-sm sm:leading-7">{currentCopy.footerDescription}</p>
                    )}
                    {!authUser && (
                      <button type="button" onClick={() => openAuth("signin")}
                        className="sl-force-light-text mt-4 rounded-full border border-white/10 bg-[#180808] px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.03] sm:mt-5">
                        {currentCopy.footerButton}
                      </button>
                    )}
                  </motion.section>
                </div>
              </div>

              {/* ── VISITOR COUNTER SECTION ───────────────────────────────── */}
              <div className="mt-4 sm:mt-5">
                <VisitorCounter language={language} />
              </div>

              {/* ── WINNERS SECTION ───────────────────────────────────────── */}
              <section className="royal-panel sl-winners-section mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#14070f] p-5 sm:mt-5">
                <div className="pointer-events-none absolute inset-0 opacity-60">
                  <div className="absolute left-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
                  <div className="absolute right-[-7rem] bottom-[-7rem] h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
                </div>

                <div className="relative mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="sl-winners-kicker text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">Trusted results</p>
                    <h2 className="mt-2 text-xl font-semibold">Celebrating Our Winners</h2>
                    <p className="mt-1 text-xs text-zinc-500">Recent wins from verified ticket buyers.</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                    {liveResults.filter((r) => r.winnerName).length} winners
                  </span>
                </div>

                <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {liveResults.filter((r) => r.winnerName).slice(0, 5).map((winner, index) => {
                    const palette = [
                      "from-amber-400/30 to-orange-500/25", "from-cyan-400/25 to-blue-500/25",
                      "from-emerald-400/25 to-lime-500/20", "from-fuchsia-400/25 to-purple-500/25",
                      "from-sky-400/25 to-teal-500/20",
                    ];
                    return (
                      <WinnerCard
                        key={winner.id}
                        winnerName={winner.winnerName!}
                        imageUrl={winner.winnerImage}
                        amount={winner.prize}
                        gradientClass={palette[index % palette.length]}
                        burstKey={winnerBurst.image === winner.id ? winnerBurst.key : 0}
                        onBurst={() => setWinnerBurst((c) => ({ image: winner.id, key: c.key + 1 }))}
                      />
                    );
                  })}
                  {liveResults.filter((r) => r.winnerName).length === 0 && (
                    <div className="col-span-full py-16 text-center flex flex-col items-center justify-center">
                      <div className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.35)] p-4 bg-white/5 rounded-full border border-white/5 flex items-center justify-center">
                        <FaTrophy className="w-8 h-8" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-zinc-400">Winner results will appear here soon.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── FOOTER SECTION ────────────────────────────────────────── */}
              <Footer language={language} />
            </section>
          </div>
        </div>
      </main>

      <AuthModal
        open={authOpen} initialMode={authMode} onClose={() => setAuthOpen(false)}
        onAuthed={(user) => {
          setAuthUser(user);
          const next = new URLSearchParams(window.location.search).get("next");
          if (next) router.push(next); else setProfileOpen(true);
        }}
      />
      <ProfilePanel open={profileOpen} user={authUser} onClose={() => setProfileOpen(false)} onUserUpdated={updateAuthedUser} />
      <LiveBookingToast />
    </div>
  );
}