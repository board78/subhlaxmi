"use client";
import { useEffect, useState } from "react";
import { MdLightMode, MdDarkMode } from "react-icons/md";

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Default to dark mode, only change if explicitly set to light
    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = storedTheme === 'light' ? 'light' : 'dark';
    
    // Ensure dark mode is default
    if (!storedTheme) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
    
    setTimeout(() => setTheme(initialTheme), 0);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle-btn flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all duration-200 hover:bg-white/20"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <MdLightMode className="w-5 h-5 text-amber-300" />
      ) : (
        <MdDarkMode className="w-5 h-5 text-slate-700" />
      )}
    </button>
  );
}