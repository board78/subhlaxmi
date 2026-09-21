"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy } from "react-icons/fa6";
import { formatDrawNumber } from "@/lib/utils";

import { DeclareModal, EditModal, DeleteConfirm, ErrorBanner, type Draw, type Result } from "./results/ResultsModals";

export function ResultsManagement() {
  const [results, setResults] = useState<Result[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [declareOpen, setDeclareOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Result | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Result | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [resR, drawR] = await Promise.all([
        fetch("/api/admin/results"),
        fetch("/api/admin/draws"),
      ]);
      if (!resR.ok || !drawR.ok) throw new Error("Failed to load data.");
      const [resData, drawData] = await Promise.all([
        resR.json() as Promise<{ results: Result[] }>,
        drawR.json() as Promise<{ draws: Draw[] }>,
      ]);
      setResults(resData.results);
      setDraws(drawData.draws);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchAll();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const handleDelete = async (result: Result) => {
    setDeleteTarget(null);
    setActionLoading(result.id);
    try {
      const r = await fetch(`/api/admin/results/${result.id}`, { method: "DELETE" });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Delete failed.");
      }
      await fetchAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">{results.length} result{results.length !== 1 ? "s" : ""} declared</p>
        <button
          type="button"
          onClick={() => setDeclareOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-amber-400 hover:to-orange-400"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Declare Result
        </button>
      </div>

      {error && <ErrorBanner msg={error} />}

      {/* Results list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center flex flex-col items-center justify-center">
          <div className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] p-4 bg-white/5 rounded-full border border-white/5 flex items-center justify-center mb-3">
            <FaTrophy className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-zinc-300">No results declared yet</p>
          <p className="mt-1 text-xs text-zinc-500">Use the button above to declare a lottery result.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {results.map((result, i) => {
              const isActioning = actionLoading === result.id;
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, delay: i * 0.04 }}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 transition hover:border-white/18"
                >
                  {/* User Avatar or Trophy icon */}
                  {result.winnerImage ? (
                    <img src={result.winnerImage} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/12 border border-amber-400/20 text-amber-400">
                      <FaTrophy className="w-5 h-5" />
                    </span>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-zinc-100">{result.drawName}</p>
                      {result.drawNumber != null && (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs font-medium mr-2">
                          {formatDrawNumber(result.drawNumber)}
                        </span>
                      )}
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                        {result.winningTicket}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                      <span>
                        Prize:{" "}
                        <span className="font-semibold text-emerald-400">{result.prize}</span>
                      </span>
                      {result.winnerName && (
                        <span>
                          Winner:{" "}
                          <span className="text-zinc-300">{result.winnerName}</span>
                        </span>
                      )}
                      <span>
                        {new Date(result.declaredAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => setEditTarget(result)}
                      title="Edit result"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-zinc-400 transition hover:border-amber-400/35 hover:bg-amber-400/10 hover:text-amber-300 disabled:opacity-40"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => setDeleteTarget(result)}
                      title="Delete result"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-400 transition hover:border-red-400/45 hover:bg-red-500/20 disabled:opacity-40"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {declareOpen && (
          <DeclareModal
            draws={draws}
            onClose={() => setDeclareOpen(false)}
            onDeclared={fetchAll}
          />
        )}
        {editTarget && (
          <EditModal
            result={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={fetchAll}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            result={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
