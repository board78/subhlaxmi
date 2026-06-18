"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { CartNavButton } from "./CartNavButton";
import { ThemeToggle } from "./ThemeToggle";
import type { SafeUser } from "@/lib/auth";

function getHref(item: string) {
  const norm = item.toLowerCase().trim();
  if (norm === "home" || norm === "होम") return "/";
  if (norm === "my tickets" || norm === "मेरे टिकट") return "/my-tickets";
  if (norm === "live results" || norm === "लाइव रिजल्ट") return "/live-results";
  if (norm === "support" || norm === "सपोर्ट") return "/support";
  if (norm === "blog" || norm === "ब्लॉग") return "/blog";
  return "#";
}

export type HeaderBarProps = {
  heroTitle: string;
  governmentSubtitle?: string;
  menu: string[];
  signIn: string;
  register: string;
  language: "en" | "hi";
  onLanguageChange: (lang: "en" | "hi") => void;
  authUser: SafeUser | null;
  onSignIn: () => void;
  onRegister: () => void;
  onProfileClick: () => void;
};

export function HeaderBar({
  heroTitle,
  governmentSubtitle = "Government Lottery",
  menu,
  signIn,
  register,
  language,
  onLanguageChange,
  authUser,
  onSignIn,
  onRegister,
  onProfileClick,
}: HeaderBarProps) {
  const portalReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) closeDrawer();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const navLinkClass = (index: number, inDrawer: boolean) =>
    inDrawer
      ? `block rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition active:scale-[0.99] ${
          index === 0
            ? "bg-white/12 text-white"
            : "text-zinc-200 hover:bg-white/8 hover:text-white"
        }`
      : `rounded-full px-3 py-2 transition ${
          index === 0 ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
        }`;

  const drawerPortal = (
    <AnimatePresence>
      {drawerOpen ? (
        <>
          <motion.div
            key="drawer-backdrop"
            role="presentation"
            className="fixed inset-0 z-[100] bg-[#0a0408]/65 backdrop-blur-[3px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
          />
          <motion.aside
            id={drawerId}
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[20.5rem] flex-col border-l border-amber-500/20 bg-[#12070e] shadow-[-12px_0_48px_rgba(0,0,0,0.45)] lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-4 pt-5">
              <div className="min-w-0">
                <Image
                  src="/logo.png"
                  alt="Subhlaxmi Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:border-amber-400/35 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
                onClick={closeDrawer}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4">
              <nav className="flex flex-col gap-1" aria-label="Main">
                {menu.map((item, index) => {
                  const href = getHref(item);
                  return (
                    <a
                      key={item}
                      href={href}
                      className={navLinkClass(index, true)}
                      onClick={closeDrawer}
                    >
                      {item}
                    </a>
                  );
                })}
              </nav>

              <div className="mt-8">
                <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Language
                </p>
                <div className="sl-lang-switch mt-2 rounded-2xl border border-white/12 bg-black/25 p-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onLanguageChange("en")}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        language === "en"
                          ? "sl-lang-active bg-white text-zinc-900"
                          : "sl-lang-inactive text-zinc-300"
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange("hi")}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        language === "hi"
                          ? "sl-lang-active bg-white text-zinc-900"
                          : "sl-lang-inactive text-zinc-300"
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Account
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {authUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        onProfileClick();
                      }}
                      className="sl-header-profile-btn flex w-full items-center gap-3 rounded-2xl border border-amber-200/25 bg-amber-500/5 px-4 py-3.5 text-left text-zinc-100 transition hover:border-amber-200/40"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-orange-500 text-sm font-bold text-[#2d1400]">
                        {authUser.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{authUser.name}</span>
                        <span className="text-xs text-zinc-500">View profile</span>
                      </span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          closeDrawer();
                          onSignIn();
                        }}
                        className="w-full rounded-2xl border border-white/18 py-3.5 text-sm font-semibold text-zinc-100 transition hover:border-white/35"
                      >
                        {signIn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeDrawer();
                          onRegister();
                        }}
                        className="sl-cta-gradient w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {register}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-amber-500/20 bg-[#17060d]/95 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-2 sm:px-6 sm:py-2.5 lg:px-12 lg:py-3">
        {/* Mobile: brand + cart, theme, menu only */}
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Link
            href="/"
            aria-label="Subhlaxmi — go to home"
            className="sl-brand-lockup group flex min-w-0 flex-1 flex-col items-start leading-none rounded-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-0"
          >
            <Image
              src="/logo.png"
              alt="Subhlaxmi Logo"
              width={160}
              height={56}
              priority
              className="h-14 w-auto object-contain"
            />
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <CartNavButton />
            <ThemeToggle />
            <button
              type="button"
              className="sl-header-menu-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 text-zinc-100 transition hover:border-white/30 hover:bg-black/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              onClick={() => setDrawerOpen((o) => !o)}
            >
              <span className="flex w-5 flex-col gap-1.5" aria-hidden>
                <span
                  className={`block h-0.5 rounded-full bg-current transition-transform ${
                    drawerOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 rounded-full bg-current transition-opacity ${drawerOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`block h-0.5 rounded-full bg-current transition-transform ${
                    drawerOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Desktop: full bar */}
        <div className="hidden items-center justify-between gap-4 lg:flex">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label="Subhlaxmi — go to home"
              className="sl-brand-lockup group flex flex-col items-start leading-none rounded-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-0"
            >
              <Image
                src="/logo.png"
                alt="Subhlaxmi Logo"
                width={180}
                height={64}
                priority
                className="h-16 w-auto object-contain"
              />
            </Link>

            <nav className="flex items-center gap-2 text-xs font-semibold text-zinc-200" aria-label="Main">
              {menu.map((item, index) => {
                const href = getHref(item);
                return (
                  <a
                    key={item}
                    href={href}
                    className={navLinkClass(index, false)}
                  >
                    {item}
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="sl-lang-switch rounded-full border border-white/15 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => onLanguageChange("en")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  language === "en"
                    ? "sl-lang-active bg-white text-zinc-900"
                    : "sl-lang-inactive text-zinc-200"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange("hi")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  language === "hi"
                    ? "sl-lang-active bg-white text-zinc-900"
                    : "sl-lang-inactive text-zinc-200"
                }`}
              >
                हिं
              </button>
            </div>
            <CartNavButton />
            <ThemeToggle />
            {authUser ? (
              <button
                type="button"
                onClick={onProfileClick}
                className="sl-header-profile-btn flex items-center gap-2 rounded-full border border-amber-200/20 px-3 py-2 text-zinc-100 transition hover:border-amber-200/40"
              >
                <span className="sl-header-profile-avatar flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-orange-500 text-xs font-bold text-[#2d1400]">
                  {authUser.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate text-xs font-semibold sm:inline">
                  {authUser.name}
                </span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="sl-header-signin rounded-full border border-white/15 px-4 py-2 text-zinc-100 transition hover:border-white/30"
                >
                  {signIn}
                </button>
                <button
                  type="button"
                  onClick={onRegister}
                  className="sl-cta-gradient rounded-full px-4 py-2 font-semibold text-white transition hover:scale-[1.03]"
                >
                  {register}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {portalReady ? createPortal(drawerPortal, document.body) : null}
    </header>
  );
}
