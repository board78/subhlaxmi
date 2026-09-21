"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDrawNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DrawFormModal, type DrawForEdit } from "./DrawFormModal";
import { AdminTicketView } from "./AdminTicketView";
import { DrawCard, DeleteConfirm } from "./draws/DrawManagementModals";
import { DrawList } from "./draws/DrawList";

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

          {/* 🚀 Active / upcoming draws & History 🚀 */}
          <DrawList
            liveDraws={liveDraws}
            historyDraws={historyDraws}
            loading={loading}
            actionLoading={actionLoading}
            setEditDraw={setEditDraw}
            setFormOpen={setFormOpen}
            setDeleteTarget={setDeleteTarget}
            setViewTicketsDraw={setViewTicketsDraw}
            handleStatusOverride={handleStatusOverride}
          />

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
