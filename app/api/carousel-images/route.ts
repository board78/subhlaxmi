import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const images = await db
      .collection("carousel_images")
      .find()
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({
      images: images.map(img => ({
        id: img._id.toString(),
        url: img.url,
        order: img.order || 0,
      }))
    });
  } catch (error) {
    return NextResponse.json({ images: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return jsonError("Unauthorized", 401);
    }

    const { url, order } = await request.json();
    if (!url) {
      return jsonError("Image URL is required", 400);
    }

    const db = await getDb();
    const result = await db.collection("carousel_images").insertOne({
      url,
      order: order || 0,
      createdAt: new Date(),
    });

    return NextResponse.json({
      image: {
        id: result.insertedId.toString(),
        url,
        order: order || 0,
      }
    });
  } catch (error) {
    return jsonError("Failed to add image", 500);
  }
}
