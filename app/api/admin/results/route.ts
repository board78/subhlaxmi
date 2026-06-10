import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ResultDoc = {
  _id: ObjectId;
  drawId: ObjectId;
  drawName: string;
  winningTicket: string;
  prize: string;
  winnerName: string;
  winnerUserId: ObjectId;
  declaredAt: Date;
  declaredBy: ObjectId;
};

/**
 * GET  /api/admin/results — list all declared results
 * POST /api/admin/results — declare a result
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getDb();

    const results = await db
      .collection("draw_results")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "winnerUserId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "draws",
            localField: "drawId",
            foreignField: "_id",
            as: "draw"
          }
        },
        {
          $unwind: {
            path: "$draw",
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { declaredAt: -1 } },
        { $limit: 50 }
      ])
      .toArray();

    return NextResponse.json({
      results: results.map((r) => ({
        id: r._id.toString(),
        drawId: r.drawId.toString(),
        drawName: r.drawName,
        drawNumber: (r.draw?.drawNumber as number | undefined) ?? undefined,
        winningTicket: r.winningTicket,
        prize: r.prize,
        winnerName: r.winnerName,
        winnerUserId: r.winnerUserId?.toString() || null,
        winnerImage: r.user?.image || null,
        declaredAt: r.declaredAt.toISOString(),
      })),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load results.", 403);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = (await request.json()) as {
      drawId?: string;
      winningTicket?: string;
      prize?: string;
      winnerName?: string;
      winnerUserId?: string;
    };

    if (!body.drawId || !ObjectId.isValid(body.drawId)) return jsonError("Valid draw ID is required.");
    if (!body.winningTicket?.trim()) return jsonError("Winning ticket number is required.");
    if (!body.prize?.trim()) return jsonError("Prize amount is required.");
    if (!body.winnerName?.trim() || !body.winnerUserId || !ObjectId.isValid(body.winnerUserId)) {
      return jsonError("Valid winner selection is required.");
    }

    const db = await getDb();
    const draw = await db.collection("draws").findOne({ _id: new ObjectId(body.drawId) });
    if (!draw) return jsonError("Draw not found.", 404);

    const now = new Date();
    const doc: Omit<ResultDoc, "_id"> = {
      drawId: new ObjectId(body.drawId),
      drawName: draw.name as string,
      winningTicket: body.winningTicket.trim().toUpperCase(),
      prize: body.prize.trim(),
      winnerName: body.winnerName.trim(),
      winnerUserId: new ObjectId(body.winnerUserId),
      declaredAt: now,
      declaredBy: new ObjectId(admin.id),
    };

    const result = await db.collection<ResultDoc>("draw_results").insertOne(doc as ResultDoc);

    // Mark the draw as "drawn"
    await db
      .collection("draws")
      .updateOne({ _id: new ObjectId(body.drawId) }, { $set: { status: "drawn", updatedAt: now } });

    return NextResponse.json({ id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to declare result.", 403);
  }
}
