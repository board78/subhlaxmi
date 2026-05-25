"use client";

import { useEffect, useState } from "react";
import { HeaderBar } from "./HeaderBar";
import { ProfilePanel } from "./ProfilePanel";
import { AuthModal } from "./AuthModal";
import type { SafeUser } from "@/lib/auth";

const defaultMenu = ["Home", "My Tickets", "Live Results", "Jackpots", "Rewards", "Support", "Blog"] as const;

interface NavbarProps {
  user?: SafeUser | null;
  onAuthChange?: (user: SafeUser | null) => void;
}

export function Navbar({ user, onAuthChange }: NavbarProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [showProfile, setShowProfile] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (auth === "signin" || auth === "register") {
      setTimeout(() => {
        setAuthMode(auth === "register" ? "register" : "signin");
        setShowAuth(true);
      }, 0);
    }
  }, []);

  const handleAuthSuccess = (newUser: SafeUser) => {
    setShowAuth(false);
    onAuthChange?.(newUser);
  };

  return (
    <>
      <HeaderBar
        heroTitle="Subhlaxmi"
        menu={[...defaultMenu]}
        signIn="Sign In"
        register="Register"
        language={language}
        onLanguageChange={setLanguage}
        authUser={user ?? null}
        onSignIn={() => {
          setAuthMode("signin");
          setShowAuth(true);
        }}
        onRegister={() => {
          setAuthMode("register");
          setShowAuth(true);
        }}
        onProfileClick={() => setShowProfile(true)}
      />

      {showProfile && user && (
        <ProfilePanel
          open={showProfile}
          user={user}
          onClose={() => setShowProfile(false)}
          onUserUpdated={(updated) => {
            onAuthChange?.(updated);
            if (!updated) setShowProfile(false);
          }}
        />
      )}

      {showAuth && (
        <AuthModal
          open={showAuth}
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
          onAuthed={handleAuthSuccess}
        />
      )}
    </>
  );
}
