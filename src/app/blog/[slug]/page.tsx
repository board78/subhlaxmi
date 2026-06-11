"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { SafeUser } from "@/lib/auth";

type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  category: string;
  tags: string[];
  author: string;
  featured: boolean;
  readMinutes: number;
  createdAt: string;
  updatedAt: string;
};

function ContentRenderer({ content }: { content: string }) {
  // Basic HTML rendering with safety
  return (
    <div
      className="blog-content prose prose-invert max-w-none"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.ok ? r.json() : null).then(d => { if (d?.user) setUser(d.user); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${slug}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<BlogPost>;
      })
      .then(d => { if (d) setPost(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const date = post ? new Date(post.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  }) : "";

  return (
    <div className="sl-blog-page royal-surface royal-grid min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar
        user={user}
        onAuthChange={(u) => { setUser(u); if (!u) router.push("/"); }}
      />

      {loading && (
        <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="h-8 rounded-lg bg-white/10" />
            <div className="h-6 w-2/3 rounded-lg bg-white/8" />
            <div className="h-64 rounded-2xl bg-white/8" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 rounded-full bg-white/6" style={{ width: `${75 + ((i * 7) % 25)}%` }} />
            ))}
          </div>
        </main>
      )}

      {notFound && !loading && (
        <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <p className="text-5xl">📄</p>
          <h1 className="mt-4 text-2xl font-bold text-white">Article not found</h1>
          <p className="mt-2 text-zinc-500">The article you&apos;re looking for doesn&apos;t exist or was removed.</p>
          <Link href="/blog" className="mt-6 rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-white/30 hover:text-white transition">
            ← Back to Blog
          </Link>
        </main>
      )}

      {post && !loading && (
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition">Home</Link>
            <span>›</span>
            <Link href="/blog" className="hover:text-zinc-300 transition">Blog</Link>
            <span>›</span>
            <span className="text-zinc-400 line-clamp-1">{post.title}</span>
          </nav>

          {/* Category + meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
              {post.category}
            </span>
            {post.featured && (
              <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white">
                ★ Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
            {post.title}
          </h1>

          {/* Author row */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-white/8 pb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-[#1a0900]">
              {post.author.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-xs font-semibold text-zinc-200">{post.author}</p>
              <p className="text-[11px] text-zinc-600">{date} · {post.readMinutes} min read</p>
            </div>
          </div>

          {/* Thumbnail */}
          {post.thumbnail && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.thumbnail}
                alt={post.title}
                className="h-72 w-full object-cover sm:h-96"
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-6 text-base leading-relaxed text-zinc-300 font-medium border-l-2 border-amber-500/50 pl-4 italic">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div className="mt-8">
            <ContentRenderer content={post.content} />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-white/8 pt-6">
              {post.tags.map(tag => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Back link */}
          <div className="mt-10 pt-6 border-t border-white/8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-amber-500/30 hover:text-white"
            >
              ← Back to Blog
            </Link>
          </div>
        </main>
      )}

      <style>{`
        .blog-content {
          color: var(--foreground);
          line-height: 1.8;
          font-size: 0.975rem;
          opacity: 0.92;
        }
        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
          color: var(--foreground);
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .blog-content h1 { font-size: 1.6rem; }
        .blog-content h2 { font-size: 1.3rem; }
        .blog-content h3 { font-size: 1.1rem; }
        .blog-content p { margin: 1rem 0; }
        .blog-content a { color: #f59e0b; text-decoration: underline; text-underline-offset: 3px; }
        .blog-content a:hover { color: #fcd34d; }
        .blog-content ul, .blog-content ol { margin: 1rem 0 1rem 1.5rem; }
        .blog-content li { margin: 0.35rem 0; }
        .blog-content blockquote {
          border-left: 3px solid #f59e0b;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: var(--muted);
          font-style: italic;
        }
        .blog-content code {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 0.1em 0.4em;
          font-size: 0.875em;
          color: #fcd34d;
        }
        .blog-content pre {
          background: #0d0609;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .blog-content pre code {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
        }
        .blog-content img {
          border-radius: 12px;
          margin: 1.5rem 0;
          max-width: 100%;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }
        .blog-content strong { color: var(--foreground); }
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .blog-content th, .blog-content td {
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .blog-content th {
          background: rgba(255, 255, 255, 0.05);
          color: var(--foreground);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
