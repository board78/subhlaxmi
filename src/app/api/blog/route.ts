import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";
import { ObjectId } from "mongodb";

export type BlogPost = {
  _id?: ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;         // HTML or Markdown
  thumbnail: string;       // URL
  category: string;
  tags: string[];
  author: string;
  published: boolean;
  featured: boolean;
  readMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

/** GET /api/blog — public, returns published posts */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "12")));
  const category = searchParams.get("category") ?? "";
  const featured = searchParams.get("featured") === "true";
  const all = searchParams.get("all") === "true"; // admin flag

  try {
    const db = await getDb();
    const col = db.collection<BlogPost>("blog_posts");

    const filter: Record<string, unknown> = all ? {} : { published: true };
    if (category) filter.category = category;
    if (featured && !all) filter.featured = true;

    const total = await col.countDocuments(filter);
    const categories = await col.distinct("category", { published: true });
    
    const posts = await col
      .find(filter, { projection: { content: 0 } }) // exclude heavy content in list
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      posts: posts.map((p) => ({ ...p, _id: p._id!.toString() })),
      categories: categories.filter(Boolean),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to fetch posts.");
  }
}

/** POST /api/blog — admin only, create post */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Unauthorized", 401);

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    if (!userDoc || userDoc.role !== "admin") return jsonError("Forbidden", 403);

    const body = (await request.json()) as Partial<BlogPost>;
    const { title, slug, excerpt, content, thumbnail, category, tags, author, published, featured, readMinutes } = body;

    if (!title?.trim() || !slug?.trim() || !content?.trim()) {
      return jsonError("title, slug, and content are required.");
    }

    const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check slug uniqueness
    const existing = await db.collection("blog_posts").findOne({ slug: slugClean });
    if (existing) return jsonError("A post with this slug already exists.", 409);

    const now = new Date();
    const post: Omit<BlogPost, "_id"> = {
      title: title.trim(),
      slug: slugClean,
      excerpt: (excerpt ?? "").trim(),
      content: content.trim(),
      thumbnail: thumbnail ?? "",
      category: category ?? "General",
      tags: Array.isArray(tags) ? tags : [],
      author: author ?? user.name ?? "Admin",
      published: published ?? false,
      featured: featured ?? false,
      readMinutes: readMinutes ?? Math.ceil(content.split(/\s+/).length / 200),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<BlogPost>("blog_posts").insertOne(post as BlogPost);
    return NextResponse.json({ _id: result.insertedId.toString(), ...post }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create post.");
  }
}
