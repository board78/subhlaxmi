import { NextResponse } from "next/server";
import { getRecentBookings } from "@/server/services/stats.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recentBookings = await getRecentBookings(5);
    return NextResponse.json({ success: true, data: recentBookings });
  } catch (error) {
    console.error("[RecentBookings API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch recent bookings" }, { status: 500 });
  }
}
