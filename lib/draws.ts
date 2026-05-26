import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

// ─── Documents ───────────────────────────────────────────────────────────────

export type DrawDoc = {
  _id: ObjectId;
  name: string;
  drawDate: Date;
  drawTime: string;
  prizeAmount?: string;
  pricePerTicket: number;
  series: string[];
  ticketPrefix: string;
  ticketRangeStart: number;
  ticketRangeEnd: number;
  status: "upcoming" | "active" | "closed" | "drawn";
  createdAt: Date;
  updatedAt: Date;
};

export type TicketDoc = {
  _id: ObjectId;
  drawId: ObjectId;
  series: string;
  number: string;
  numericPart: number;
  status: "available" | "sold" | "reserved";
  category: "regular" | "lp_special" | "special";
  bookedBy?: ObjectId;
  bookedAt?: Date;
  transactionId?: string;
  createdAt: Date;
};

// ─── Public (client-safe) shapes ─────────────────────────────────────────────

export type DrawPublic = {
  id: string;
  name: string;
  drawDate: string;
  drawTime: string;
  prizeAmount?: string;
  pricePerTicket: number;
  series: string[];
  ticketPrefix: string;
  ticketRangeStart: number;
  ticketRangeEnd: number;
  status: string;
};

export type DrawSummaryPublic = DrawPublic & {
  totalTickets: number;
  availableTickets: number;
};

export type TicketPublic = {
  id: string;
  number: string;
  numericPart: number;
  series: string;
  status: "available" | "sold";
  category: "regular" | "lp_special" | "special";
};

export type SeriesStats = {
  series: string;
  total: number;
  available: number;
  sold: number;
  lpSpecial: number;
};

export type BookingResult = {
  booked: TicketPublic[];
  failed: string[];
  total: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDrawPublic(doc: DrawDoc): DrawPublic {
  return {
    id: doc._id.toString(),
    name: doc.name,
    drawDate: doc.drawDate.toISOString(),
    drawTime: doc.drawTime,
    prizeAmount: doc.prizeAmount,
    pricePerTicket: doc.pricePerTicket,
    series: doc.series,
    ticketPrefix: doc.ticketPrefix,
    ticketRangeStart: doc.ticketRangeStart,
    ticketRangeEnd: doc.ticketRangeEnd,
    status: doc.status,
  };
}

function toTicketPublic(doc: TicketDoc): TicketPublic {
  return {
    id: doc._id.toString(),
    number: doc.number,
    numericPart: doc.numericPart,
    series: doc.series,
    status: doc.status === "sold" ? "sold" : "available",
    category: doc.category,
  };
}

// ─── Draw queries ─────────────────────────────────────────────────────────────

export async function getActiveDraws(): Promise<DrawPublic[]> {
  const db = await getDb();
  const draws = await db
    .collection<DrawDoc>("draws")
    .find({ status: { $in: ["active", "upcoming", "closed"] } })
    .sort({ drawDate: 1 })
    .toArray();
  return draws.map(toDrawPublic);
}

export async function getActiveDrawSummaries(): Promise<DrawSummaryPublic[]> {
  const db = await getDb();
  const draws = await db
    .collection<DrawDoc>("draws")
    .find({ status: { $in: ["active", "upcoming", "closed"] } })
    .sort({ drawDate: 1 })
    .toArray();

  const drawIds = draws.map((d) => d._id);
  const counts = await db
    .collection<TicketDoc>("tickets")
    .aggregate<{ _id: ObjectId; total: number; available: number }>([
      { $match: { drawId: { $in: drawIds } } },
      {
        $group: {
          _id: "$drawId",
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
        },
      },
    ])
    .toArray();

  const countMap = new Map<string, { total: number; available: number }>(
    counts.map((c) => [c._id.toString(), { total: c.total, available: c.available }]),
  );

  return draws.map((d) => {
    const base = toDrawPublic(d);
    const found = countMap.get(d._id.toString());
    return {
      ...base,
      totalTickets: found?.total ?? 0,
      availableTickets: found?.available ?? 0,
    };
  });
}

export async function getDrawById(id: string): Promise<DrawPublic | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection<DrawDoc>("draws").findOne({ _id: new ObjectId(id) });
  return doc ? toDrawPublic(doc) : null;
}

// ─── Ticket queries ───────────────────────────────────────────────────────────

