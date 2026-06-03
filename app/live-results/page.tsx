"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import type { SafeUser } from "@/lib/auth";
import type { LiveResult } from "@/lib/types";

export default function LiveResultsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [results, setResults] = useState<LiveResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch profile
  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => (r.ok ? (await r.json() as { user: SafeUser }) : null))
      .then((d) => {
        if (d?.user) {
          setUser(d.user);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live results
  useEffect(() => {
    setLoading(true);
    fetch("/api/results")
      .then(async (r) => (r.ok ? (await r.json() as { results: LiveResult[] }) : null))
      .then((d) => {
        if (d?.results) {
          setResults(d.results);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Filtered results based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const query = searchQuery.toLowerCase();
    return results.filter(
      (r) =>
        r.drawName.toLowerCase().includes(query) ||
        (r.winnerName && r.winnerName.toLowerCase().includes(query)) ||
        r.winningTicket.toLowerCase().includes(query)
    );
  }, [results, searchQuery]);

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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">draw outcomes</span>
              {results.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Updates
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Live Result Board</h1>
            <p className="mt-1 text-sm text-zinc-400">Track real-time draw declarations and verified lottery winners.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-xs shrink-0">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search draw name or ticket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400/50 focus:bg-white/[0.08]"
            />
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          /* Loading state */
          <div className="royal-panel mt-8 flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#14070f]/90 p-8 py-16 text-center backdrop-blur-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            <p className="mt-3 text-sm text-zinc-400">Fetching latest draw results...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          /* Empty state */
          <div className="royal-panel mt-8 flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#14070f]/90 p-8 py-16 text-center backdrop-blur-xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-500/20 bg-zinc-500/5 text-zinc-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">No results found</h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              {searchQuery ? "We couldn't find any results matching your search query. Try typing something else." : "No draw results have been declared yet. Please check back later."}
            </p>
          </div>
        ) : (
          /* Results Table / Cards */
          <div className="mt-8 space-y-4">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="royal-panel flex flex-col justify-between gap-4 rounded-[24px] border border-white/10 bg-[#14070f]/80 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:p-6"
              >
                <div className="flex items-start gap-4">
                  {/* Icon badge */}
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 sm:flex">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                      <path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{result.drawName}</h2>
                    {result.winnerName ? (
                      <div className="mt-1 flex items-center gap-2">
                        {result.winnerImage && (
                          <img
                            src={result.winnerImage}
                            alt={result.winnerName}
                            className="h-5 w-5 rounded-full object-cover border border-white/20"
                          />
                        )}
                        <span className="text-xs text-zinc-400">
                          Winner: <strong className="text-zinc-200">{result.winnerName}</strong>
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500">Verified Draw Result</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Winning Ticket</p>
                    <div className="mt-1 inline-block rounded-lg bg-amber-500/10 px-3 py-1 font-mono text-sm font-semibold tracking-wider text-amber-300 border border-amber-500/20">
                      {result.winningTicket}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Prize Amount</p>
                    <p className="mt-1 text-base font-bold text-emerald-400">{result.prize}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
