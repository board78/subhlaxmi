import { getDb } from "@/lib/mongodb";

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
 * Groups by `bookedBy` so the same user does not dominate all slots,
 * and looks up the draw name from the `draws` collection.
 */
export async function getRecentBookings(limit: number = 5): Promise<RecentBookingPublic[]> {
  try {
    const db = await getDb();
    
    const recentBookings = await db.collection("tickets").aggregate([
      { $match: { status: "sold", bookedBy: { $exists: true } } },
      { $sort: { bookedAt: -1 } },
      {
        $group: {
          _id: "$bookedBy",
          drawId: { $first: "$drawId" },
          bookedAt: { $max: "$bookedAt" },
          ticketCount: { $sum: 1 }
        }
      },
      { $sort: { bookedAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "draws",
          localField: "drawId",
          foreignField: "_id",
          as: "draw"
        }
      },
      { $unwind: { path: "$draw", preserveNullAndEmptyArrays: true } }
    ]).toArray();

    return recentBookings.map((b) => {
      const fullName = (b.user?.name as string) || "Lucky Player";
      const firstName = fullName.split(" ")[0];
      
      const cities = ["Mumbai", "Delhi", "Bangalore", "Pune", "Jaipur", "Ahmedabad", "Lucknow", "Surat"];
      const randomCity = cities[b.user._id.toString().charCodeAt(0) % cities.length];
      const drawName = (b.draw?.name as string) || (b.draw?.drawSeriesName as string) || "Subhlaxmi Special";

      return {
        id: `${b._id.toString()}_${b.bookedAt instanceof Date ? b.bookedAt.getTime() : Date.now()}`,
        name: firstName,
        city: randomCity,
        tickets: (b.ticketCount as number) || 1,
        drawName,
        bookedAt: b.bookedAt instanceof Date ? b.bookedAt.toISOString() : new Date().toISOString()
      };
    });
  } catch (err) {
    console.error("[stats.service getRecentBookings error]:", err);
    return [];
  }
}
