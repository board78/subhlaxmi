// ── Server Component — No "use client" directive ──────────────────────────────
// Data is fetched on the server at request time (ISR revalidate strategy).
// The HomeClient component handles all interactive/client-side logic.

import { HomeClient } from "./HomeClient";

import type { DrawSummaryPublic } from "@/lib/draws";
import type { LiveResult } from "@/lib/types";

// ── Server-side data fetching ──────────────────────────────────────────────────
// Using internal service functions directly avoids the HTTP round-trip overhead.

async function fetchDraws(): Promise<DrawSummaryPublic[]> {
  try {
    // Import server service directly — no HTTP overhead
    const { getActiveDrawSummaries } = await import("@/server/services/draws.service");
    return await getActiveDrawSummaries();
  } catch {
    return [];
  }
}

async function fetchResults(): Promise<LiveResult[]> {
  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const results = await db
      .collection("draw_results")
      .aggregate([
        { $lookup: { from: "users", localField: "winnerUserId", foreignField: "_id", as: "user" } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "draws", localField: "drawId", foreignField: "_id", as: "draw" } },
        { $unwind: { path: "$draw", preserveNullAndEmptyArrays: true } },
        { $sort: { declaredAt: -1 } },
        { $limit: 20 },
      ])
      .toArray();

    return results.map((r) => ({
      id: r._id.toString(),
      drawName: r.drawName as string,
      drawNumber: (r.draw?.drawNumber as number | undefined) ?? undefined,
      winningTicket: r.winningTicket as string,
      prize: r.prize as string,
      winnerName: (r.winnerName as string | null) ?? null,
      winnerImage: r.user?.image || null,
      declaredAt: (r.declaredAt as Date).toISOString(),
    }));
  } catch {
    return [];
  }
}

async function fetchStats(): Promise<{ totalUsers: number; totalWinners: number; ticketsSold: number } | null> {
  try {
    const { getDb } = await import("@/lib/mongodb");
    const db = await getDb();
    const [totalUsers, totalWinners, ticketsSold] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("draw_results").countDocuments({ winnerName: { $exists: true, $ne: null } }),
      db.collection("tickets").countDocuments({ status: "sold" }),
    ]);
    return { totalUsers, totalWinners, ticketsSold };
  } catch {
    return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const revalidate = 30; // ISR: regenerate page every 30 seconds

export default async function Home() {
  // Fetch all data in parallel on the server — user sees pre-rendered HTML instantly.
  // No blank screen, no loading spinners, no client-side API waterfalls.
  const [draws, results, stats] = await Promise.all([
    fetchDraws(),
    fetchResults(),
    fetchStats(),
  ]);

  return (
    <HomeClient
      initialDraws={draws}
      initialResults={results}
      initialStats={stats}
    />
  );
}
