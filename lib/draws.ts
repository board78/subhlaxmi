import { Db, ObjectId } from "mongodb";
import { getDb } from "./mongodb";

// ─── Documents ───────────────────────────────────────────────────────────────

export type DrawDoc = {
  _id: ObjectId;
  name: string;
  drawSeriesName?: string;  // base name for auto-renewal, e.g. "Subhlaxmi"
  drawNumber?: number;       // 1, 2, 3… auto-increments on renewal
  drawDate: Date;
  drawTime: string;
  activatesAt?: Date;        // draw goes "active" at this timestamp (midnight IST of drawDate)
  expiresAt?: Date;          // draw auto-closes here (activatesAt + 7 days)
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
  drawSeriesName?: string;
  drawNumber?: number;
  drawDate: string;
  drawTime: string;
  activatesAt: string;   // ISO — when draw goes active
  expiresAt: string;     // ISO — when draw expires
  prizeAmount?: string;
  pricePerTicket: number;
  series: string[];
  ticketPrefix: string;
  ticketRangeStart: number;
  ticketRangeEnd: number;
  status: string;        // computed effective status
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

// ─── Status computation ───────────────────────────────────────────────────────

/**
 * Computes the effective draw status from timestamps.
 * Stored "drawn" or "closed" always wins (manual overrides).
 * Legacy draws without activatesAt/expiresAt fall back to their stored status.
 */
export function computeDrawStatus(doc: DrawDoc): DrawDoc["status"] {
  // Manual overrides always take precedence
  if (doc.status === "drawn") return "drawn";
  if (doc.status === "closed") return "closed";

  // Legacy draws without timestamp fields — keep stored status
  if (!doc.activatesAt && !doc.expiresAt) return doc.status;

  const now = new Date();
  const activatesAt = doc.activatesAt ?? doc.drawDate;
  const expiresAt =
    doc.expiresAt ??
    new Date(activatesAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (now < activatesAt) return "upcoming";
  if (now < expiresAt) return "active";
  return "closed";
}

/** Returns activatesAt (with fallback to drawDate) */
function resolveActivatesAt(doc: DrawDoc): Date {
  return doc.activatesAt ?? doc.drawDate;
}

/** Returns expiresAt (with fallback to activatesAt + 7 days) */
function resolveExpiresAt(doc: DrawDoc): Date {
  if (doc.expiresAt) return doc.expiresAt;
  const a = resolveActivatesAt(doc);
  return new Date(a.getTime() + 7 * 24 * 60 * 60 * 1000);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDrawPublic(doc: DrawDoc): DrawPublic {
  return {
    id: doc._id.toString(),
    name: doc.name,
    drawSeriesName: doc.drawSeriesName,
    drawNumber: doc.drawNumber,
    drawDate: doc.drawDate.toISOString(),
    drawTime: doc.drawTime,
    activatesAt: resolveActivatesAt(doc).toISOString(),
    expiresAt: resolveExpiresAt(doc).toISOString(),
    prizeAmount: doc.prizeAmount,
    pricePerTicket: doc.pricePerTicket,
    series: doc.series,
    ticketPrefix: doc.ticketPrefix,
    ticketRangeStart: doc.ticketRangeStart,
    ticketRangeEnd: doc.ticketRangeEnd,
    status: computeDrawStatus(doc),
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

// ─── Auto-renewal ─────────────────────────────────────────────────────────────

/**
 * Finds draws that have expired (expiresAt ≤ now) and still have an active/upcoming
 * stored status. Marks them "closed" and creates the next numbered draw in the series.
 * Safe to call on every public read — idempotent (won't create duplicate successors).
 */
export async function renewExpiredDraws(db: Db): Promise<void> {
  const now = new Date();

  // Only auto-renew draws that have the new timestamp fields
  const expiredDraws = await db
    .collection<DrawDoc>("draws")
    .find({
      expiresAt: { $lte: now },
      status: { $nin: ["closed", "drawn"] },
      drawSeriesName: { $exists: true },
      drawNumber: { $exists: true },
    })
    .toArray();

  for (const draw of expiredDraws) {
    // Mark expired draw as closed
    await db
      .collection<DrawDoc>("draws")
      .updateOne({ _id: draw._id }, { $set: { status: "closed", updatedAt: now } });

    if (!draw.drawSeriesName || draw.drawNumber == null) continue;

    // Check if successor already exists
    const nextNumber = draw.drawNumber + 1;
    const successorExists = await db.collection<DrawDoc>("draws").findOne({
      drawSeriesName: draw.drawSeriesName,
      drawNumber: nextNumber,
    });

    if (!successorExists) {
      const activatesAt = draw.expiresAt!;
      const expiresAt = new Date(activatesAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      const newDraw: Omit<DrawDoc, "_id"> = {
        name: `${draw.drawSeriesName} #${nextNumber}`,
        drawSeriesName: draw.drawSeriesName,
        drawNumber: nextNumber,
        drawDate: activatesAt,
        drawTime: draw.drawTime,
        activatesAt,
        expiresAt,
        prizeAmount: draw.prizeAmount,
        pricePerTicket: draw.pricePerTicket,
        series: draw.series,
        ticketPrefix: draw.ticketPrefix,
        ticketRangeStart: draw.ticketRangeStart,
        ticketRangeEnd: draw.ticketRangeEnd,
        status: "upcoming",
        createdAt: now,
        updatedAt: now,
      };

      const result = await db
        .collection<DrawDoc>("draws")
        .insertOne(newDraw as DrawDoc);

      // Fire-and-forget ticket generation
      void generateTicketsForDraw(result.insertedId).catch(console.error);
    }
  }
}

// ─── Draw queries ─────────────────────────────────────────────────────────────

/** Returns draws that are currently active or upcoming (for public pages). */
export async function getActiveDraws(): Promise<DrawPublic[]> {
  const db = await getDb();
  await renewExpiredDraws(db);

  const now = new Date();
  const draws = await db
    .collection<DrawDoc>("draws")
    .find({
      $or: [
        // New schema: not yet expired and not manually ended
        { expiresAt: { $gt: now }, status: { $nin: ["closed", "drawn"] } },
        // Legacy draws without timestamp fields
        { expiresAt: { $exists: false }, status: { $in: ["active", "upcoming"] } },
      ],
    })
    .sort({ activatesAt: 1, drawDate: 1 })
    .toArray();

  return draws.map(toDrawPublic);
}

/** Returns draw summaries (with ticket counts) for public listing. */
export async function getActiveDrawSummaries(): Promise<DrawSummaryPublic[]> {
  const db = await getDb();
  await renewExpiredDraws(db);

  const now = new Date();
  const draws = await db
    .collection<DrawDoc>("draws")
    .find({
      $or: [
        { expiresAt: { $gt: now }, status: { $nin: ["closed", "drawn"] } },
        { expiresAt: { $exists: false }, status: { $in: ["active", "upcoming"] } },
      ],
    })
    .sort({ activatesAt: 1, drawDate: 1 })
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
          available: {
            $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
          },
        },
      },
    ])
    .toArray();

  const countMap = new Map<string, { total: number; available: number }>(
    counts.map((c) => [
      c._id.toString(),
      { total: c.total, available: c.available },
    ]),
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
  const doc = await db
    .collection<DrawDoc>("draws")
    .findOne({ _id: new ObjectId(id) });
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

  const [tickets, total, seriesStats, drawTotal, drawAvailable] =
    await Promise.all([
      db
        .collection<TicketDoc>("tickets")
        .find(query)
        .sort({ numericPart: 1 })
        .skip(skip)
        .limit(filter.limit)
        .toArray(),
      db.collection<TicketDoc>("tickets").countDocuments(query),
      getSeriesStats(oid, filter.series),
      db
        .collection<TicketDoc>("tickets")
        .countDocuments({ drawId: oid }),
      db
        .collection<TicketDoc>("tickets")
        .countDocuments({ drawId: oid, status: "available" }),
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

export async function getSeriesStats(
  drawId: ObjectId,
  series: string,
): Promise<SeriesStats> {
  const db = await getDb();

  const [total, available, lpSpecial] = await Promise.all([
    db
      .collection<TicketDoc>("tickets")
      .countDocuments({ drawId, series }),
    db
      .collection<TicketDoc>("tickets")
      .countDocuments({ drawId, series, status: "available" }),
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
      const result = await db
        .collection<TicketDoc>("tickets")
        .findOneAndUpdate(
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

  const draw = await db
    .collection<DrawDoc>("draws")
    .findOne({ _id: drawOid });
  const pricePerTicket = draw?.pricePerTicket ?? 0;
  const gst = Math.round(pricePerTicket * 0.18 * 100) / 100;
  const total =
    Math.round(booked.length * (pricePerTicket + gst) * 100) / 100;

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

  const matchQuery: Record<string, unknown> = {
    drawId: drawOid,
    status: "available",
  };
  if (series) matchQuery.series = series;

  const candidates = await db
    .collection<TicketDoc>("tickets")
    .aggregate<TicketDoc>([
      { $match: matchQuery },
      { $sample: { size: quantity * 2 } },
    ])
    .toArray();

  const numbers = candidates.slice(0, quantity).map((t) => t.number);
  return bookTicketsByNumbers(userId, drawId, numbers);
}

// ─── Ticket generation ────────────────────────────────────────────────────────

/**
 * Generates all tickets for a draw based on its configuration.
 * Idempotent — uses ordered:false and ignores duplicate key errors.
 */
export async function generateTicketsForDraw(
  drawId: string | ObjectId,
): Promise<number> {
  const oid = typeof drawId === "string" ? new ObjectId(drawId) : drawId;
  const db = await getDb();

  const draw = await db
    .collection<DrawDoc>("draws")
    .findOne({ _id: oid });
  if (!draw) throw new Error("Draw not found.");

  const { series, ticketPrefix, ticketRangeStart, ticketRangeEnd } = draw;
  const now = new Date();

  const rangeSize = Math.min(
    ticketRangeEnd - ticketRangeStart + 1,
    100_000,
  );
  const BATCH = 1_000;

  let inserted = 0;

  for (const s of series) {
    let batchStart = ticketRangeStart;
    while (batchStart <= ticketRangeEnd) {
      const batchEnd = Math.min(batchStart + BATCH - 1, ticketRangeEnd);
      const docs: Omit<TicketDoc, "_id">[] = [];

      for (let n = batchStart; n <= batchEnd; n++) {
        const isLpSpecial = n >= ticketRangeEnd - 99;
        docs.push({
          drawId: oid,
          series: s,
          number: `${ticketPrefix}-${s}-${n}`,
          numericPart: n,
          status: "available",
          category: isLpSpecial ? "lp_special" : "regular",
          createdAt: now,
        });
      }

      try {
        const result = await db
          .collection<TicketDoc>("tickets")
          .insertMany(docs as TicketDoc[], { ordered: false });
        inserted += result.insertedCount;
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          const be = err as { result?: { nInserted?: number } };
          inserted += be.result?.nInserted ?? 0;
        } else {
          throw err;
        }
      }

      batchStart = batchEnd + 1;
    }

    if (rangeSize >= 100_000) break;
  }

  return inserted;
}

// ─── Index setup ─────────────────────────────────────────────────────────────

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  const existingIndexes = await db
    .collection<TicketDoc>("tickets")
    .indexes();
  const hasOldNumberUnique = existingIndexes.some(
    (idx) => idx.name === "number_unique",
  );
  if (hasOldNumberUnique) {
    await db.collection<TicketDoc>("tickets").dropIndex("number_unique");
  }

  await db.collection<TicketDoc>("tickets").createIndexes([
    {
      key: { drawId: 1, series: 1, status: 1 },
      name: "draw_series_status",
    },
    {
      key: { drawId: 1, series: 1, category: 1 },
      name: "draw_series_category",
    },
    {
      key: { drawId: 1, number: 1 },
      name: "draw_number_unique",
      unique: true,
    },
    { key: { drawId: 1, bookedBy: 1 }, name: "draw_bookedby" },
    { key: { drawId: 1, numericPart: 1 }, name: "draw_numeric" },
  ]);

  await db.collection<DrawDoc>("draws").createIndexes([
    { key: { status: 1, drawDate: 1 }, name: "status_date" },
    { key: { expiresAt: 1, status: 1 }, name: "expires_status" },
    {
      key: { drawSeriesName: 1, drawNumber: 1 },
      name: "series_number",
      sparse: true,
    },
  ]);
}
