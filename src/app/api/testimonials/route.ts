import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SEED_TESTIMONIALS = [
  {
    name: "Priya",
    location: "Kochi",
    tag: "Verified",
    quote: "Booking was smooth and the draw timing felt clear. I love how the winner artwork builds trust before I tap buy.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    name: "Rahul",
    location: "Lucknow",
    tag: "5★ rated",
    quote: "The layout feels calm and readable. Small fonts on mobile still look crisp, and the countdown keeps me excited.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    name: "Sneha",
    location: "Surat",
    tag: "Happy buyer",
    quote: "The testimonial section feels festive without being loud. It is the kind of polish I expect from a premium app.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  }
];

export async function GET() {
  try {
    const db = await getDb();
    
    // Check if any testimonials exist
    const count = await db.collection("testimonials").countDocuments();
    
    if (count === 0) {
      // Auto-seed with default testimonials so dashboard is not empty on first run
      await db.collection("testimonials").insertMany(SEED_TESTIMONIALS);
    }
    
    const testimonials = await db
      .collection("testimonials")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      testimonials: testimonials.map(t => ({
        id: t._id.toString(),
        name: t.name,
        location: t.location,
        tag: t.tag || "Verified",
        quote: t.quote,
        createdAt: t.createdAt,
      }))
    });
  } catch (error) {
    console.error("GET /api/testimonials failed:", error);
    return NextResponse.json({ testimonials: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return jsonError("Unauthorized", 401);
    }

    const { name, location, tag, quote } = await request.json();
    
    if (!name || !location || !quote) {
      return jsonError("Name, Location, and Quote review text are required fields.", 400);
    }

    const db = await getDb();
    const result = await db.collection("testimonials").insertOne({
      name,
      location,
      tag: tag || "Verified",
      quote,
      createdAt: new Date(),
    });

    return NextResponse.json({
      testimonial: {
        id: result.insertedId.toString(),
        name,
        location,
        tag: tag || "Verified",
        quote,
      }
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to add testimonial", 500);
  }
}
