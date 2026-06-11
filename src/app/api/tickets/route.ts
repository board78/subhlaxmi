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

    // Query the payments collection where the user's purchased tickets are stored
    const payments = await db
      .collection("payments")
      .find({
        userId: userObjectId,
        status: { $ne: "failed" },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const mapped: any[] = [];

    for (const payment of payments) {
      if (!payment.cart || !payment.cart.items) continue;

      for (const item of payment.cart.items) {
        if (!item.ticketNumbers) continue;
        
        for (const ticketNumber of item.ticketNumbers) {
          mapped.push({
            id: `${payment._id}_${ticketNumber}`,
            drawName: item.drawName,
            prize: `₹${item.pricePerTicket} + GST`,
            drawTime: `${new Date(item.drawDate).toLocaleDateString("en-IN")} • ${item.drawTime}`,
            ticketNumber: ticketNumber,
            status: payment.status === "processed" || payment.status === "success" ? "booked" : "draw_pending",
            bookedAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
          });
        }
      }
    }

    return NextResponse.json({ tickets: mapped });
  } catch (error) {
    console.error("[/api/tickets GET] Error:", error);
    return jsonError("Unable to fetch tickets.", 500);
  }
}
