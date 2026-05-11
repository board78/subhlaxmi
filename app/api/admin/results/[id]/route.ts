import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * PATCH  /api/admin/results/[id] — edit a declared result
 * DELETE /api/admin/results/[id] — remove a result
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid result ID.");

    const body = (await request.json()) as {
      winningTicket?: string;
      prize?: string;
      winnerName?: string;
    };

    const $set: Record<string, unknown> = {};
    if (body.winningTicket?.trim()) $set.winningTicket = body.winningTicket.trim().toUpperCase();
    if (body.prize?.trim()) $set.prize = body.prize.trim();
    if (typeof body.winnerName === "string") $set.winnerName = body.winnerName.trim() || null;

    if (!Object.keys($set).length) return jsonError("Nothing to update.");

    const db = await getDb();
    const result = await db
      .collection("draw_results")
      .updateOne({ _id: new ObjectId(id) }, { $set });

    if (result.matchedCount === 0) return jsonError("Result not found.", 404);

    return NextResponse.json({ message: "Result updated." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update result.", 403);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid result ID.");

    const db = await getDb();
    await db.collection("draw_results").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Result deleted." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to delete result.", 403);
  }
}
