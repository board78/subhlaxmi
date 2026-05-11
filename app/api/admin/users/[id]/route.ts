import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * PATCH /api/admin/users/[id]  — update role
 * DELETE /api/admin/users/[id] — delete user
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid user ID.");

    const body = (await request.json()) as { role?: string };
    if (!body.role || !["user", "admin"].includes(body.role)) {
      return jsonError("Role must be 'user' or 'admin'.");
    }

    // Prevent self-demotion
    if (id === admin.id && body.role !== "admin") {
      return jsonError("You cannot remove your own admin role.");
    }

    const db = await getDb();
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: { role: body.role, updatedAt: new Date() } });

    return NextResponse.json({ message: "User role updated." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update user.", 403);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    if (!ObjectId.isValid(id)) return jsonError("Invalid user ID.");

    if (id === admin.id) return jsonError("You cannot delete your own account.");

    const db = await getDb();
    await db.collection("users").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "User deleted." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to delete user.", 403);
  }
}
