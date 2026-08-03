"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
// import { FrameOverlay } from "@/components/FrameOverlay";
import { HeaderBar, type HeaderBarProps } from "@/components/HeaderBar";
import { ProfilePanel } from "@/components/ProfilePanel";
import { TicketBookingView } from "@/components/TicketBookingView";
import { siteCopy, type Language } from "@/app/siteCopy";
import type { SafeUser } from "@/lib/auth";
import type { DrawPublic } from "@/lib/draws";

export default function BookDrawPage() {
  const params = useParams();
  const drawId = params.drawId as string;
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const currentCopy = siteCopy[language];
  const [draw, setDraw] = useState<DrawPublic | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<SafeUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [profileOpen, setProfileOpen] = useState(false);

  const openAuth = (mode: "signin" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  useEffect(() => {
    const handleAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent<"signin" | "register">;
      openAuth(customEvent.detail);
    };
    window.addEventListener("open-auth-modal", handleAuthEvent);
    return () => window.removeEventListener("open-auth-modal", handleAuthEvent);
  }, []);

  const updateAuthedUser = useCallback((user: SafeUser | null) => {
    setAuthUser(user);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTimeout(() => {
      if (cancelled) return;
      setLoadError(null);
      setDraw(null);
    }, 0);

    fetch(`/api/draws/${drawId}`)
      .then(async (r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error("failed");
        return (await r.json()) as { draw: DrawPublic };
      })
      .then((data) => {
        if (cancelled) return;
        if (!data?.draw) setLoadError("notfound");
        else setDraw(data.draw);
      })
      .catch(() => {
        if (!cancelled) setLoadError("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [drawId]);

  useEffect(() => {
    if (draw) {
      import("react-facebook-pixel")
        .then((x) => x.default)
        .then((ReactPixel) => {
          ReactPixel.track("ViewContent", {
            content_name: draw.name,
            content_ids: [draw.id],
            content_type: "product",
            value: draw.pricePerTicket,
            currency: "INR",
          });
        })
        .catch(() => {});
    }
  }, [draw]);

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
    <div className="royal-surface royal-grid royal-frame relative h-[100dvh] max-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-orange-500/16 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-amber-300/12 blur-3xl" />
      </div>
      {/* <FrameOverlay /> */}

      <main className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#17060d]/90 backdrop-blur-xl">
          <div className="shrink-0">
            <HeaderBar {...headerBarProps} />
          </div>

          <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col overflow-hidden px-4 pb-3 pt-0 md:px-5 md:pb-4 lg:px-6 lg:pb-4">
            {loadError === "notfound" ? (
              <div className="royal-panel mt-4 rounded-[24px] border border-white/10 bg-[#14070f] p-8 text-center">
                <p className="text-lg font-semibold text-white">Draw not found</p>
                <p className="mt-2 text-sm text-zinc-400">This draw may be closed or the link is invalid.</p>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="sl-cta-gradient mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
                >
                  Back to home
                </button>
              </div>
            ) : loadError === "failed" ? (
              <div className="royal-panel mt-4 rounded-[24px] border border-white/10 bg-[#14070f] p-8 text-center">
                <p className="text-lg font-semibold text-white">Could not load draw</p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="mt-6 rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-zinc-200"
                >
                  Try again
                </button>
              </div>
            ) : !draw ? (
              <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-sm text-zinc-400">Loading draw…</p>
              </div>
            ) : (
              <TicketBookingView
                key={draw.id}
                draw={draw}
                user={authUser ? { id: authUser.id } : null}
                onNeedAuth={() => openAuth("signin")}
              />
            )}
          </div>
        </div>
      </main>

      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onAuthed={(user) => {
          setAuthUser(user);
          setAuthOpen(false);
          const params = new URLSearchParams(window.location.search);
          const next = params.get("next");
          if (next) router.push(next);
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
