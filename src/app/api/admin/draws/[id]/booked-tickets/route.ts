import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid draw ID.", 400);

    const db = await getDb();
    
    // Fetch all tickets for this draw that have been sold, and join with users collection
    const tickets = await db.collection("tickets").aggregate([
      {
        $match: {
          drawId: new ObjectId(id),
          status: "sold"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "bookedBy",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user" // Only tickets with valid users
      },
      {
        $project: {
          _id: 1,
          number: 1,
          series: 1,
          userId: "$user._id",
          userName: "$user.name",
          userEmail: "$user.email",
          userImage: "$user.image"
        }
      },
      {
        $sort: { "userName": 1 }
      }
    ]).toArray();

    const formattedTickets = tickets.map(t => ({
      ticketId: t._id.toString(),
      ticketNumber: t.number,
      userId: t.userId.toString(),
      userName: t.userName,
      userEmail: t.userEmail,
      userImage: t.userImage || null
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load booked tickets.", 403);
  }
}
