"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export type AdminSection = "overview" | "users" | "draws" | "results" | "blog";

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "User Management",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    id: "draws",
    label: "Draw Management",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: "results",
    label: "Results",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    id: "blog",
    label: "Blog",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
];

type Props = {
  active: AdminSection;
  onSelect: (s: AdminSection) => void;
  adminName: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function SidebarContent({ active, onSelect, adminName }: Pick<Props, "active" | "onSelect" | "adminName">) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b border-white/10 px-6 pb-5 pt-6">
        <Link href="/" className="group flex flex-col leading-none outline-none">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/90 transition group-hover:text-amber-300">
            Subhlaxmi
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Admin Control Panel
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/30 text-amber-200"
                  : "text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
              }`}
            >
              <span className={`transition ${isActive ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Badge */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-[#1a0900]">
            {adminName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-200">{adminName}</p>
            <p className="text-[10px] text-amber-400/80 font-medium">Super Admin</p>
          </div>
        </div>
        <Link
          href="/"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs font-semibold text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Back to Site
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar({ active, onSelect, adminName, mobileOpen, onMobileClose }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#100710] lg:flex">
        <SidebarContent active={active} onSelect={onSelect} adminName={adminName} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              key="mob-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#100710] lg:hidden"
            >
              <SidebarContent active={active} onSelect={(s) => { onSelect(s); onMobileClose(); }} adminName={adminName} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
