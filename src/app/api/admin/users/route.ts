import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/admin/users
 * Returns all users (paginated, searchable).
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getDb();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      db
        .collection("users")
        .find(query, { projection: { passwordHash: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("users").countDocuments(query),
    ]);

    const safeUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name as string,
      email: u.email as string,
      role: (u.role as string) ?? "user",
      createdAt: (u.createdAt as Date).toISOString(),
    }));

    return NextResponse.json({ users: safeUsers, total, page, limit });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load users.", 403);
  }
}
