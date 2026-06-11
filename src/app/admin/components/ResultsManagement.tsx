"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy } from "react-icons/fa6";
import { formatDrawNumber } from "@/lib/utils";

type Draw = {
  id: string;
  name: string;
  drawNumber?: number;
  status: string;
  prizeAmount?: string;
};

type Result = {
  id: string;
  drawId: string;
  drawName: string;
  drawNumber?: number;
  winningTicket: string;
  prize: string;
  winnerName: string | null;
  winnerUserId: string | null;
  winnerImage: string | null;
  declaredAt: string;
};

/* ─── Searchable Ticket Select ───────────────────────────────────────────── */

type BookedTicket = {
  ticketId: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
};

function SearchableTicketSelect({
  tickets,
  selectedTicket,
  onSelect,
  loading,
}: {
  tickets: BookedTicket[];
  selectedTicket: BookedTicket | null;
  onSelect: (ticket: BookedTicket | null) => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = tickets.filter(
    (t) =>
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div
        className="w-full rounded-lg border border-white/10 bg-[#0f0810]/80 px-3 py-2 text-[13px] text-zinc-200 outline-none transition focus-within:border-amber-400/50 focus-within:ring-1 focus-within:ring-amber-400/20 cursor-text flex items-center justify-between"
        onClick={() => setIsOpen(true)}
      >
        {selectedTicket && !isOpen ? (
          <div className="flex items-center gap-2">
            {selectedTicket.userImage ? (
              <img src={selectedTicket.userImage} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-bold text-amber-300">
                {selectedTicket.userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold">{selectedTicket.userName}</span>
            <span className="text-zinc-500 text-xs">({selectedTicket.ticketNumber})</span>
          </div>
        ) : (
          <input
            type="text"
            className="w-full bg-transparent outline-none placeholder-zinc-600"
            placeholder={loading ? "Loading tickets..." : "Search winner by name or ticket..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            disabled={loading}
          />
        )}
        
        {selectedTicket && !isOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setSearch("");
            }}
            className="text-zinc-500 hover:text-zinc-300 ml-2"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#170d14] shadow-xl custom-scrollbar"
            >
              {loading ? (
                <div className="p-3 text-center text-xs text-zinc-500">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-500">No sold tickets found for this draw.</div>
              ) : filtered.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-500">No matching tickets found.</div>
              ) : (
                <div className="py-1">
                  {filtered.map((t) => (
                    <button
                      key={t.ticketId}
                      type="button"
                      onClick={() => {
                        onSelect(t);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.04] transition"
                    >
                      {t.userImage ? (
                        <img src={t.userImage} alt="" className="h-7 w-7 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                          {t.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-zinc-200 truncate">{t.userName}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{t.userEmail}</div>
                      </div>
                      <div className="shrink-0 text-xs font-mono font-medium text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        {t.ticketNumber}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Declare Modal ─────────────────────────────────────────────────────── */

function DeclareModal({
  draws,
  onClose,
  onDeclared,
}: {
  draws: Draw[];
  onClose: () => void;
  onDeclared: () => void;
}) {
  const [drawId, setDrawId] = useState(draws[0]?.id ?? "");
  const [prize, setPrize] = useState(draws[0]?.prizeAmount ?? "");
  const [tickets, setTickets] = useState<BookedTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<BookedTicket | null>(null);
  
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inp =
    "w-full rounded-lg border border-white/10 bg-[#0f0810]/80 px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20";
  const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500";

  // Fetch booked tickets when draw changes
  useEffect(() => {
    if (!drawId) {
      setTimeout(() => {
        setTickets([]);
        setSelectedTicket(null);
      }, 0);
      return;
    }

    // Auto-fill prize based on selected draw
    const selectedDraw = draws.find(d => d.id === drawId);
    if (selectedDraw && selectedDraw.prizeAmount) {
      setPrize(selectedDraw.prizeAmount);
    } else {
      setPrize("");
    }

    const fetchTickets = async () => {
      setLoadingTickets(true);
      setSelectedTicket(null);
      try {
        const res = await fetch(`/api/admin/draws/${drawId}/booked-tickets`);
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets || []);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error(err);
        setTickets([]);
      } finally {
        setLoadingTickets(false);
      }
    };
    
    fetchTickets();
  }, [drawId, draws]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) {
      setError("Please select a winning ticket & user.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          drawId, 
          winningTicket: selectedTicket.ticketNumber, 
          prize, 
          winnerName: selectedTicket.userName,
          winnerUserId: selectedTicket.userId,
        }),
      });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Failed to declare result.");
      }
      onDeclared();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Declare Result" subtitle="Announce the winning lottery ticket" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && <ErrorBanner msg={error} />}
        
                  {/* Select Draw dropdown */}
          <div>
          <label className={lbl}>Select Draw <span className="text-amber-400">*</span></label>
          <select value={drawId} onChange={(e) => setDrawId(e.target.value)} required className={inp}>
            <option value="" className="bg-[#170d14]">— Select a draw —</option>
            {draws.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#170d14]">
                {d.drawNumber != null ? `${formatDrawNumber(d.drawNumber)} — ` : ""}{d.name} ({d.status})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Select Winner & Ticket <span className="text-amber-400">*</span></label>
          <SearchableTicketSelect 
            tickets={tickets} 
            selectedTicket={selectedTicket} 
            onSelect={setSelectedTicket}
            loading={loadingTickets} 
          />
        </div>

        <div>
          <label className={lbl}>Prize Amount <span className="text-amber-400">*</span></label>
          <input type="text" required value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="e.g. ₹5,00,000" className={inp} />
        </div>

        <ModalFooter onCancel={onClose} saving={saving} label="Declare Result" />
      </form>
    </ModalShell>
  );
}

/* ─── Edit Modal ─────────────────────────────────────────────────────────── */

function EditModal({
  result,
  onClose,
  onSaved,
}: {
  result: Result;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [winningTicket, setWinningTicket] = useState(result.winningTicket);
  const [prize, setPrize] = useState(result.prize);
  const [winnerName, setWinnerName] = useState(result.winnerName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inp =
    "w-full rounded-lg border border-white/10 bg-[#0f0810]/80 px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20";
  const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/results/${result.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningTicket, prize, winnerName: winnerName || null }),
      });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Update failed.");
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Edit Result" subtitle={`Editing result for: ${result.drawName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && <ErrorBanner msg={error} />}

        {/* Read-only draw name */}
        <div>
          <p className={lbl}>Draw</p>
          <p className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[13px] text-zinc-400">
            {result.drawName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Winning Ticket <span className="text-amber-400">*</span></label>
            <input type="text" required value={winningTicket}
              onChange={(e) => setWinningTicket(e.target.value.toUpperCase())}
              placeholder="SL-A-45231" className={inp} />
          </div>
          <div>
            <label className={lbl}>Prize Amount <span className="text-amber-400">*</span></label>
            <input type="text" required value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="₹5,00,000" className={inp} />
          </div>
        </div>

        <div>
          <label className={lbl}>Winner Name <span className="text-zinc-600">(optional)</span></label>
          <input type="text" value={winnerName}
            onChange={(e) => setWinnerName(e.target.value)}
            placeholder="e.g. Ramesh Kumar" className={inp} />
        </div>

        <ModalFooter onCancel={onClose} saving={saving} label="Save Changes" />
      </form>
    </ModalShell>
  );
}

/* ─── Delete Confirm ─────────────────────────────────────────────────────── */

function DeleteConfirm({
  result,
  onConfirm,
  onCancel,
}: {
  result: Result;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#170d14] p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-white">Delete Result</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Are you sure you want to delete the result for{" "}
              <span className="font-semibold text-zinc-200">&quot;{result.drawName}&quot;</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-lg border border-white/12 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-white/22 hover:text-zinc-200">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500/80 py-2.5 text-xs font-bold text-white transition hover:bg-red-500">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Shared Helpers ─────────────────────────────────────────────────────── */

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
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
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition hover:border-white/20 hover:text-zinc-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
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
      <button type="button" onClick={onCancel}
        className="flex-1 rounded-lg border border-white/12 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-white/22 hover:text-zinc-200">
        Cancel
      </button>
      <button type="submit" disabled={saving}
        className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-60">
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

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
