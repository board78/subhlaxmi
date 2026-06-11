import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return jsonError("Invalid result ID", 400);
    }

    const db = await getDb();
    const result = await db.collection("image_results").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return jsonError("Result not found", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to delete image result", 500);
  }
}
