import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import type { DrawDoc, TicketDoc } from "./draws";

export type DeleteDrawResult = {
  ticketsDeleted: number;
  resultsDeleted: number;
};

export type OrphanCleanupResult = {
  drawCount: number;
  ticketsDeleted: number;
  resultsDeleted: number;
  dryRun: boolean;
};

/** Block delete when any ticket is sold or reserved; otherwise cascade-delete tickets + results, then the draw. */
export async function deleteDrawWithCascade(drawId: string | ObjectId): Promise<DeleteDrawResult> {
  const oid = typeof drawId === "string" ? new ObjectId(drawId) : drawId;
  const db = await getDb();

  const draw = await db.collection<DrawDoc>("draws").findOne({ _id: oid });
  if (!draw) throw new Error("Draw not found.");

  const blockedCount = await db.collection<TicketDoc>("tickets").countDocuments({
    drawId: oid,
    status: { $in: ["sold", "reserved"] },
  });

  if (blockedCount > 0) {
    throw new Error(
      `Cannot delete this draw: ${blockedCount} ticket${blockedCount === 1 ? " is" : "s are"} sold or reserved. Close the draw instead, or wait until bookings are cleared.`,
    );
  }

  const [ticketDel, resultDel] = await Promise.all([
    db.collection<TicketDoc>("tickets").deleteMany({ drawId: oid }),
    db.collection("draw_results").deleteMany({ drawId: oid }),
  ]);

  const drawDel = await db.collection<DrawDoc>("draws").deleteOne({ _id: oid });
  if (drawDel.deletedCount === 0) throw new Error("Draw not found.");

  return {
    ticketsDeleted: ticketDel.deletedCount,
    resultsDeleted: resultDel.deletedCount,
  };
}

/**
 * Remove tickets and draw_results whose drawId no longer exists in draws.
 * Uses a single $lookup aggregation (no large $nin arrays).
 */
export async function cleanupOrphanDrawData(dryRun = false): Promise<OrphanCleanupResult> {
  const db = await getDb();
  const drawCount = await db.collection<DrawDoc>("draws").countDocuments();

  const orphanTicketIds = await db
    .collection<TicketDoc>("tickets")
    .aggregate<{ _id: ObjectId }>([
      {
        $lookup: {
          from: "draws",
          localField: "drawId",
          foreignField: "_id",
          as: "_draw",
        },
      },
      { $match: { _draw: { $size: 0 } } },
      { $project: { _id: 1 } },
    ])
    .toArray();

  const orphanResultIds = await db
    .collection("draw_results")
    .aggregate<{ _id: ObjectId }>([
      {
        $lookup: {
          from: "draws",
          localField: "drawId",
          foreignField: "_id",
          as: "_draw",
        },
      },
      { $match: { _draw: { $size: 0 } } },
      { $project: { _id: 1 } },
    ])
    .toArray();

  if (dryRun) {
    return {
      drawCount,
      ticketsDeleted: orphanTicketIds.length,
      resultsDeleted: orphanResultIds.length,
      dryRun: true,
    };
  }

  const ticketIds = orphanTicketIds.map((d) => d._id);
  const resultIds = orphanResultIds.map((d) => d._id);

  let ticketsDeleted = 0;
  let resultsDeleted = 0;

  const BATCH = 5000;

  for (let i = 0; i < ticketIds.length; i += BATCH) {
    const batch = ticketIds.slice(i, i + BATCH);
    const r = await db.collection<TicketDoc>("tickets").deleteMany({ _id: { $in: batch } });
    ticketsDeleted += r.deletedCount;
  }

  for (let i = 0; i < resultIds.length; i += BATCH) {
    const batch = resultIds.slice(i, i + BATCH);
    const r = await db.collection("draw_results").deleteMany({ _id: { $in: batch } });
    resultsDeleted += r.deletedCount;
  }

  return { drawCount, ticketsDeleted, resultsDeleted, dryRun: false };
}
