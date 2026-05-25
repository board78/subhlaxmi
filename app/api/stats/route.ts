import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

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
