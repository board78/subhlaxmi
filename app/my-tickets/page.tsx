"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import type { SafeUser } from "@/lib/auth";

type TicketInfo = {
  id: string;
  drawName: string;
  prize: string;
  drawTime: string;
  ticketNumber: string;
  status: "booked" | "draw_pending" | "won" | "lost";
  bookedAt: string;
};

export default function MyTicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profile
  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => (r.ok ? (await r.json() as { user: SafeUser }) : null))
      .then((d) => {
        if (d?.user) {
          setUser(d.user);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const r = await fetch("/api/tickets");
      if (r.ok) {
        const data = await r.json() as { tickets: TicketInfo[] };
        setTickets(data.tickets ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTickets();
  }, [user, fetchTickets]);

  const handleSignInClick = () => {
    router.push(`/?auth=signin&next=${encodeURIComponent("/my-tickets")}`);
  };

  const getStatusInfo = (status: TicketInfo["status"]) => {
    switch (status) {
      case "won":
        return { label: "Won 🏆", colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
      case "lost":
        return { label: "Lost", colorClass: "border-zinc-500/30 bg-zinc-500/5 text-zinc-400" };
      case "booked":
        return { label: "Confirmed", colorClass: "border-blue-500/30 bg-blue-500/10 text-blue-300" };
      case "draw_pending":
      default:
        return { label: "Draw Pending", colorClass: "border-amber-500/30 bg-amber-500/10 text-amber-300" };
    }
  };

  return (
    <div className="royal-surface royal-grid relative min-h-screen overflow-x-hidden bg-[#12040c] text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-orange-500/16 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-amber-300/12 blur-3xl" />
      </div>

      <Navbar
        user={user}
        onAuthChange={(newUser) => {
          setUser(newUser);
          if (!newUser) router.push("/");
        }}
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">My Tickets</h1>
            <p className="mt-1 text-sm text-zinc-400">View and track all your booked lottery tickets.</p>
          </div>
          {user && !loading && (
            <button
              type="button"
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
              className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>

        {/* Content area */}
        {!user ? (
          /* Sign-in required empty state */
          <div className="royal-panel flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#14070f]/90 p-8 py-16 text-center backdrop-blur-xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Sign in to view your tickets</h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              Please sign in with your Subhlaxmi account to access your ticket booking history and results.
            </p>
            <button
              type="button"
              onClick={handleSignInClick}
              className="sl-cta-gradient mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In Now
            </button>
          </div>
        ) : loading ? (
          /* Loading state */
          <div className="royal-panel flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#14070f]/90 p-8 py-16 text-center backdrop-blur-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            <p className="mt-3 text-sm text-zinc-400">Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          /* Booked tickets empty state */
          <div className="royal-panel flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#14070f]/90 p-8 py-16 text-center backdrop-blur-xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-500/20 bg-zinc-500/5 text-zinc-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">No tickets booked yet</h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              You haven&apos;t booked any lottery tickets yet. Join one of our active draws to win big rewards!
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="sl-cta-gradient mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Active Draws
            </button>
          </div>
        ) : (
          /* Tickets grid */
          <>
            <p className="mb-4 text-sm text-zinc-400">
              You have <span className="font-semibold text-amber-300">{tickets.length}</span> ticket{tickets.length !== 1 ? "s" : ""} booked.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket) => {
                const { label: statusLabel, colorClass: statusColorClass } = getStatusInfo(ticket.status);

                return (
                  <div
                    key={ticket.id}
                    className="royal-panel relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#1c0d17] to-[#12040c] p-6 shadow-xl transition hover:border-amber-500/20 hover:shadow-amber-900/20"
                  >
                    {/* Ticket notch decorators */}
                    <div className="absolute left-[-10px] top-[50%] h-5 w-5 -translate-y-1/2 rounded-full border-r border-white/10 bg-[#12040c]" />
                    <div className="absolute right-[-10px] top-[50%] h-5 w-5 -translate-y-1/2 rounded-full border-l border-white/10 bg-[#12040c]" />

                    {/* Top section: draw info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white">{ticket.drawName}</h3>
                        <p className="mt-0.5 text-xs text-zinc-400">{ticket.drawTime}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColorClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Mid section: ticket number */}
                    <div className="my-5 border-t border-dashed border-white/10 pt-5 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Ticket Number</p>
                      <p className="mt-2 font-mono text-xl font-bold tracking-widest text-amber-300">
                        {ticket.ticketNumber}
                      </p>
                    </div>

                    {/* Bottom section: prize and booked date */}
                    <div className="flex items-end justify-between border-t border-white/5 pt-4 text-xs">
                      <div>
                        <p className="text-zinc-500">Prize Pool</p>
                        <p className="mt-0.5 font-semibold text-zinc-200">{ticket.prize}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500">Booked On</p>
                        <p className="mt-0.5 text-zinc-300">
                          {new Date(ticket.bookedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
