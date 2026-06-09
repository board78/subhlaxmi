import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type UserTicketDoc = {
  _id: ObjectId;
  userId: ObjectId;
  drawName: string;
  prize: string;
  drawTime: string;
  ticketNumber: string;
  status: "booked" | "draw_pending" | "won" | "lost";
  bookedAt: Date;
};

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return jsonError("Not signed in.", 401);

  try {
    const db = await getDb();
    const userObjectId = new ObjectId(user.id);

    // Query user-visible tickets (inserted by payment callback/status)
    // These are the tickets with userId, drawName, ticketNumber, prize fields
    const tickets = await db
      .collection<UserTicketDoc>("tickets")
      .find({
        userId: userObjectId,
        // Only fetch user-ticket docs (not the draw inventory tickets which have drawId+series fields)
        ticketNumber: { $exists: true },
        drawName: { $exists: true },
      })
      .sort({ bookedAt: -1 })
      .limit(100)
      .toArray();

    const mapped = tickets.map((t) => ({
      id: t._id.toString(),
      drawName: t.drawName,
      prize: t.prize,
      drawTime: t.drawTime,
      ticketNumber: t.ticketNumber,
      status: t.status,
      bookedAt: t.bookedAt instanceof Date ? t.bookedAt.toISOString() : t.bookedAt,
    }));

    return NextResponse.json({ tickets: mapped });
  } catch (error) {
    console.error("[/api/tickets GET] Error:", error);
    return jsonError("Unable to fetch tickets.", 500);
  }
}
