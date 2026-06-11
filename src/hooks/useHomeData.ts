import { useState, useEffect } from "react";
import type { DrawSummaryPublic } from "@/lib/draws";
import type { LiveResult } from "@/lib/types";

export function useDraws() {
  const [draws, setDraws] = useState<DrawSummaryPublic[]>([]);
  useEffect(() => {
    fetch("/api/draws")
      .then(async (r) => r.ok ? (await r.json() as { draws: DrawSummaryPublic[] }) : null)
      .then((d) => { if (d?.draws) setDraws(d.draws); })
      .catch(() => { });
  }, []);
  return draws;
}

export function useResults() {
  const [results, setResults] = useState<LiveResult[]>([]);
  useEffect(() => {
    fetch("/api/results")
      .then(async (r) => r.ok ? (await r.json() as { results: LiveResult[] }) : null)
      .then((d) => { if (d?.results) setResults(d.results); })
      .catch(() => { });
  }, []);
  return results;
}

export function usePlatformStats() {
  const [stats, setStats] = useState<{ totalUsers: number; totalWinners: number; ticketsSold: number } | null>(null);
  useEffect(() => {
    fetch("/api/stats")
      .then(async (r) => r.ok ? (await r.json() as { totalUsers: number; totalWinners: number; ticketsSold: number }) : null)
      .then((d) => { if (d) setStats(d); })
      .catch(() => { });
  }, []);
  return stats;
}
