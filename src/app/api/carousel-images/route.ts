import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { optimizeImageUrl } from "@/server/services/carousel.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const images = await db
      .collection("carousel_images")
      .find()
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        images: images.map((img) => ({
          id: img._id.toString(),
          url: optimizeImageUrl(img.url),
          order: img.order || 0,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[carousel-images GET error]:", error);
    return NextResponse.json({ images: [], error: String(error) });
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

    revalidatePath("/");

    return NextResponse.json({
      image: {
        id: result.insertedId.toString(),
        url,
        order: order || 0,
      }
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to add image", 500);
  }
}
