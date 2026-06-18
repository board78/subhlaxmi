/**
 * SWR-based data hooks for client-side data fetching.
 * Benefits over raw useEffect:
 *   - Automatic deduplication (same URL fetched once even if 10 components use it)
 *   - Background revalidation on window focus
 *   - Automatic retry on error
 *   - Built-in loading / error states
 *
 * NOTE: Home page draws/results/stats now come from SSR (page.tsx).
 * These hooks are for any client-side refresh needed AFTER initial load.
 */

import useSWR from "swr";
import type { DrawSummaryPublic } from "@/lib/draws";
import type { LiveResult } from "@/lib/types";

// ── Generic fetcher ────────────────────────────────────────────────────────────
const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Fetch error: ${r.status}`);
    return r.json();
  });

// ── Draws ─────────────────────────────────────────────────────────────────────
export function useDraws(initialData?: DrawSummaryPublic[]) {
  const { data, error, isLoading } = useSWR<{ draws: DrawSummaryPublic[] }>(
    "/api/draws",
    fetcher,
    {
      fallbackData: initialData ? { draws: initialData } : undefined,
      revalidateOnFocus: false,      // draws don't change on tab focus
      refreshInterval: 60_000,       // refresh every 60s in background
      dedupingInterval: 30_000,      // don't refetch within 30s
    }
  );
  return {
    draws: data?.draws ?? initialData ?? [],
    isLoading,
    error,
  };
}

// ── Results ───────────────────────────────────────────────────────────────────
export function useResults(initialData?: LiveResult[]) {
  const { data, error, isLoading } = useSWR<{ results: LiveResult[] }>(
    "/api/results",
    fetcher,
    {
      fallbackData: initialData ? { results: initialData } : undefined,
      revalidateOnFocus: false,
      refreshInterval: 120_000,      // results declared infrequently
      dedupingInterval: 60_000,
    }
  );
  return {
    results: data?.results ?? initialData ?? [],
    isLoading,
    error,
  };
}

// ── Platform Stats ────────────────────────────────────────────────────────────
type PlatformStats = { totalUsers: number; totalWinners: number; ticketsSold: number };

export function usePlatformStats(initialData?: PlatformStats | null) {
  const { data, error, isLoading } = useSWR<PlatformStats>(
    "/api/stats",
    fetcher,
    {
      fallbackData: initialData ?? undefined,
      revalidateOnFocus: false,
      refreshInterval: 180_000,      // stats update slowly
      dedupingInterval: 120_000,
    }
  );
  return {
    stats: data ?? initialData ?? null,
    isLoading,
    error,
  };
}

// ── Testimonials ──────────────────────────────────────────────────────────────
export function useTestimonials(fallback: unknown[] = []) {
  const { data } = useSWR<{ testimonials: unknown[] }>(
    "/api/testimonials",
    fetcher,
    {
      fallbackData: fallback.length ? { testimonials: fallback } : undefined,
      revalidateOnFocus: false,
      refreshInterval: 300_000,      // testimonials rarely change — 5 min
      dedupingInterval: 300_000,
    }
  );
  return data?.testimonials ?? fallback;
}
