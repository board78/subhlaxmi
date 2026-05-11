"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminSidebar, type AdminSection } from "./components/AdminSidebar";
import { AdminHeader } from "./components/AdminHeader";
import { OverviewStats } from "./components/OverviewStats";
import { UserManagement } from "./components/UserManagement";
import { DrawManagement } from "./components/DrawManagement";
import { ResultsManagement } from "./components/ResultsManagement";

type AuthUser = { name: string; email: string; role: string };

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [admin, setAdmin] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => (r.ok ? ((await r.json()) as { user: AuthUser }) : null))
      .then((d) => { if (d?.user) setAdmin(d.user); })
      .catch(() => {});
  }, []);

  const SECTION_CONTENT: Record<AdminSection, React.ReactNode> = {
    overview: <OverviewStats />,
    users: <UserManagement />,
    draws: <DrawManagement />,
    results: <ResultsManagement />,
  };

  return (
    <div className="flex min-h-screen bg-[#12040c] text-white">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-fuchsia-600/8 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-orange-500/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-400/6 blur-3xl" />
      </div>

      {/* Sidebar */}
      <AdminSidebar
        active={section}
        onSelect={setSection}
        adminName={admin?.name ?? "Admin"}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <AdminHeader
          section={section}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          language={language}
          onLanguageChange={setLanguage}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {SECTION_CONTENT[section]}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
