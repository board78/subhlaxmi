"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DrawCard } from "./DrawManagementModals";
import type { DrawForEdit } from "../DrawFormModal";

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
  status: string;
  storedStatus: string;
  createdAt: string;
};

type Props = {
  liveDraws: Draw[];
  historyDraws: Draw[];
  loading: boolean;
  actionLoading: string | null;
  setEditDraw: (draw: DrawForEdit) => void;
  setFormOpen: (open: boolean) => void;
  setDeleteTarget: (draw: Draw) => void;
  setViewTicketsDraw: (draw: Draw) => void;
  handleStatusOverride: (draw: Draw, s: "drawn" | "closed") => void;
};

export function DrawList({
  liveDraws,
  historyDraws,
  loading,
  actionLoading,
  setEditDraw,
  setFormOpen,
  setDeleteTarget,
  setViewTicketsDraw,
  handleStatusOverride,
}: Props) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      {/* 🚀 Active / upcoming draws 🚀 */}
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

      {/* ⏳ History section ⏳ */}
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
    </>
  );
}
