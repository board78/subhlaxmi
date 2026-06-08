import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { deleteDrawWithCascade } from "@/lib/draw-cleanup";
import { getDb } from "@/lib/mongodb";
import type { DrawDoc } from "@/lib/draws";
import { ObjectId } from "mongodb";

/**
 * PUT    /api/admin/draws/[id] — update draw (config edits + manual status override)
 * DELETE /api/admin/draws/[id] — delete draw + cascade
 *
 * Status notes:
 *  - "upcoming" / "active" are auto-computed from timestamps; do NOT store them manually.
 *  - Only "drawn" and "closed" can be manually forced via PUT { status }.
 *  - Sending status: "upcoming" or "active" is silently ignored to prevent confusion.
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
      drawSeriesName: string;
      drawDate: string;
      drawTime: string;
      pricePerTicket: number;
      series: string[];
      ticketPrefix: string;
      ticketRangeStart: number;
      ticketRangeEnd: number;
      /** Only "drawn" and "closed" accepted as manual overrides */
      status: string;
      prizeAmount: string;
    }>;

    const $set: Record<string, unknown> = { updatedAt: new Date() };

    if (body.drawSeriesName?.trim())
      $set.drawSeriesName = body.drawSeriesName.trim().slice(0, 100);
    if (body.drawDate) {
      // Re-parse with IST midnight when date changes
      const activatesAt = new Date(`${body.drawDate}T00:00:00+05:30`);
      const expiresAt = new Date(
        activatesAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      $set.drawDate = activatesAt;
      $set.activatesAt = activatesAt;
      $set.expiresAt = expiresAt;
    }
    if (body.drawTime?.trim()) $set.drawTime = body.drawTime.trim();
    if (typeof body.pricePerTicket === "number" && body.pricePerTicket > 0)
      $set.pricePerTicket = body.pricePerTicket;
    if (body.series?.length)
      $set.series = body.series.map((s) => s.toUpperCase().trim());
    if (body.ticketPrefix?.trim())
      $set.ticketPrefix = body.ticketPrefix.trim().toUpperCase();
    if (typeof body.ticketRangeStart === "number")
      $set.ticketRangeStart = body.ticketRangeStart;
    if (typeof body.ticketRangeEnd === "number")
      $set.ticketRangeEnd = body.ticketRangeEnd;
    if (typeof body.prizeAmount === "string")
      $set.prizeAmount = body.prizeAmount.trim() || undefined;

    // Only "drawn" and "closed" are allowed as manual status overrides
    if (body.status === "drawn" || body.status === "closed") {
      $set.status = body.status;
    }

    const db = await getDb();
    const result = await db
      .collection<DrawDoc>("draws")
      .updateOne({ _id: new ObjectId(id) }, { $set });

    if (result.matchedCount === 0) return jsonError("Draw not found.", 404);

    return NextResponse.json({ message: "Draw updated successfully." });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to update draw.",
      403,
    );
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
    const msg =
      error instanceof Error ? error.message : "Unable to delete draw.";
    const status = msg.startsWith("Cannot delete")
      ? 409
      : msg === "Draw not found."
        ? 404
        : 403;
    return jsonError(msg, status);
  }
}
