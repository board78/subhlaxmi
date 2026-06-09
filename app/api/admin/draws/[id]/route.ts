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
      startDate: string;    // YYYY-MM-DD IST
      startTime: string;    // HH:MM IST
      endDate: string;      // YYYY-MM-DD IST
      endTime: string;      // HH:MM IST
      drawTime: string;
      pricePerTicket: number;
      series: string[];
      ticketPrefix: string;
      ticketRangeStart: number;
      ticketRangeEnd: number;
      /** Any of the 4 statuses as manual override */
      status: string;
      prizeAmount: string;
    }>;

    const $set: Record<string, unknown> = { updatedAt: new Date() };

    if (body.drawSeriesName?.trim())
      $set.drawSeriesName = body.drawSeriesName.trim().slice(0, 100);

    // Handle start/end datetimes — parse IST datetime strings
    if (body.startDate && body.startTime) {
      const activatesAt = new Date(`${body.startDate}T${body.startTime}:00+05:30`);
      $set.activatesAt = activatesAt;
      $set.drawDate    = activatesAt; // keep drawDate in sync
    }
    if (body.endDate && body.endTime) {
      $set.expiresAt = new Date(`${body.endDate}T${body.endTime}:00+05:30`);
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

    // Manual status override — allow all 4 statuses
    const allowedStatuses = ["upcoming", "active", "closed", "drawn"];
    if (body.status && allowedStatuses.includes(body.status)) {
      $set.status = body.status;
    }

    const db = await getDb();
    const col = db.collection<DrawDoc>("draws");

    // When forcing upcoming/active: remove expiresAt+activatesAt so
    // computeDrawStatus() falls back to the stored status field.
    // IMPORTANT: delete from $set first — MongoDB disallows the same field
    // in both $set and $unset in a single operation.
    let matched = 0;
    if (body.status === "upcoming" || body.status === "active") {
      delete $set.expiresAt;
      delete $set.activatesAt;
      const r = await col.updateOne(
        { _id: new ObjectId(id) },
        { $set, $unset: { expiresAt: "", activatesAt: "" } },
      );
      matched = r.matchedCount;
    } else {
      const r = await col.updateOne({ _id: new ObjectId(id) }, { $set });
      matched = r.matchedCount;
    }

    if (matched === 0) return jsonError("Draw not found.", 404);

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
