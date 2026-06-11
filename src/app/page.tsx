"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ── External / project imports ────────────────────────────────────────────────
import { AuthModal } from "@/components/AuthModal";
// import { FrameOverlay } from "@/components/FrameOverlay";
import { HeaderBar, type HeaderBarProps } from "@/components/HeaderBar";
import { ProfilePanel } from "@/components/ProfilePanel";
import { PanelCorners } from "@/components/PanelCorners";
import { RightInsightColumn } from "@/components/RightInsightColumn";
import { VerticalImageCarousel } from "@/components/VerticalImageCarousel";
import { WinnerCard } from "@/components/WinnerCard";
import { DrawTicketCard } from "@/components/DrawTicketCard";
import { LiveBookingToast } from "@/components/LiveBookingToast";
import { VisitorCounter } from "@/components/VisitorCounter";
import { Footer } from "@/components/Footer";
import { WinnersSection } from "@/components/features/home/WinnersSection";
import { LiveResultsBoard } from "@/components/features/home/LiveResultsBoard";
import { UpiPromo } from "@/components/features/home/UpiPromo";
import { HeroCarouselSection } from "@/components/features/home/HeroCarouselSection";
import { PopularDrawsSection } from "@/components/features/home/PopularDrawsSection";

import { siteCopy, type Language } from "./siteCopy";
import { formatDrawNumber } from "@/lib/utils";
import type { DrawSummaryPublic } from "@/lib/draws";
import type { LiveResult } from "@/lib/types";

// ── Custom hooks ──────────────────────────────────────────────────────────────
import { useAuth } from "@/hooks/useAuth";
import { useCountdown } from "@/hooks/useCountdown";
import { useDraws, useResults, usePlatformStats } from "@/hooks/useHomeData";



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


  // ── Helpers ──────────────────────────────────────────────────────────────────

  const openAuth = (mode: "signin" | "register") => { setAuthMode(mode); setAuthOpen(true); };

  const openBookPage = (draw: DrawSummaryPublic) => router.push(`/book/${draw.id}`);



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
                  <HeroCarouselSection description={currentCopy.heroDescription} />

                  {/* Popular draws */}
                  <PopularDrawsSection
                    liveDraws={liveDraws}
                    language={language}
                    popularTitle={currentCopy.popularTitle}
                    buyTicketLabel={currentCopy.buyTicket}
                    onBuy={openBookPage}
                  />
                </div>

                {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
                <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                  <RightInsightColumn currentCopy={displayCopy} countdown={countdown} nextDraw={nextDraw} />

                  {/* Live results */}
                  <LiveResultsBoard liveResults={liveResults} title={currentCopy.liveResultsTitle} />

                  {/* UPI promo */}
                  <UpiPromo 
                    title={currentCopy.footerTitle}
                    description={currentCopy.footerDescription}
                    buttonText={currentCopy.footerButton}
                    authUser={authUser}
                    onOpenAuth={() => openAuth("signin")}
                  />
                </div>
              </div>

              {/* ── VISITOR COUNTER SECTION ───────────────────────────────── */}
              <div className="mt-4 sm:mt-5">
                <VisitorCounter language={language} />
              </div>

              {/* ── WINNERS SECTION ───────────────────────────────────────── */}
              <WinnersSection liveResults={liveResults} />

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
