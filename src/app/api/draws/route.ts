import { NextResponse } from "next/server";
import { getActiveDrawSummaries } from "@/lib/draws";

// Cache for 30 seconds — draws change infrequently, no need to hit MongoDB on every request.
export const revalidate = 30;

export async function GET() {
  try {
    const draws = await getActiveDrawSummaries();
    return NextResponse.json({ draws });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load draws." },
      { status: 500 },
    );
  }
}
