"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export function RegistrationPopup() {
  const { authUser } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const isAuthUrl = window.location.search.includes("auth=");
      const isAuthModalOpen = (window as any).isAuthModalOpen;
      
      if (!isAuthUrl && !isAuthModalOpen) {
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            if (data?.user) return; // User already signed in
          }
        } catch (e) {}
        setIsOpen(true);
      } else {
        startTimer(); // Try again later
      }
    }, 10000); // 10 seconds
  };

  useEffect(() => {
    // If user is logged in, don't show the popup and don't start the interval
    if (authUser) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsOpen(false);
      return;
    }

    startTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [authUser]);

  const handleClose = () => {
    setIsOpen(false);
    startTimer(); // Restart the timer after it's closed
  };

  const handleRegister = () => {
    setIsOpen(false);
    startTimer();
    const path = window.location.pathname;
    if (path === "/" || path.startsWith("/book/")) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: "register" }));
    } else {
      router.push("/?auth=register");
    }
  };

  const handleLogin = () => {
    setIsOpen(false);
    startTimer();
    const path = window.location.pathname;
    if (path === "/" || path.startsWith("/book/")) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: "signin" }));
    } else {
      router.push("/?auth=signin");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && !authUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="royal-panel relative w-full max-w-lg overflow-hidden rounded-[32px] border border-amber-300/20 bg-[#12040c] shadow-2xl shadow-amber-900/20"
          >
            {/* Ambient Glow */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[80px]" />

            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 z-[60] flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="relative z-10 flex flex-col items-center p-8 text-center sm:p-10">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/30 bg-amber-300/10 shadow-[0_0_40px_rgba(252,211,77,0.2)]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-300">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                </svg>
              </div>

              <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">
                Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Premium</span> Benefits
              </h2>
              
              <p className="mb-8 text-sm leading-relaxed text-zinc-300">
                Join thousands of winners today. Register now to participate in our exclusive Kuber Ka Khajana draws, track live results, and manage your tickets seamlessly.
              </p>

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleRegister}
                  className="flex-1 rounded-full sl-cta-gradient px-6 py-3.5 text-sm font-bold text-[#451a03] transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(252,211,77,0.3)]"
                >
                  Create Account
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 rounded-full border border-amber-200/30 bg-black/40 px-6 py-3.5 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-300/10 active:scale-95"
                >
                  Sign In
                </button>
              </div>
              
              <button
                onClick={handleClose}
                className="mt-6 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
