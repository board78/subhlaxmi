"use client";

import type { BlogPost } from "./BlogEditorModal";

type BlogListTableProps = {
  posts: BlogPost[];
  loading: boolean;
  deleting: string | null;
  postToDelete: BlogPost | null;
  setPostToDelete: (post: BlogPost | null) => void;
  confirmDelete: () => void;
  handleTogglePublish: (post: BlogPost) => void;
  openEdit: (post: BlogPost) => void;
  openCreate: () => void;
};

export function BlogListTable({
  posts,
  loading,
  deleting,
  postToDelete,
  setPostToDelete,
  confirmDelete,
  handleTogglePublish,
  openEdit,
  openCreate,
}: BlogListTableProps) {
  return (
    <>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-white/10">
          <p className="text-3xl">📝</p>
          <p className="mt-3 text-zinc-400">No blog posts yet.</p>
          <button
            onClick={openCreate}
            className="mt-4 rounded-xl sl-cta-gradient px-4 py-2 text-sm font-bold text-white"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post._id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:border-white/15 transition"
            >
              {/* Thumbnail */}
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-white/8">
                {post.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-100">{post.title}</p>
                <p className="text-[11px] text-zinc-600">
                  {post.category} · {post.readMinutes} min
                </p>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2">
                {post.featured && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    ★ Featured
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleTogglePublish(post)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                    post.published
                      ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <a
                  href={`/blog/${post.slug || post._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 hover:text-zinc-200 transition"
                  title="View"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <button
                  type="button"
                  onClick={() => openEdit(post)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 hover:text-amber-300 transition"
                  title="Edit"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setPostToDelete(post)}
                  disabled={deleting === post._id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 hover:border-red-500/30 hover:text-red-400 disabled:opacity-40 transition"
                  title="Delete"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Post</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to delete <strong className="text-zinc-200">"{postToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                disabled={deleting !== null}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting !== null}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
