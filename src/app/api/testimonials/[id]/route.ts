import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return jsonError("Unauthorized", 401);
    }

    const p = await params;
    const db = await getDb();
    const result = await db.collection("testimonials").deleteOne({ _id: new ObjectId(p.id) });

    if (result.deletedCount === 0) {
      return jsonError("Testimonial not found", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/testimonials/[id] failed:", error);
    return jsonError("Failed to delete testimonial", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return jsonError("Unauthorized", 401);
    }

    const p = await params;
    const { name, location, tag, quote } = await request.json();
    
    if (!name || !location || !quote) {
      return jsonError("Name, Location, and Quote are required fields", 400);
    }

    const db = await getDb();
    const result = await db.collection("testimonials").updateOne(
      { _id: new ObjectId(p.id) },
      { 
        $set: { 
          name, 
          location, 
          tag: tag || "Verified", 
          quote,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return jsonError("Testimonial not found", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/testimonials/[id] failed:", error);
    return jsonError("Failed to update testimonial", 500);
  }
}
