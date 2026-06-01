"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrashCan, FaPenToSquare, FaPlus, FaQuoteLeft, FaCheck } from "react-icons/fa6";

type Testimonial = {
  id: string;
  name: string;
  location: string;
  tag: string;
  quote: string;
};

/* ─── Add/Edit Form Modal ─────────────────────────────────────────────────── */

function TestimonialModal({
  testimonial,
  onClose,
  onSaved,
}: {
  testimonial?: Testimonial | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(testimonial?.name ?? "");
  const [location, setLocation] = useState(testimonial?.location ?? "");
  const [tag, setTag] = useState(testimonial?.tag ?? "Verified");
  const [quote, setQuote] = useState(testimonial?.quote ?? "");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!testimonial;

  const inp =
    "w-full rounded-lg border border-white/10 bg-[#0f0810]/80 px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20";
  const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !quote) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");

    const url = isEdit ? `/api/testimonials/${testimonial.id}` : "/api/testimonials";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, tag, quote }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed to save testimonial.");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell 
      title={isEdit ? "Edit Testimonial" : "Add Testimonial"} 
      subtitle={isEdit ? "Update this user review details" : "Publish a new player review on the home page"} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && <ErrorBanner msg={error} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Player Name <span className="text-amber-400">*</span></label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar" 
              className={inp} 
            />
          </div>
          <div>
            <label className={lbl}>City/Location <span className="text-amber-400">*</span></label>
            <input 
              type="text" 
              required 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kochi" 
              className={inp} 
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Review Tag / Rating <span className="text-zinc-600">(optional)</span></label>
          <input 
            type="text" 
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. 5★ rated, Verified, Happy buyer" 
            className={inp} 
          />
        </div>

        <div>
          <label className={lbl}>Review Quote Text <span className="text-amber-400">*</span></label>
          <textarea 
            required 
            rows={4}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Write the player's lottery draw feedback..." 
            className={`${inp} resize-none`}
          />
        </div>

        <ModalFooter onCancel={onClose} saving={saving} label={isEdit ? "Save Changes" : "Publish Review"} />
      </form>
    </ModalShell>
  );
}

/* ─── Delete Confirmation Modal ───────────────────────────────────────────── */

function DeleteConfirm({
  testimonial,
  onConfirm,
  onCancel,
}: {
  testimonial: Testimonial;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#170d14] p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
            <FaTrashCan className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Delete Review</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Are you sure you want to delete the review by{" "}
              <span className="font-semibold text-zinc-200">&quot;{testimonial.name}&quot;</span>?
              This will remove it instantly from the home page.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/12 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-white/22 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500/80 py-2.5 text-xs font-bold text-white transition hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Shared Shell Components ─────────────────────────────────────────────── */

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/12 bg-[#170d14] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">{title}</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300 font-semibold">
      {msg}
    </div>
  );
}

function ModalFooter({
  onCancel,
  saving,
  label,
}: {
  onCancel: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-3 border-t border-white/8 pt-4">
      <button 
        type="button" 
        onClick={onCancel}
        className="flex-1 rounded-lg border border-white/12 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-white/22 hover:text-zinc-200"
      >
        Cancel
      </button>
      <button 
        type="submit" 
        disabled={saving}
        className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-60"
      >
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function TestimonialManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/testimonials");
      if (!res.ok) throw new Error("Failed to load reviews list.");
      const data = await res.json() as { testimonials: Testimonial[] };
      setTestimonials(data.testimonials || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (t: Testimonial) => {
    setDeleteTarget(null);
    setActionLoading(t.id);
    try {
      const res = await fetch(`/api/testimonials/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed to delete review.");
      }
      await fetchAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setActionLoading(null);
    }
  };

  const openAddModal = () => {
    setActiveTestimonial(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Testimonial) => {
    setActiveTestimonial(t);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {testimonials.length} review{testimonials.length !== 1 ? "s" : ""} active on site
        </p>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-amber-400 hover:to-orange-400"
        >
          <FaPlus className="w-3 h-3" />
          Add Review
        </button>
      </div>

      {error && <ErrorBanner msg={error} />}

      {/* Testimonials List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/8 bg-white/[0.02]" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/5 mx-auto mb-4 text-zinc-400">
            <FaQuoteLeft className="w-5 h-5 opacity-40" />
          </div>
          <p className="text-sm font-semibold text-zinc-300">No testimonials published</p>
          <p className="mt-1 text-xs text-zinc-500">Add player reviews to show on your home page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {testimonials.map((t, i) => {
              const isActioning = actionLoading === t.id;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, delay: i * 0.03 }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.01] px-4 py-4 transition hover:bg-white/[0.02] hover:border-white/18"
                >
                  {/* Initial avatar */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-amber-950 shadow-md">
                    {t.name.slice(0, 1).toUpperCase()}
                  </span>

                  {/* Info card */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-bold text-zinc-100">{t.name}</p>
                      <span className="text-[10px] text-zinc-500 font-semibold">({t.location})</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-bold text-zinc-300">
                        {t.tag}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400 italic">
                      &quot;{t.quote}&quot;
                    </p>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex shrink-0 items-center gap-2 self-center">
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => openEditModal(t)}
                      title="Edit review"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-zinc-400 transition hover:border-amber-400/35 hover:bg-amber-400/10 hover:text-amber-300 disabled:opacity-40"
                    >
                      <FaPenToSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => setDeleteTarget(t)}
                      title="Delete review"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-400 transition hover:border-red-400/45 hover:bg-red-500/20 disabled:opacity-40"
                    >
                      <FaTrashCan className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals setup */}
      <AnimatePresence>
        {modalOpen && (
          <TestimonialModal
            testimonial={activeTestimonial}
            onClose={() => setModalOpen(false)}
            onSaved={fetchAll}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            testimonial={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
