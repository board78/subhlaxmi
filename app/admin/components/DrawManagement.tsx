"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DrawFormModal, type DrawForEdit } from "./DrawFormModal";
import { AdminTicketView } from "./AdminTicketView";

type Draw = {
  id: string;
  name: string;
  drawSeriesName?: string;
  drawNumber?: number;
  drawDate: string;
  drawTime: string;
  activatesAt: string;
  expiresAt: string;
  pricePerTicket: number;
  series: string[];
  ticketPrefix: string;
  ticketRangeStart: number;
  ticketRangeEnd: number;
  status: string;        // computed effective status
  storedStatus: string;  // raw DB value
  createdAt: string;
};

// ─── Countdown helpers ────────────────────────────────────────────────────────

function formatCountdown(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "Now";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function ProgressBar({ activatesAt, expiresAt }: { activatesAt: string; expiresAt: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const calc = () => {
      const start = new Date(activatesAt).getTime();
      const end = new Date(expiresAt).getTime();
      const now = Date.now();
      const p = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
      setPct(p);
    };
    calc();
    const t = setInterval(calc, 10_000);
    return () => clearInterval(t);
  }, [activatesAt, expiresAt]);
  return (
    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CountdownBadge({ draw }: { draw: Draw }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const update = () => {
      if (draw.status === "upcoming") {
        setLabel(`Starts in ${formatCountdown(new Date(draw.activatesAt).getTime())}`);
      } else if (draw.status === "active") {
        setLabel(`Ends in ${formatCountdown(new Date(draw.expiresAt).getTime())}`);
      } else {
        setLabel("");
      }
    };
    update();
    const t = setInterval(update, 1_000);
    return () => clearInterval(t);
  }, [draw]);
  if (!label) return null;
  return (
    <span className="text-[10px] font-mono text-zinc-400">{label}</span>
  );
}

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  upcoming: {
    badge: "border-blue-400/25 bg-blue-400/10 text-blue-300",
    dot: "bg-blue-400",
    label: "Upcoming",
  },
  active: {
    badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400 animate-pulse",
    label: "Active",
  },
  closed: {
    badge: "border-zinc-500/25 bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-500",
    label: "Closed",
  },
  drawn: {
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
    label: "Drawn",
  },
};

// ─── Delete confirm ───────────────────────────────────────────────────────────

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
          Delete{" "}
          <span className="font-semibold text-zinc-200">
            &quot;{draw.name}&quot;
          </span>
          ? Available tickets and results will be removed. Blocked if any
          tickets are sold or reserved.
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

// ─── Draw card ────────────────────────────────────────────────────────────────

