"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

const CLOUD_NAME = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "").replace(/['"]/g, "");
const CLOUD_UPLOAD_PRESET = (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "subhlaxmi").replace(/['"]/g, "");

async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUD_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText) as { secure_url: string };
        resolve(data.secure_url);
      } else {
        reject(new Error(`Cloudinary upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(fd);
  });
}


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
  published: boolean;
  featured: boolean;
  readMinutes: number;
  createdAt: string;
};

const CATEGORIES = ["General", "Lottery", "Winners", "Tips & Tricks", "News"];

const EMPTY_FORM = {
  title: "", slug: "", excerpt: "", content: "", thumbnail: "",
  category: "General", tags: "", author: "", published: false, featured: false, readMinutes: 0,
};

/* ── Toggle component ─────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
  color = "emerald",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: "emerald" | "amber";
}) {
  const trackColor = checked
    ? color === "emerald" ? "#10b981" : "#f59e0b"
    : "#3f3f46";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: "2.5rem",       /* 40px */
        height: "1.375rem",   /* 22px */
        borderRadius: "9999px",
        backgroundColor: trackColor,
        border: "none",
        padding: 0,
        cursor: "pointer",
        transition: "background-color 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "calc(100% - 19px)" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "9999px",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

/* ── TagsInput component ──────────────────────────────────── */
function TagsInput({
  tagsStr,
  onChange,
}: {
  tagsStr: string;
  onChange: (v: string) => void;
}) {
  const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
  const [input, setInput] = useState("");

  const addTag = (val: string) => {
    const newTag = val.trim();
    if (!newTag || tags.includes(newTag)) return;
    onChange([...tags, newTag].join(", "));
    setInput("");
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags.join(", "));
  };

  return (
    <div className="w-full rounded-xl border border-white/12 bg-white/5 p-2 focus-within:border-amber-500/50 transition-colors">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 border border-amber-500/20">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-amber-500/60 hover:text-red-400 transition"
              title="Remove tag"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(input);
            } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
              removeTag(tags.length - 1);
            }
          }}
          onBlur={() => { if (input) addTag(input); }}
          placeholder={tags.length === 0 ? "Add tags (press Enter)..." : ""}
          className="flex-1 bg-transparent px-1 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none min-w-[120px]"
        />
      </div>
    </div>
  );
}

/* ── ThumbnailUpload component ────────────────────────────── */
function ThumbnailUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadToCloudinary(file, setProgress);
      onChange(url);
      toast.success("Image uploaded!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Thumbnail</label>

      {/* Preview */}
      {value && (
        <div className="relative mb-2 overflow-hidden rounded-xl border border-white/10 h-32 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Thumbnail" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600/80"
            title="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
          dragOver
            ? "border-amber-500/60 bg-amber-500/5"
            : "border-white/12 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
        } ${uploading ? "pointer-events-none" : ""}`}
      >
        {uploading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            <p className="text-xs text-zinc-400">Uploading… {progress}%</p>
            <div className="h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
            <p className="text-xs text-zinc-400">
              {value ? "Replace image" : "Drop image or click to upload"}
            </p>
            <p className="text-[10px] text-zinc-600">JPG, PNG, WebP · max 8 MB</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "editor">("list");
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const jsonRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog?all=true&limit=50");
      if (res.ok) {
        const data = await res.json() as { posts: BlogPost[] };
        setPosts(data.posts);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setForm(f => ({
      ...f,
      title: val,
      slug: editing ? f.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setView("editor");
  };

  const openEdit = async (post: BlogPost) => {
    setLoadingEdit(true);
    setView("editor");
    setEditing(post);
    // Prefill with known fields first (content will be empty until fetch completes)
    setForm({
      title: post.title, slug: post.slug, excerpt: post.excerpt ?? "",
      content: "", thumbnail: post.thumbnail ?? "", category: post.category ?? "General",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      author: post.author ?? "",
      published: post.published ?? false, featured: post.featured ?? false,
      readMinutes: post.readMinutes ?? 0,
    });
    try {
      // List API excludes `content` (projection: { content: 0 }) — fetch full post
      const res = await fetch(`/api/blog/${post._id}`);
      if (res.ok) {
        const full = await res.json() as BlogPost;
        setForm({
          title: full.title ?? "", slug: full.slug ?? "", excerpt: full.excerpt ?? "",
          content: full.content ?? "", thumbnail: full.thumbnail ?? "",
          category: full.category ?? "General",
          tags: Array.isArray(full.tags) ? full.tags.join(", ") : "",
          author: full.author ?? "",
          published: full.published ?? false, featured: full.featured ?? false,
          readMinutes: full.readMinutes ?? 0,
        });
      }
    } catch {
      toast.error("Failed to load post content.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error("Title, slug, and content are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        readMinutes: form.readMinutes || Math.ceil(form.content.split(/\s+/).length / 200),
      };
      const url = editing ? `/api/blog/${editing._id}` : "/api/blog";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      toast.success(editing ? "Post updated!" : "Post created!");
      setView("list");
      fetchPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setDeleting(postToDelete._id);
    try {
      const res = await fetch(`/api/blog/${postToDelete._id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed.");
      toast.success("Post deleted.");
      setPosts(p => p.filter(x => x._id !== postToDelete._id));
      setPostToDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/blog/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });
      if (!res.ok) throw new Error("Update failed.");
      toast.success(post.published ? "Post unpublished." : "Post published!");
      setPosts(p => p.map(x => x._id === post._id ? { ...x, published: !x.published } : x));
    } catch {
      toast.error("Failed to update post.");
    }
  };

  // JSON import
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as Partial<BlogPost> | Partial<BlogPost>[];
        const items = Array.isArray(raw) ? raw : [raw];
        let success = 0;
        for (const item of items) {
          if (!item.title || !item.content) continue;
          const payload = {
            title: item.title,
            slug: item.slug ?? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            excerpt: item.excerpt ?? "",
            content: item.content,
            thumbnail: item.thumbnail ?? "",
            category: item.category ?? "General",
            tags: Array.isArray(item.tags) ? item.tags : [],
            author: item.author ?? "Admin",
            published: item.published ?? false,
            featured: item.featured ?? false,
            readMinutes: item.readMinutes ?? 0,
          };
          const res = await fetch("/api/blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) success++;
        }
        toast.success(`${success} post(s) imported successfully!`);
        fetchPosts();
      } catch {
        toast.error("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    if (jsonRef.current) jsonRef.current.value = "";
  };

  /* ── LIST VIEW ── */
  if (view === "list") {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Blog Management</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{posts.length} post{posts.length !== 1 ? "s" : ""} total</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-white/25 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import JSON
              <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
            </label>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl sl-cta-gradient px-4 py-2 text-xs font-bold text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New Post
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse h-16 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-white/10">
            <p className="text-3xl">📝</p>
            <p className="mt-3 text-zinc-400">No blog posts yet.</p>
            <button onClick={openCreate} className="mt-4 rounded-xl sl-cta-gradient px-4 py-2 text-sm font-bold text-white">
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map(post => (
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
                  <p className="text-[11px] text-zinc-600">{post.category} · {post.readMinutes} min</p>
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-2">
                  {post.featured && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">★ Featured</span>
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 hover:text-amber-300 transition"
                    title="Edit"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostToDelete(post)}
                    disabled={deleting === post._id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 hover:border-red-500/30 hover:text-red-400 disabled:opacity-40 transition"
                    title="Delete"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
      </div>
    );
  }

  /* ── EDITOR VIEW ── */
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setView("list")}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 text-zinc-400 hover:text-white transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">{editing ? "Edit Post" : "New Post"}</h2>
          <p className="text-xs text-zinc-500">{editing ? `Editing: ${editing.title}` : "Create a new blog article"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className="rounded-xl border border-white/12 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl sl-cta-gradient px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main fields */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Article title…"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
              placeholder="article-url-slug"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/50"
            />
            <p className="mt-1 text-[11px] text-zinc-600">URL: /blog/{form.slug || "your-slug"}</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Excerpt</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Short summary shown in blog cards…"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-400">
              Content * (HTML supported)
              <span className="text-[11px] font-normal text-zinc-600">~{Math.ceil((form.content ?? "").split(/\s+/).filter(Boolean).length / 200)} min read</span>
            </label>
            {loadingEdit ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-white/12 bg-white/5">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500/40 border-t-amber-400" />
                  Loading content…
                </div>
              </div>
            ) : (
              <textarea
                rows={18}
                value={form.content ?? ""}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="<h2>Introduction</h2><p>Your article content here… HTML tags are supported.</p>"
                className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/50 resize-y leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Sidebar fields */}
        <div className="space-y-4">
          {/* Thumbnail — Cloudinary Upload */}
          <ThumbnailUpload
            value={form.thumbnail}
            onChange={(url) => setForm(f => ({ ...f, thumbnail: url }))}
          />

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Category</label>
            <input
              type="text"
              list="category-options"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Select or type a category..."
              className="w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/50"
            />
            <datalist id="category-options">
              {CATEGORIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Author */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Author</label>
            <input
              type="text"
              value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              placeholder="Admin"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Tags (press Enter to add)</label>
            <TagsInput
              tagsStr={form.tags}
              onChange={val => setForm(f => ({ ...f, tags: val }))}
            />
          </div>

          {/* Read minutes override */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Read Time (min, 0=auto)</label>
            <input
              type="number"
              min="0"
              value={form.readMinutes}
              onChange={e => setForm(f => ({ ...f, readMinutes: Number(e.target.value) }))}
              className="w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2.5 text-xs text-zinc-100 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-300">Published</span>
              <Toggle
                checked={form.published}
                onChange={(v) => setForm(f => ({ ...f, published: v }))}
                color="emerald"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-300">Featured</span>
              <Toggle
                checked={form.featured}
                onChange={(v) => setForm(f => ({ ...f, featured: v }))}
                color="amber"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl sl-cta-gradient py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update Post" : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
