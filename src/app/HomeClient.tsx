"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthModal } from "@/components/AuthModal";
import { HeaderBar, type HeaderBarProps } from "@/components/HeaderBar";
import { ProfilePanel } from "@/components/ProfilePanel";
import { LiveBookingToast } from "@/components/LiveBookingToast";
import { RightInsightColumn } from "@/components/RightInsightColumn";
import { WinnersSection } from "@/components/features/home/WinnersSection";
import { LiveResultsBoard } from "@/components/features/home/LiveResultsBoard";
import { UpiPromo } from "@/components/features/home/UpiPromo";
import { PopularDrawsSection } from "@/components/features/home/PopularDrawsSection";
import { VisitorCounter } from "@/components/VisitorCounter";
import { Footer } from "@/components/Footer";
import { VerticalImageCarousel } from "@/components/VerticalImageCarousel";

import { siteCopy, type Language } from "@/app/siteCopy";
import type { DrawSummaryPublic } from "@/lib/draws";
import type { LiveResult } from "@/lib/types";

import { useAuth } from "@/hooks/useAuth";
import { useCountdown } from "@/hooks/useCountdown";

type HomeClientProps = {
  initialDraws: DrawSummaryPublic[];
  initialResults: LiveResult[];
  initialStats: { totalUsers: number; totalWinners: number; ticketsSold: number } | null;
};

export function HomeClient({ initialDraws, initialResults, initialStats }: HomeClientProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const currentCopy = siteCopy[language];

  // Merge server-fetched stats into display copy
  const displayCopy = useMemo(() => {
    if (!initialStats) return currentCopy;
    return {
      ...currentCopy,
      stats: currentCopy.stats.map((s, index) => {
        if (index === 0) return { ...s, label: language === "hi" ? "सक्रिय खिलाड़ी" : "Active Players", value: initialStats.totalUsers, suffix: "" };
        if (index === 1) return { ...s, label: language === "hi" ? "विजेता" : "Winners", value: initialStats.totalWinners, suffix: "" };
        if (index === 2) return { ...s, label: language === "hi" ? "बिके हुए टिकट" : "Tickets Sold", value: initialStats.ticketsSold, suffix: "" };
        return s;
      }),
    };
  }, [currentCopy, initialStats, language]);

  // Auth + cart sync (client-only — needs localStorage + cookies)
  const { authUser, setAuthUser, updateAuthedUser } = useAuth();

  // Countdown from server-side draws data
  const { countdown, nextDraw } = useCountdown(initialDraws);

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

  const openAuth = (mode: "signin" | "register") => { setAuthMode(mode); setAuthOpen(true); };

  useEffect(() => {
    const handleAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent<"signin" | "register">;
      openAuth(customEvent.detail);
    };
    window.addEventListener("open-auth-modal", handleAuthEvent);
    return () => window.removeEventListener("open-auth-modal", handleAuthEvent);
  }, []);

  const openBookPage = (draw: DrawSummaryPublic) => router.push(`/book/${draw.id}`);

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
    <div className="royal-surface royal-grid royal-frame relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-orange-500/16 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-amber-300/12 blur-3xl" />
      </div>

      {/* SEO: Visually hidden H1 — readable by Google, invisible to users.
           Using sr-only pattern (not aria-hidden which Google ignores/penalizes) */}
      <h1 className="sr-only">Subhlaxmi Lottery — India&apos;s Trusted Online Lottery | Buy Tickets &amp; Live Results</h1>

      <main className="relative h-screen overflow-hidden">
        <div className="flex h-full flex-col bg-[#17060d]/90 backdrop-blur-xl">
          <HeaderBar {...headerBarProps} />

          <div className="mx-auto w-full max-w-[1800px] min-h-0 flex-1 px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
            <section className="hide-scrollbar h-full overflow-y-auto p-5 md:p-7">
              <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.2fr)_290px] xl:items-start">

                {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
                <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                  {/* Hero carousel — static import, no data needed */}
                  <section className="royal-panel royal-panel-strong sl-hero-outline relative w-full overflow-hidden rounded-[24px] border-2 border-amber-500/35 bg-transparent px-5 pb-3 pt-5 sm:rounded-[28px] sm:px-6 sm:pt-6">
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
                  </section>

                  {/* Popular draws — uses server-fetched data */}
                  <PopularDrawsSection
                    liveDraws={initialDraws}
                    language={language}
                    popularTitle={currentCopy.popularTitle}
                    buyTicketLabel={currentCopy.buyTicket}
                    onBuy={openBookPage}
                  />
                </div>

                {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
                <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                  <RightInsightColumn currentCopy={displayCopy} countdown={countdown} nextDraw={nextDraw} />

                  {/* Live results — uses server-fetched data */}
                  <LiveResultsBoard liveResults={initialResults} title={currentCopy.liveResultsTitle} />

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

              {/* Visitor counter */}
              <div className="mt-4 sm:mt-5">
                <VisitorCounter language={language} />
              </div>

              {/* Winners section */}
              <WinnersSection liveResults={initialResults} />

              {/* Footer */}
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
