"use client";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import type { SafeUser } from "@/lib/auth";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  const [user, setUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] ${className}`}>
      <Navbar user={user} onAuthChange={setUser} />
      {children}
    </div>
  );
}
