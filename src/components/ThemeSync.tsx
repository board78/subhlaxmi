"use client";

import { useEffect } from "react";

/** Applies saved theme to <html> on the client — no inline scripts in layout (Next.js 16). */
export function ThemeSync() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const theme = stored === "light" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      if (!stored) localStorage.setItem("theme", "dark");
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return null;
}
