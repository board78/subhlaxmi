import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * GET /api/results
 * Public endpoint — returns latest declared draw results.
 */
export async function GET() {
  try {
    const db = await getDb();
    const results = await db
      .collection("draw_results")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "winnerUserId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { declaredAt: -1 } },
        { $limit: 20 }
      ])
      .toArray();

    return NextResponse.json({
      results: results.map((r) => ({
        id: r._id.toString(),
        drawName: r.drawName as string,
        winningTicket: r.winningTicket as string,
        prize: r.prize as string,
        winnerName: (r.winnerName as string | null) ?? null,
        winnerImage: r.user?.image || null,
        declaredAt: (r.declaredAt as Date).toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
