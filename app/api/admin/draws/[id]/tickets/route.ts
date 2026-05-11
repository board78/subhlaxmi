import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { generateTicketsForDraw } from "@/lib/draws";
import type { DrawDoc, TicketDoc } from "@/lib/draws";
import { ObjectId } from "mongodb";

/**
 * GET  /api/admin/draws/[id]/tickets  — list tickets for a draw (admin, all statuses)
 * POST /api/admin/draws/[id]/tickets  — create single ticket
 * PUT  /api/admin/draws/[id]/tickets  — regenerate ALL tickets (deletes existing available ones)
 */

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid draw ID.");

    const db = await getDb();
    const oid = new ObjectId(id);
    const sp = request.nextUrl.searchParams;

    const series = sp.get("series") ?? undefined;
    const status = sp.get("status") ?? undefined; // available|sold|all
    const search = sp.get("q") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const limit = Math.min(500, Math.max(20, parseInt(sp.get("limit") ?? "200", 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { drawId: oid };
    if (series) query.series = series;
    if (status === "available" || status === "sold") query.status = status;
    if (search) {
      const num = parseInt(search.replace(/\D/g, ""), 10);
      if (!isNaN(num)) {
        query.numericPart = { $gte: num, $lte: num + 99 };
      } else {
        query.number = { $regex: search, $options: "i" };
      }
    }

    const [tickets, total, totalAll, availableAll, soldAll] = await Promise.all([
      db
        .collection<TicketDoc>("tickets")
        .find(query)
        .sort({ series: 1, numericPart: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<TicketDoc>("tickets").countDocuments(query),
      db.collection<TicketDoc>("tickets").countDocuments({ drawId: oid }),
      db.collection<TicketDoc>("tickets").countDocuments({ drawId: oid, status: "available" }),
      db.collection<TicketDoc>("tickets").countDocuments({ drawId: oid, status: "sold" }),
    ]);

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t._id.toString(),
        number: t.number,
        series: t.series,
        numericPart: t.numericPart,
        status: t.status,
        category: t.category,
        bookedAt: t.bookedAt?.toISOString() ?? null,
      })),
      total,
      hasMore: skip + tickets.length < total,
      page,
      summary: { total: totalAll, available: availableAll, sold: soldAll },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load tickets.", 403);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid draw ID.");

    const db = await getDb();
    const oid = new ObjectId(id);

    const draw = await db.collection<DrawDoc>("draws").findOne({ _id: oid });
    if (!draw) return jsonError("Draw not found.", 404);

    const body = (await request.json()) as {
      series?: string;
      number?: string;
      numericPart?: number;
      category?: string;
    };

    if (!body.series?.trim()) return jsonError("Series is required.");
    if (!body.number?.trim()) return jsonError("Ticket number is required.");
    if (typeof body.numericPart !== "number") return jsonError("Numeric part is required.");

    const category =
      body.category === "lp_special" || body.category === "special"
        ? (body.category as TicketDoc["category"])
        : "regular";

    const ticketDoc: Omit<TicketDoc, "_id"> = {
      drawId: oid,
      series: body.series.toUpperCase().trim(),
      number: body.number.toUpperCase().trim(),
      numericPart: body.numericPart,
      status: "available",
      category,
      createdAt: new Date(),
    };

    await db.collection<TicketDoc>("tickets").insertOne(ticketDoc as TicketDoc);
    return NextResponse.json({ message: "Ticket created." }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create ticket.", 403);
  }
}

/** PUT — regenerate all available tickets for the draw (keeps sold) */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid draw ID.");

    const db = await getDb();
    const oid = new ObjectId(id);

    // Delete only available tickets; keep sold ones
    await db.collection<TicketDoc>("tickets").deleteMany({ drawId: oid, status: "available" });

    const inserted = await generateTicketsForDraw(oid);
    return NextResponse.json({ message: "Tickets regenerated.", inserted });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to regenerate tickets.", 403);
  }
}
