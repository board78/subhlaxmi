import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get("date");
    const timeFilter = searchParams.get("time");

    const query: Record<string, any> = {};
    if (dateFilter) query.resultDate = dateFilter;
    if (timeFilter) query.resultTime = timeFilter;

    const db = await getDb();
    const results = await db
      .collection("image_results")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      results: results.map((r) => ({
        id: r._id.toString(),
        imageUrl: r.imageUrl,
        resultDate: r.resultDate,
        resultTime: r.resultTime,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
