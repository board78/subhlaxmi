"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DrawFormModal, type DrawForEdit } from "./DrawFormModal";
import { AdminTicketView } from "./AdminTicketView";

type Draw = {
  id: string;
  name: string;
  drawDate: string;
  drawTime: string;
  pricePerTicket: number;
  series: string[];
  ticketPrefix: string;
  ticketRangeStart: number;
  ticketRangeEnd: number;
  status: string;
  createdAt: string;
};

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  upcoming: { badge: "border-blue-400/25 bg-blue-400/10 text-blue-300", dot: "bg-blue-400" },
  active: { badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400" },
  closed: { badge: "border-zinc-400/25 bg-zinc-400/10 text-zinc-400", dot: "bg-zinc-400" },
  drawn: { badge: "border-amber-400/25 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" },
};

function DeleteConfirm({
  draw,
  onConfirm,
  onCancel,
}: {
  draw: Draw;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#1a0d12] p-6 shadow-2xl"
      >
        <p className="text-sm font-semibold text-white">Delete Draw</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Are you sure you want to delete <span className="font-semibold text-zinc-200">&quot;{draw.name}&quot;</span>?
          All associated tickets will still remain in the database.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function DrawManagement() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDraw, setEditDraw] = useState<DrawForEdit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Draw | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewTicketsDraw, setViewTicketsDraw] = useState<Draw | null>(null);

  const fetchDraws = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/draws");
      if (!r.ok) throw new Error("Failed to load draws.");
      const data = (await r.json()) as { draws: Draw[] };
      setDraws(data.draws);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDraws();
  }, [fetchDraws]);

  const handleDelete = async (draw: Draw) => {
    setDeleteTarget(null);
    setActionLoading(draw.id);
    try {
      const r = await fetch(`/api/admin/draws/${draw.id}`, { method: "DELETE" });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Delete failed.");
      }
      await fetchDraws();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (draw: Draw, newStatus: string) => {
    setActionLoading(draw.id);
    try {
      const r = await fetch(`/api/admin/draws/${draw.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Update failed.");
      }
      await fetchDraws();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Ticket view mode ── */}
      <AnimatePresence mode="wait">
        {viewTicketsDraw && (
          <motion.div
            key="ticket-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-[75vh] min-h-[500px]"
          >
            <AdminTicketView
              draw={viewTicketsDraw}
              onBack={() => setViewTicketsDraw(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Draw list (hidden when viewing tickets) ── */}
      {!viewTicketsDraw && (
        <>
        {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">{draws.length} draws total</p>
        <button
          type="button"
          onClick={() => { setEditDraw(null); setFormOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-amber-400 hover:to-orange-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Draw
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Draws grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]" />
          ))}
        </div>
      ) : draws.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center">
          <p className="text-sm font-semibold text-zinc-300">No draws yet</p>
          <p className="mt-1 text-xs text-zinc-500">Create your first lottery draw above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {draws.map((draw, i) => {
              const style = STATUS_STYLES[draw.status] ?? STATUS_STYLES.closed;
              const isActioning = actionLoading === draw.id;

              return (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/18"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-zinc-100">{draw.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {new Date(draw.drawDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {draw.drawTime}
                      </p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {draw.status.charAt(0).toUpperCase() + draw.status.slice(1)}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400">
                      ₹{draw.pricePerTicket}/ticket
                    </span>
                    <span className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400">
                      Series: {draw.series.join(", ")}
                    </span>
                    <span className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400">
                      {draw.ticketPrefix}-{draw.ticketRangeStart}–{draw.ticketRangeEnd}
                    </span>
                  </div>

                  {/* Status quick-change */}
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Change Status</p>
                    <div className="flex flex-wrap gap-1">
                      {["upcoming", "active", "closed", "drawn"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={isActioning || draw.status === s}
                          onClick={() => handleStatusChange(draw, s)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-40 ${
                            draw.status === s
                              ? "bg-white/12 text-zinc-300"
                              : "border border-white/8 bg-white/[0.03] text-zinc-500 hover:border-white/18 hover:text-zinc-300"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => setViewTicketsDraw(draw)}
                      className="flex-1 rounded-xl border border-purple-400/20 bg-purple-500/10 py-2 text-xs font-semibold text-purple-300 transition hover:border-purple-400/40 hover:bg-purple-500/20 disabled:opacity-40"
                    >
                      View Tickets
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => { setEditDraw(draw); setFormOpen(true); }}
                      className="flex-1 rounded-xl border border-white/12 bg-white/[0.03] py-2 text-xs font-semibold text-zinc-300 transition hover:border-amber-400/30 hover:text-amber-200 disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => setDeleteTarget(draw)}
                      className="flex-1 rounded-xl border border-red-400/20 bg-red-500/10 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Draw form modal */}
      <DrawFormModal
        open={formOpen}
        editDraw={editDraw}
        onClose={() => { setFormOpen(false); setEditDraw(null); }}
        onSaved={fetchDraws}
      />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            draw={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
