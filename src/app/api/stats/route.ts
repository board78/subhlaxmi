import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Cache for 2 minutes — platform stats (user/winner/ticket counts) are approximate
// display values; no need to run 3 countDocuments() queries on every page load.
export const revalidate = 120;

/**
 * GET /api/stats
 * Public endpoint — returns dynamic platform overview stats.
 */
export async function GET() {
  try {
    const db = await getDb();

    const [totalUsers, totalWinners, ticketsSold] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("draw_results").countDocuments({ winnerName: { $exists: true, $ne: null } }),
      db.collection("tickets").countDocuments({ status: "sold" }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalWinners,
      ticketsSold,
    });
  } catch (error) {
    return NextResponse.json({
      totalUsers: 0,
      totalWinners: 0,
      ticketsSold: 0,
    });
  }
}
