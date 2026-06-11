import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/admin/stats
 * Returns dashboard overview counts.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getDb();

    const [totalUsers, totalDraws, activeDraws, ticketsSold] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("draws").countDocuments(),
      db.collection("draws").countDocuments({ status: { $in: ["active", "upcoming"] } }),
      db.collection("tickets").countDocuments({ status: "sold" }),
    ]);

    return NextResponse.json({ totalUsers, totalDraws, activeDraws, ticketsSold });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load stats.", 403);
  }
}