type TicketsFilter = {
  series: string;
  tab: "available" | "lp_special" | "special" | "all";
  search?: string;
  page: number;
  limit: number;
};

export async function getTicketsForDraw(drawId: string, filter: TicketsFilter) {
  if (!ObjectId.isValid(drawId)) return null;
  const db = await getDb();
  const oid = new ObjectId(drawId);

  const query: Record<string, unknown> = { drawId: oid, series: filter.series };

  if (filter.tab === "available") {
    query.status = "available";
  } else if (filter.tab === "lp_special") {
    query.category = "lp_special";
  } else if (filter.tab === "special") {
    query.category = "special";
  }

  if (filter.search) {
    const num = parseInt(filter.search.replace(/\D/g, ""), 10);
    if (!isNaN(num)) {
      query.numericPart = { $gte: num, $lte: num + 99 };
    } else {
      query.number = { $regex: filter.search, $options: "i" };
    }
  }

  const skip = (filter.page - 1) * filter.limit;

  const [tickets, total, seriesStats, drawTotal, drawAvailable] = await Promise.all([
    db
      .collection<TicketDoc>("tickets")
      .find(query)
      .sort({ numericPart: 1 })
      .skip(skip)
      .limit(filter.limit)
      .toArray(),
    db.collection<TicketDoc>("tickets").countDocuments(query),
    getSeriesStats(oid, filter.series),
    db.collection<TicketDoc>("tickets").countDocuments({ drawId: oid }),
    db.collection<TicketDoc>("tickets").countDocuments({ drawId: oid, status: "available" }),
  ]);

  return {
    tickets: tickets.map(toTicketPublic),
    total,
    hasMore: skip + tickets.length < total,
    page: filter.page,
    stats: seriesStats,
    drawTotal,
    drawAvailable,
  };
}

export async function getSeriesStats(drawId: ObjectId, series: string): Promise<SeriesStats> {
  const db = await getDb();

  const [total, available, lpSpecial] = await Promise.all([
    db.collection<TicketDoc>("tickets").countDocuments({ drawId, series }),
    db.collection<TicketDoc>("tickets").countDocuments({ drawId, series, status: "available" }),
    db
      .collection<TicketDoc>("tickets")
      .countDocuments({ drawId, series, category: "lp_special" }),
  ]);

  return {
    series,
    total,
    available,
    sold: total - available,
    lpSpecial,
  };
}

// ─── Atomic booking ───────────────────────────────────────────────────────────

export async function bookTicketsByNumbers(
  userId: string,
  drawId: string,
  ticketNumbers: string[],
): Promise<BookingResult> {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(drawId)) {
    throw new Error("Invalid user or draw ID.");
  }
  if (!ticketNumbers.length || ticketNumbers.length > 100) {
    throw new Error("Select between 1 and 100 tickets.");
  }

  const db = await getDb();
  const userOid = new ObjectId(userId);
  const drawOid = new ObjectId(drawId);
  const bookedAt = new Date();

  const booked: TicketPublic[] = [];
  const failed: string[] = [];

  await Promise.all(
    ticketNumbers.map(async (number) => {
      const result = await db.collection<TicketDoc>("tickets").findOneAndUpdate(
        { number, drawId: drawOid, status: "available" },
        { $set: { status: "sold", bookedBy: userOid, bookedAt } },
        { returnDocument: "after" },
      );
      if (result) {
        booked.push(toTicketPublic(result));
      } else {
        failed.push(number);
      }
    }),
  );

  if (!booked.length) {
    throw new Error(
      "None of the selected tickets are available. Please refresh and choose different tickets.",
    );
  }

  const draw = await db.collection<DrawDoc>("draws").findOne({ _id: drawOid });
  const pricePerTicket = draw?.pricePerTicket ?? 0;
  const gst = Math.round(pricePerTicket * 0.18 * 100) / 100;
  const total = Math.round(booked.length * (pricePerTicket + gst) * 100) / 100;

  return { booked, failed, total };
}