function DrawCard({
  draw,
  isActioning,
  onEdit,
  onDelete,
  onViewTickets,
  onStatusOverride,
}: {
  draw: Draw;
  isActioning: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewTickets: () => void;
  onStatusOverride: (s: "drawn" | "closed") => void;
}) {
  const style = STATUS_STYLES[draw.status] ?? STATUS_STYLES.closed;
  const isHistory = draw.status === "closed" || draw.status === "drawn";

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/18">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="truncate text-sm font-bold text-zinc-100">
              {draw.name}
            </p>
            {draw.drawNumber != null && (
              <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                #{draw.drawNumber}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {new Date(draw.activatesAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            })}{" "}
            · {draw.drawTime}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      {/* Timer */}
      {!isHistory && (
        <div className="mt-2 flex items-center gap-1.5">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-zinc-500"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <CountdownBadge draw={draw} />
        </div>
      )}

      {/* Progress bar (active only) */}
      {draw.status === "active" && (
        <ProgressBar activatesAt={draw.activatesAt} expiresAt={draw.expiresAt} />
      )}

      {/* Expiry range */}
      {!isHistory && (
        <p className="mt-1.5 text-[10px] text-zinc-600">
          {draw.status === "upcoming" ? "Active" : "Expires"}{" "}
          {new Date(draw.expiresAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })}
        </p>
      )}

      {/* Meta tags */}
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
        {draw.drawSeriesName && (
          <span className="rounded-lg border border-amber-400/15 bg-amber-400/[0.04] px-2.5 py-1 text-[11px] text-amber-400/70">
            Series: {draw.drawSeriesName}
          </span>
        )}
      </div>

      {/* Manual override (only for active/upcoming draws) */}
      {!isHistory && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <p className="w-full text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
            Manual override
          </p>
          <button
            type="button"
            disabled={isActioning}
            onClick={() => onStatusOverride("closed")}
            className="rounded-lg border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 transition hover:border-zinc-400/30 hover:text-zinc-300 disabled:opacity-40"
          >
            Close Early
          </button>
          <button
            type="button"
            disabled={isActioning}
            onClick={() => onStatusOverride("drawn")}
            className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition hover:border-amber-400/40 disabled:opacity-40"
          >
            Mark as Drawn
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isActioning}
          onClick={onViewTickets}
          className="flex-1 rounded-xl border border-purple-400/20 bg-purple-500/10 py-2 text-xs font-semibold text-purple-300 transition hover:border-purple-400/40 hover:bg-purple-500/20 disabled:opacity-40"
        >
          View Tickets
        </button>
        <button
          type="button"
          disabled={isActioning}
          onClick={onEdit}
          className="flex-1 rounded-xl border border-white/12 bg-white/[0.03] py-2 text-xs font-semibold text-zinc-300 transition hover:border-amber-400/30 hover:text-amber-200 disabled:opacity-40"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isActioning}
          onClick={onDelete}
          className="flex-1 rounded-xl border border-red-400/20 bg-red-500/10 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DrawManagement() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDraw, setEditDraw] = useState<DrawForEdit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Draw | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewTicketsDraw, setViewTicketsDraw] = useState<Draw | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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
      const r = await fetch(`/api/admin/draws/${draw.id}`, {
        method: "DELETE",
      });
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

  const handleStatusOverride = async (
    draw: Draw,
    newStatus: "drawn" | "closed",
  ) => {
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

  // Partition draws into active/upcoming vs history
  const liveDraws = draws.filter(
    (d) => d.status === "active" || d.status === "upcoming",
  );
  const historyDraws = draws.filter(
    (d) => d.status === "closed" || d.status === "drawn",
  );

  return (
    <div className="space-y-6">
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

      {/* ── Draw list ── */}
      {!viewTicketsDraw && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              {liveDraws.length} active / upcoming · {historyDraws.length} in history
            </p>
            <button
              type="button"
              onClick={() => {
                setEditDraw(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-amber-400 hover:to-orange-400"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
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

          {/* ── Info banner ── */}
          <div className="rounded-xl border border-blue-400/15 bg-blue-500/[0.05] px-4 py-3 text-xs text-blue-300/80">
            <span className="font-semibold">Auto-managed:</span> Status (upcoming → active → closed) is computed from dates. Draws auto-renew every 7 days. Use &ldquo;Mark as Drawn&rdquo; to declare a winner.
          </div>

          {/* ── Active / upcoming draws ── */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : liveDraws.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center">
              <p className="text-sm font-semibold text-zinc-300">
                No active or upcoming draws
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Create a draw — it activates automatically at midnight IST on the chosen date.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence>
                {liveDraws.map((draw, i) => (
                  <motion.div
                    key={draw.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                  >
                    <DrawCard
                      draw={draw}
                      isActioning={actionLoading === draw.id}
                      onEdit={() => {
                        setEditDraw(draw);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleteTarget(draw)}
                      onViewTickets={() => setViewTicketsDraw(draw)}
                      onStatusOverride={(s) => handleStatusOverride(draw, s)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* ── History section ── */}
          {historyDraws.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-zinc-400 transition hover:border-white/14 hover:text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-500"
                    aria-hidden
                  >
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Draw History ({historyDraws.length})
                </span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`transition-transform ${showHistory ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {historyDraws.map((draw, i) => (
                        <motion.div
                          key={draw.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <DrawCard
                            draw={draw}
                            isActioning={actionLoading === draw.id}
                            onEdit={() => {
                              setEditDraw(draw);
                              setFormOpen(true);
                            }}
                            onDelete={() => setDeleteTarget(draw)}
                            onViewTickets={() => setViewTicketsDraw(draw)}
                            onStatusOverride={(s) =>
                              handleStatusOverride(draw, s)
                            }
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Draw form modal */}
          <DrawFormModal
            open={formOpen}
            editDraw={editDraw}
            onClose={() => {
              setFormOpen(false);
              setEditDraw(null);
            }}
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
