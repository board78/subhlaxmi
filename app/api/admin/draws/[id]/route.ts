import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { deleteDrawWithCascade } from "@/lib/draw-cleanup";
import { getDb } from "@/lib/mongodb";
import type { DrawDoc } from "@/lib/draws";
import { ObjectId } from "mongodb";

/**
 * PUT    /api/admin/draws/[id] — update draw
 * DELETE /api/admin/draws/[id] — delete draw
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid draw ID.");

    const body = (await request.json()) as Partial<{
      name: string;
      drawDate: string;
      drawTime: string;
      pricePerTicket: number;
      series: string[];
      ticketPrefix: string;
      ticketRangeStart: number;
      ticketRangeEnd: number;
      status: string;
      prizeAmount: string;
    }>;

    const $set: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name?.trim()) $set.name = body.name.trim().slice(0, 120);
    if (body.drawDate) $set.drawDate = new Date(body.drawDate);
    if (body.drawTime?.trim()) $set.drawTime = body.drawTime.trim();
    if (typeof body.pricePerTicket === "number" && body.pricePerTicket > 0)
      $set.pricePerTicket = body.pricePerTicket;
    if (body.series?.length) $set.series = body.series.map((s) => s.toUpperCase().trim());
    if (body.ticketPrefix?.trim()) $set.ticketPrefix = body.ticketPrefix.trim().toUpperCase();
    if (typeof body.ticketRangeStart === "number") $set.ticketRangeStart = body.ticketRangeStart;
    if (typeof body.ticketRangeEnd === "number") $set.ticketRangeEnd = body.ticketRangeEnd;
    if (body.status && ["upcoming", "active", "closed", "drawn"].includes(body.status))
      $set.status = body.status;
    if (typeof body.prizeAmount === "string") 
      $set.prizeAmount = body.prizeAmount.trim() || undefined;

    const db = await getDb();
    const result = await db
      .collection<DrawDoc>("draws")
      .updateOne({ _id: new ObjectId(id) }, { $set });

    if (result.matchedCount === 0) return jsonError("Draw not found.", 404);

    return NextResponse.json({ message: "Draw updated successfully." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update draw.", 403);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid draw ID.");

    const result = await deleteDrawWithCascade(id);

    return NextResponse.json({
      message: "Draw deleted.",
      ticketsDeleted: result.ticketsDeleted,
      resultsDeleted: result.resultsDeleted,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unable to delete draw.";
    const status = msg.startsWith("Cannot delete") ? 409 : msg === "Draw not found." ? 404 : 403;
    return jsonError(msg, status);
  }
}
