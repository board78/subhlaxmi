import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getDb();

    const results = await db
      .collection("image_results")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      results: results.map((r) => ({
        id: r._id.toString(),
        imageUrl: r.imageUrl,
        resultDate: r.resultDate,
        resultTime: r.resultTime,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load image results.", 403);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const { imageUrl, resultDate, resultTime } = body;

    if (!imageUrl || typeof imageUrl !== "string") return jsonError("Image URL is required.");
    if (!resultDate || typeof resultDate !== "string") return jsonError("Result date is required.");
    if (!resultTime || typeof resultTime !== "string") return jsonError("Result time is required.");

    const db = await getDb();
    
    const doc = {
      imageUrl,
      resultDate,
      resultTime,
      createdAt: new Date(),
      createdBy: new ObjectId(admin.id),
    };

    const result = await db.collection("image_results").insertOne(doc);

    return NextResponse.json({ id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to save image result.", 403);
  }
}
