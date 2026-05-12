"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import type { SafeUser } from "@/lib/auth";

type BlogCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  category: string;
  tags: string[];
  author: string;
  featured: boolean;
  readMinutes: number;
  createdAt: string;
};


function BlogCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <div className="h-48 bg-white/8" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-20 bg-white/8 rounded-full" />
        <div className="h-5 bg-white/10 rounded-lg" />
        <div className="h-4 bg-white/6 rounded-lg" />
        <div className="h-4 w-3/4 bg-white/6 rounded-lg" />
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: BlogCard }) {
  const date = new Date(post.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug || post._id}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-[#14070f] overflow-hidden transition-all duration-300 hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amber-900/30 to-orange-900/20">
        {post.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-500/40">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {post.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            Featured
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm">
          {post.category}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-400/70">
          {date} · {post.readMinutes} min read
        </p>
        <h2 className="mt-2 text-base font-bold leading-snug text-zinc-100 transition group-hover:text-amber-200 line-clamp-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 line-clamp-3">{post.excerpt}</p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-[#1a0900]">
              {post.author.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-xs text-zinc-500">{post.author}</span>
          </div>
          <span className="text-xs font-semibold text-amber-500/80 group-hover:text-amber-400 transition">
            Read more →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [posts, setPosts] = useState<BlogCard[]>([]);
  const [featured, setFeatured] = useState<BlogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % featured.length);
    }, 5000); // 5 seconds smooth auto-scroll
    return () => clearInterval(interval);
  }, [featured.length]);

  useEffect(() => {
    fetch("/api/profile").then(r => r.ok ? r.json() : null).then(d => { if (d?.user) setUser(d.user); }).catch(() => {});
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const cat = activeCategory !== "All" ? `&category=${encodeURIComponent(activeCategory)}` : "";
      const res = await fetch(`/api/blog?page=${page}&limit=9${cat}`);
      if (!res.ok) return;
      const data = await res.json() as { posts: BlogCard[]; pages: number; categories?: string[] };
      setPosts(data.posts);
      setTotalPages(data.pages);
      if (data.categories) {
        // Only update if it contains items to avoid losing "All" on error, though the API always returns an array
        setCategories(["All", ...data.categories]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeCategory, page]);

  useEffect(() => {
    // Fetch featured posts once
    fetch("/api/blog?featured=true&limit=3")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.posts) setFeatured(d.posts); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = search.trim()
    ? posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  return (
    <div className="royal-surface royal-grid min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar
        user={user}
        onAuthChange={(u) => { setUser(u); if (!u) router.push("/"); }}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400/70">Subhlaxmi Blog</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Stories, Tips & Updates</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Lottery insights, winner stories, tips to maximize your chances, and the latest news.
          </p>

          {/* Search */}
          <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && activeCategory === "All" && !search && page === 1 && (
          <section className="mb-10">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-400/70">Featured</p>
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#14070f] hover:border-amber-500/30 transition-all duration-300">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featured[featuredIndex]._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Link
                    href={`/blog/${featured[featuredIndex].slug || featured[featuredIndex]._id}`}
                    className="relative flex flex-col sm:flex-row"
                  >
                    <div className="relative h-56 sm:h-auto sm:w-1/2 overflow-hidden bg-gradient-to-br from-amber-900/30 to-orange-900/20">
                      {featured[featuredIndex].thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={featured[featuredIndex].thumbnail} alt={featured[featuredIndex].title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-500/30">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white">
                        ★ Featured
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70">{featured[featuredIndex].category}</span>
                      <h2 className="mt-2 text-xl font-bold leading-snug text-zinc-100 group-hover:text-amber-200 transition sm:text-2xl line-clamp-3">
                        {featured[featuredIndex].title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-500 line-clamp-3">{featured[featuredIndex].excerpt}</p>
                      <div className="mt-5 flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-[#1a0900]">
                          {featured[featuredIndex].author.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500">{featured[featuredIndex].author}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-600">{featured[featuredIndex].readMinutes} min read</span>
                        <span className="ml-auto text-sm font-semibold text-amber-500 group-hover:text-amber-400 transition">Read →</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Indicators */}
              {featured.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10 flex gap-1.5 sm:bottom-6 sm:right-6">
                  {featured.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFeaturedIndex(i);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === featuredIndex
                          ? "w-5 bg-amber-400"
                          : "w-1.5 bg-white/20 hover:bg-white/40"
                      }`}
                      aria-label={`Go to featured post ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => { setActiveCategory(cat); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? "bg-amber-500 text-white"
                  : "border border-white/12 bg-white/5 text-zinc-300 hover:border-amber-500/30 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <BlogCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-2xl">📝</p>
            <p className="mt-3 text-zinc-400">No articles found{search ? " for your search" : ""}.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(post => <BlogCard key={post._id} post={post} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !search && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-40 hover:border-white/25"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-full text-xs font-bold transition ${
                  p === page ? "bg-amber-500 text-white" : "border border-white/12 bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-40 hover:border-white/25"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