export async function quickPickTickets(
  userId: string,
  drawId: string,
  quantity: number,
  series?: string,
): Promise<BookingResult> {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(drawId)) {
    throw new Error("Invalid user or draw ID.");
  }
  if (quantity < 1 || quantity > 100) {
    throw new Error("Quantity must be between 1 and 100.");
  }

  const db = await getDb();
  const drawOid = new ObjectId(drawId);

  const matchQuery: Record<string, unknown> = { drawId: drawOid, status: "available" };
  if (series) matchQuery.series = series;

  // Sample random available tickets
  const candidates = await db
    .collection<TicketDoc>("tickets")
    .aggregate<TicketDoc>([
      { $match: matchQuery },
      { $sample: { size: quantity * 2 } }, // fetch extra in case of race conditions
    ])
    .toArray();

  const numbers = candidates.slice(0, quantity).map((t) => t.number);
  return bookTicketsByNumbers(userId, drawId, numbers);
}

// ─── Ticket generation ────────────────────────────────────────────────────────

/**
 * Generates all tickets for a draw based on its configuration.
 * Each (series × range) combination creates a ticket document.
 * Idempotent — uses ordered:false and ignores duplicate key errors.
 * Returns the total number of tickets inserted.
 */
export async function generateTicketsForDraw(drawId: string | ObjectId): Promise<number> {
  const oid = typeof drawId === "string" ? new ObjectId(drawId) : drawId;
  const db = await getDb();

  const draw = await db.collection<DrawDoc>("draws").findOne({ _id: oid });
  if (!draw) throw new Error("Draw not found.");

  const { series, ticketPrefix, ticketRangeStart, ticketRangeEnd } = draw;
  const now = new Date();

  // Total tickets per series — guard against huge ranges (max 100 000)
  const rangeSize = Math.min(ticketRangeEnd - ticketRangeStart + 1, 100_000);
  const BATCH = 1_000;

  let inserted = 0;

  for (const s of series) {
    let batchStart = ticketRangeStart;
    while (batchStart <= ticketRangeEnd) {
      const batchEnd = Math.min(batchStart + BATCH - 1, ticketRangeEnd);
      const docs: Omit<TicketDoc, "_id">[] = [];

      for (let n = batchStart; n <= batchEnd; n++) {
        const numericPart = n;
        const number = `${ticketPrefix}-${s}-${n}`;

        // LP-special: last 100 numbers in range per series
        const isLpSpecial = n >= ticketRangeEnd - 99;
        const category: TicketDoc["category"] = isLpSpecial ? "lp_special" : "regular";

        docs.push({
          drawId: oid,
          series: s,
          number,
          numericPart,
          status: "available",
          category,
          createdAt: now,
        });
      }

      try {
        const result = await db.collection<TicketDoc>("tickets").insertMany(
          docs as TicketDoc[],
          { ordered: false },
        );
        inserted += result.insertedCount;
      } catch (err: unknown) {
        // BulkWriteError with code 11000 = duplicate key — safely skip those
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          // partial insert — count what was inserted
          const be = err as { result?: { nInserted?: number } };
          inserted += be.result?.nInserted ?? 0;
        } else {
          throw err;
        }
      }

      batchStart = batchEnd + 1;
    }

    // Safety guard against infinite loop for very large ranges
    if (rangeSize >= 100_000) break;
  }

  return inserted;
}

// ─── Index setup (called from seed script) ───────────────────────────────────

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  // Migration: old schema used a global unique index on `number` which prevents
  // multiple draws from sharing the same ticket numbers (e.g. SL-A-10001).
  // We need uniqueness per draw instead: (drawId, number).
  const existingIndexes = await db.collection<TicketDoc>("tickets").indexes();
  const hasOldNumberUnique = existingIndexes.some((idx) => idx.name === "number_unique");
  if (hasOldNumberUnique) {
    await db.collection<TicketDoc>("tickets").dropIndex("number_unique");
  }

  await db.collection<TicketDoc>("tickets").createIndexes([
    { key: { drawId: 1, series: 1, status: 1 }, name: "draw_series_status" },
    { key: { drawId: 1, series: 1, category: 1 }, name: "draw_series_category" },
    { key: { drawId: 1, number: 1 }, name: "draw_number_unique", unique: true },
    { key: { drawId: 1, bookedBy: 1 }, name: "draw_bookedby" },
    { key: { drawId: 1, numericPart: 1 }, name: "draw_numeric" },
  ]);

  await db.collection<DrawDoc>("draws").createIndexes([
    { key: { status: 1, drawDate: 1 }, name: "status_date" },
  ]);
}
