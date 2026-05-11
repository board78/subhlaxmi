import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { DrawDoc } from "@/lib/draws";
import { generateTicketsForDraw } from "@/lib/draws";
import { ObjectId } from "mongodb";

/**
 * GET  /api/admin/draws — list ALL draws (all statuses)
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
      drawDate: d.drawDate.toISOString(),
      drawTime: d.drawTime,
      prizeAmount: d.prizeAmount,
      pricePerTicket: d.pricePerTicket,
      series: d.series,
      ticketPrefix: d.ticketPrefix,
      ticketRangeStart: d.ticketRangeStart,
      ticketRangeEnd: d.ticketRangeEnd,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    }));

    return NextResponse.json({ draws: result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load draws.", 403);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getDb();

    const body = (await request.json()) as {
      name?: string;
      drawDate?: string;
      drawTime?: string;
      prizeAmount?: string;
      pricePerTicket?: number;
      series?: string[];
      ticketPrefix?: string;
      ticketRangeStart?: number;
      ticketRangeEnd?: number;
      status?: string;
    };

    if (!body.name?.trim()) return jsonError("Draw name is required.");
    if (!body.drawDate) return jsonError("Draw date is required.");
    if (!body.drawTime?.trim()) return jsonError("Draw time is required.");
    if (typeof body.pricePerTicket !== "number" || body.pricePerTicket <= 0)
      return jsonError("Valid price per ticket is required.");
    if (!body.series?.length) return jsonError("At least one series is required.");
    if (!body.ticketPrefix?.trim()) return jsonError("Ticket prefix is required.");
    if (
      typeof body.ticketRangeStart !== "number" ||
      typeof body.ticketRangeEnd !== "number" ||
      body.ticketRangeStart >= body.ticketRangeEnd
    )
      return jsonError("Valid ticket range is required.");

    const now = new Date();
    const drawDoc: Omit<DrawDoc, "_id"> = {
      name: body.name.trim().slice(0, 120),
      drawDate: new Date(body.drawDate),
      drawTime: body.drawTime.trim().slice(0, 80),
      prizeAmount: body.prizeAmount?.trim().slice(0, 120) || undefined,
      pricePerTicket: body.pricePerTicket,
      series: body.series.map((s) => s.toUpperCase().trim()),
      ticketPrefix: body.ticketPrefix.trim().toUpperCase(),
      ticketRangeStart: Math.floor(body.ticketRangeStart),
      ticketRangeEnd: Math.floor(body.ticketRangeEnd),
      status: (["upcoming", "active", "closed", "drawn"].includes(body.status ?? "")
        ? body.status
        : "upcoming") as DrawDoc["status"],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<DrawDoc>("draws").insertOne(drawDoc as DrawDoc);

    // Auto-generate tickets in background (fire and respond; large ranges are batched)
    void generateTicketsForDraw(result.insertedId).catch(console.error);

    return NextResponse.json(
      { id: result.insertedId.toString(), ticketsQueued: true, ...drawDoc },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create draw.", 403);
  }
}
