import { NextRequest, NextResponse } from "next/server";
import { getDrawById } from "@/lib/draws";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const draw = await getDrawById(id);
    if (!draw) return NextResponse.json({ error: "Draw not found." }, { status: 404 });
    return NextResponse.json({ draw });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load draw." },
      { status: 500 },
    );
  }
}
