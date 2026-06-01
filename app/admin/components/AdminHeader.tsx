"use client";

import type { AdminSection } from "./AdminSidebar";
import { ThemeToggle } from "../../components/ThemeToggle";

const SECTION_LABELS: Record<AdminSection, { title: string; subtitle: string }> = {
  overview: { title: "Dashboard Overview", subtitle: "Platform health at a glance" },
  users: { title: "User Management", subtitle: "View, edit and manage registered users" },
  draws: { title: "Draw Management", subtitle: "Create, edit and control lottery draws" },
  results: { title: "Results", subtitle: "Declare and view lottery results" },
  blog: { title: "Blog Management", subtitle: "Create, edit and manage blog posts" },
  carousel: { title: "Carousel Management", subtitle: "Manage homepage slider images" },
  testimonials: { title: "Testimonial Management", subtitle: "View, publish, edit and delete client reviews" },
};

type Props = {
  section: AdminSection;
  onMobileMenuOpen: () => void;
  language: "en" | "hi";
  onLanguageChange: (lang: "en" | "hi") => void;
};

export function AdminHeader({ section, onMobileMenuOpen, language, onLanguageChange }: Props) {
  const { title, subtitle } = SECTION_LABELS[section];

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] transition hover:bg-[var(--foreground)]/5 lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-[var(--foreground)] sm:text-xl">{title}</h1>
          <p className="truncate text-xs text-[var(--muted)]">{subtitle}</p>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle />
          
          {/* Admin indicator badge */}
          <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}
