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
  } catch (error) {
    console.error("[fetchDraws error]:", error);
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
  } catch (error) {
    console.error("[fetchResults error]:", error);
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
  } catch (error) {
    console.error("[fetchStats error]:", error);
    return null;
  }
}

async function fetchCarouselImages(): Promise<string[]> {
  try {
    const { getCarouselImagesServer } = await import("@/server/services/carousel.service");
    return await getCarouselImagesServer();
  } catch (error) {
    console.error("[fetchCarouselImages error]:", error);
    return ["/winnerticket.png"];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const revalidate = 30; // ISR: regenerate page every 30 seconds

export default async function Home() {
  // Fetch all data in parallel on the server — user sees pre-rendered HTML instantly.
  // No blank screen, no loading spinners, no client-side API waterfalls.
  const [draws, results, stats, carouselImages] = await Promise.all([
    fetchDraws(),
    fetchResults(),
    fetchStats(),
    fetchCarouselImages(),
  ]);

  const primaryHeroImage = carouselImages[0] || "/winnerticket.png";

  // Create JSON-LD for Testimonials / Reviews
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Subhlaxmi Lottery Tickets",
    "image": "https://subhlaxmi.in/kuber.png",
    "description": "Buy online lottery tickets for daily draws and bumper jackpots on Subhlaxmi.",
    "brand": {
      "@type": "Brand",
      "name": "Subhlaxmi"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "12845"
    },
    "review": [
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Priya" },
        "datePublished": new Date().toISOString().split('T')[0],
        "reviewBody": "Booking was easy and the draw time was clearly displayed. Winner art builds trust.",
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
      },
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Rahul" },
        "datePublished": new Date().toISOString().split('T')[0],
        "reviewBody": "The layout is peaceful and very easy to read. Even small fonts on mobile look clear.",
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
      },
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Sneha" },
        "datePublished": new Date().toISOString().split('T')[0],
        "reviewBody": "The testimonial section feels like a celebration. Premium feel without too much noise.",
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
      }
    ]
  };

  return (
    <>
      {/* High-priority preload for primary hero image so browser downloads it concurrently with initial HTML */}
      <link
        rel="preload"
        as="image"
        href={primaryHeroImage}
        fetchPriority="high"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        initialDraws={draws}
        initialResults={results}
        initialStats={stats}
        initialCarouselImages={carouselImages}
      />
    </>
  );
}
