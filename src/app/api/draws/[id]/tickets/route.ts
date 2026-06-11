import { NextRequest, NextResponse } from "next/server";
import { getTicketsForDraw } from "@/lib/draws";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sp = request.nextUrl.searchParams;

    const series = sp.get("series") ?? "A";
    const rawTab = sp.get("tab") ?? "available";
    const tab =
      rawTab === "lp_special" || rawTab === "special" || rawTab === "all"
        ? (rawTab as "lp_special" | "special" | "all")
        : "available";
    const search = sp.get("q") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const limit = Math.min(200, Math.max(20, parseInt(sp.get("limit") ?? "200", 10)));

    const result = await getTicketsForDraw(id, { series, tab, search, page, limit });
    if (!result) return NextResponse.json({ error: "Draw not found." }, { status: 404 });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load tickets." },
      { status: 500 },
    );
  }
}
