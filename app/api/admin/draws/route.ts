import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { DrawDoc } from "@/lib/draws";
import { computeDrawStatus, generateTicketsForDraw } from "@/lib/draws";
import { ObjectId } from "mongodb";

/**
 * GET  /api/admin/draws — list ALL draws (all statuses, sorted newest first)
 * POST /api/admin/draws — create a new draw + auto-generate tickets
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getDb();

    const draws = await db
      .collection<DrawDoc>("draws")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const result = draws.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      drawSeriesName: d.drawSeriesName,
      drawNumber: d.drawNumber,
      drawDate: d.drawDate.toISOString(),
      drawTime: d.drawTime,
      activatesAt: (d.activatesAt ?? d.drawDate).toISOString(),
      expiresAt: d.expiresAt
        ? d.expiresAt.toISOString()
        : new Date(
            (d.activatesAt ?? d.drawDate).getTime() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
      prizeAmount: d.prizeAmount,
      pricePerTicket: d.pricePerTicket,
      series: d.series,
      ticketPrefix: d.ticketPrefix,
      ticketRangeStart: d.ticketRangeStart,
      ticketRangeEnd: d.ticketRangeEnd,
      status: computeDrawStatus(d),   // computed from timestamps
      storedStatus: d.status,         // raw DB value (for admin context)
      createdAt: d.createdAt.toISOString(),
    }));

    return NextResponse.json({ draws: result });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to load draws.",
      403,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getDb();

    const body = (await request.json()) as {
      drawSeriesName?: string;
      drawDate?: string;
      drawTime?: string;
      prizeAmount?: string;
      pricePerTicket?: number;
      series?: string[];
      ticketPrefix?: string;
      ticketRangeStart?: number;
      ticketRangeEnd?: number;
    };

    if (!body.drawSeriesName?.trim())
      return jsonError("Draw series name is required.");
    if (!body.drawDate) return jsonError("Draw date is required.");
    if (!body.drawTime?.trim()) return jsonError("Draw time is required.");
    if (typeof body.pricePerTicket !== "number" || body.pricePerTicket <= 0)
      return jsonError("Valid price per ticket is required.");
    if (!body.series?.length)
      return jsonError("At least one series is required.");
    if (!body.ticketPrefix?.trim())
      return jsonError("Ticket prefix is required.");
    if (
      typeof body.ticketRangeStart !== "number" ||
      typeof body.ticketRangeEnd !== "number" ||
      body.ticketRangeStart >= body.ticketRangeEnd
    )
      return jsonError("Valid ticket range is required.");

    const drawSeriesName = body.drawSeriesName.trim().slice(0, 100);

    // Auto-assign draw number: find highest existing number for this series + 1
    const lastInSeries = await db
      .collection<DrawDoc>("draws")
      .findOne(
        { drawSeriesName },
        { sort: { drawNumber: -1 }, projection: { drawNumber: 1 } },
      );
    const drawNumber = (lastInSeries?.drawNumber ?? 0) + 1;

    // Parse draw date as IST midnight (UTC+5:30)
    // "YYYY-MM-DD" + "T00:00:00+05:30" gives 00:00 IST = 18:30 UTC prev day
    const activatesAt = new Date(`${body.drawDate}T00:00:00+05:30`);
    const expiresAt = new Date(
      activatesAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    const now = new Date();
    const drawDoc: Omit<DrawDoc, "_id"> = {
      name: `${drawSeriesName} #${drawNumber}`,
      drawSeriesName,
      drawNumber,
      drawDate: activatesAt,
      drawTime: body.drawTime.trim().slice(0, 80),
      activatesAt,
      expiresAt,
      prizeAmount: body.prizeAmount?.trim().slice(0, 120) || undefined,
      pricePerTicket: body.pricePerTicket,
      series: body.series.map((s) => s.toUpperCase().trim()),
      ticketPrefix: body.ticketPrefix.trim().toUpperCase(),
      ticketRangeStart: Math.floor(body.ticketRangeStart),
      ticketRangeEnd: Math.floor(body.ticketRangeEnd),
      status: "upcoming",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<DrawDoc>("draws")
      .insertOne(drawDoc as DrawDoc);

    void generateTicketsForDraw(result.insertedId).catch(console.error);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ticketsQueued: true,
        drawNumber,
        name: drawDoc.name,
        activatesAt: activatesAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to create draw.",
      403,
    );
  }
}
