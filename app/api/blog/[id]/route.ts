import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";
import { ObjectId } from "mongodb";
import type { BlogPost } from "../route";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/blog/[id] — by MongoDB id or slug */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const db = await getDb();
    const col = db.collection<BlogPost>("blog_posts");

    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { slug: id };

    const post = await col.findOne(filter);
    if (!post) return jsonError("Post not found.", 404);

    return NextResponse.json({ ...post, _id: post._id!.toString() });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to fetch post.");
  }
}

/** PATCH /api/blog/[id] — admin only, update post */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Unauthorized", 401);

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    if (!userDoc || userDoc.role !== "admin") return jsonError("Forbidden", 403);

    if (!ObjectId.isValid(id)) return jsonError("Invalid post id.");

    const body = (await request.json()) as Partial<BlogPost>;
    const { title, slug, excerpt, content, thumbnail, category, tags, author, published, featured, readMinutes } = body;

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) $set.title = title.trim();
    if (slug !== undefined) $set.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (excerpt !== undefined) $set.excerpt = excerpt.trim();
    if (content !== undefined) {
      $set.content = content.trim();
      $set.readMinutes = readMinutes ?? Math.ceil(content.split(/\s+/).length / 200);
    }
    if (thumbnail !== undefined) $set.thumbnail = thumbnail;
    if (category !== undefined) $set.category = category;
    if (tags !== undefined) $set.tags = tags;
    if (author !== undefined) $set.author = author;
    if (published !== undefined) $set.published = published;
    if (featured !== undefined) $set.featured = featured;
    if (readMinutes !== undefined) $set.readMinutes = readMinutes;

    const result = await db
      .collection("blog_posts")
      .updateOne({ _id: new ObjectId(id) }, { $set });

    if (result.matchedCount === 0) return jsonError("Post not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update post.");
  }
}

/** DELETE /api/blog/[id] — admin only */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Unauthorized", 401);

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    if (!userDoc || userDoc.role !== "admin") return jsonError("Forbidden", 403);

    if (!ObjectId.isValid(id)) return jsonError("Invalid post id.");

    const result = await db.collection("blog_posts").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return jsonError("Post not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to delete post.");
  }
}
