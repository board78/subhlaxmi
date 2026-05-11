import { NextResponse } from "next/server";
import { getActiveDrawSummaries } from "@/lib/draws";

export const dynamic = "force-dynamic";

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
