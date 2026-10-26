"use client";

import { useEffect } from "react";

/** Enforces dark theme on <html> on the client and clears any old light mode preference */
export function ThemeSync() {
  useEffect(() => {
    try {
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  return null;
}
