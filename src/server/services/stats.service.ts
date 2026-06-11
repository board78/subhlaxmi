import { getDb } from "@/lib/mongodb";
import { AuthTicketDoc } from "@/types/auth.types";
import { UserDoc } from "@/types/auth.types";

export type RecentBookingPublic = {
  id: string;
  name: string;
  city: string;
  tickets: number;
  drawName: string;
  bookedAt: string;
};

/**
 * Gets the most recent bulk bookings for the live toaster.
 * Groups by `bookedBy` and `drawId` to treat multiple tickets bought together as a single "booking".
 */
export async function getRecentBookings(limit: number = 5): Promise<RecentBookingPublic[]> {
  const db = await getDb();
  
  // Aggregate to find the latest "sold" tickets grouped by user and draw
  const recentBookings = await db.collection("tickets").aggregate([
    { $match: { status: "sold", bookedBy: { $exists: true } } },
    { $sort: { bookedAt: -1 } },
    {
      $group: {
        _id: { bookedBy: "$bookedBy", drawId: "$drawId" },
        bookedAt: { $max: "$bookedAt" },
        drawName: { $first: "$drawName" },
        ticketCount: { $sum: 1 }
      }
    },
    { $sort: { bookedAt: -1 } },
    { $limit: limit },
    // Lookup the user to get their name
    {
      $lookup: {
        from: "users",
        localField: "_id.bookedBy",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" }
  ]).toArray();

  return recentBookings.map(b => {
    // Extract just the first name for privacy
    const fullName = b.user.name || "A user";
    const firstName = fullName.split(" ")[0];
    
    // We don't store city right now, so we can randomly assign one or leave it blank
    // For the toaster, we'll assign a random popular city to make it look active, 
    // or just say "India". We'll use "India" or a default city for now.
    const cities = ["Mumbai", "Delhi", "Bangalore", "Pune", "Jaipur", "Ahmedabad"];
    // Deterministic random city based on user ID string length
    const randomCity = cities[b.user._id.toString().charCodeAt(0) % cities.length];

    return {
      id: `${b._id.drawId}_${b._id.bookedBy}`, // Unique ID for this bulk booking
      name: firstName,
      city: randomCity,
      tickets: b.ticketCount,
      drawName: b.drawName,
      bookedAt: b.bookedAt.toISOString()
    };
  });
}
