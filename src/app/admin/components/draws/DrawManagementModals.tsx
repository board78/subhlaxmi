"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDrawNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DrawFormModal, type DrawForEdit } from "../DrawFormModal";
import { AdminTicketView } from "../AdminTicketView";

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

export function DeleteConfirm({
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

export function DrawCard({
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
              <span className="bg-[#D11A3A]/20 text-[#D11A3A] border border-[#D11A3A]/30 px-2 py-0.5 rounded-full text-xs font-bold tracking-widest ml-3">
                {formatDrawNumber(draw.drawNumber)}
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


