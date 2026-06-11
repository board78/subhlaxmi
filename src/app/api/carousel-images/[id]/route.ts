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
    await db.collection("carousel_images").deleteOne({ _id: new ObjectId(p.id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError("Failed to delete image", 500);
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
    const { order } = await request.json();
    
    if (typeof order !== "number") {
      return jsonError("Order must be a number", 400);
    }

    const db = await getDb();
    await db.collection("carousel_images").updateOne(
      { _id: new ObjectId(p.id) },
      { $set: { order } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError("Failed to update image", 500);
  }
}
