"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTicket = {
  id: string;
  number: string;
  series: string;
  numericPart: number;
  status: "available" | "sold";
  category: "regular" | "lp_special" | "special";
  bookedAt: string | null;
};

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
};

type TicketPage = {
  tickets: AdminTicket[];
  total: number;
  hasMore: boolean;
  page: number;
  summary: { total: number; available: number; sold: number };
};

type Props = { draw: Draw; onBack: () => void };
type StatusFilter = "all" | "available" | "sold";

const QUICK_AMOUNTS = [1, 5, 10, 20, 50] as const;

// ─── Ticket button (same look as user side) ───────────────────────────────────

function AdminTicketBtn({
  ticket,
  isSelected,
  onToggle,
  onStatusChange,
  actionLoading,
}: {
  ticket: AdminTicket;
  isSelected: boolean;
  onToggle: (t: AdminTicket) => void;
  onStatusChange: (t: AdminTicket, newStatus: "available" | "sold") => void;
  actionLoading: string | null;
}) {
  const isSold = ticket.status === "sold";
  const isLp = ticket.category === "lp_special";
  const isLoading = actionLoading === ticket.id;

  const base =
    "group relative flex flex-col items-center justify-center rounded-lg border py-2 text-[11px] font-mono font-semibold leading-tight transition select-none";

  const style = isSold
    ? `${base} border-zinc-700/50 bg-zinc-800/60 text-zinc-600 cursor-default`
    : isSelected
    ? `${base} border-amber-300 bg-amber-300/20 text-amber-200 shadow-[0_0_8px_rgba(255,195,80,0.25)] cursor-pointer`
    : isLp
    ? `${base} border-cyan-400/30 bg-cyan-400/10 text-cyan-300 cursor-pointer hover:border-cyan-400/60`
    : `${base} border-white/12 bg-white/[0.04] text-zinc-300 cursor-pointer hover:border-amber-200/30 hover:bg-amber-300/8 hover:text-amber-100`;

  return (
    <div className="relative" title={`${ticket.number} · ${ticket.status}`}>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => !isSold && onToggle(ticket)}
        className={`${style} w-full px-1`}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
            <span className="h-3 w-3 animate-spin rounded-full border border-t-amber-300 border-white/20" />
          </span>
        )}
        <span className="tabular-nums">{ticket.number.split("-").pop()}</span>
        {isLp && <span className="mt-0.5 text-[8px] text-cyan-400/80">LP</span>}
        {isSold && <span className="mt-0.5 text-[8px] text-zinc-600">Sold</span>}
      </button>

      {/* Admin quick toggle — shown on hover via group */}
      <button
        type="button"
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(ticket, isSold ? "available" : "sold");
        }}
        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full border border-white/15 bg-[#170d14] text-[9px] text-zinc-400 shadow hover:text-white group-hover:flex"
        title={isSold ? "Mark available" : "Mark sold"}
      >
        {isSold ? "✓" : "✕"}
      </button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TicketSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-1.5 pt-1 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
      {[...Array(40)].map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.06]" />
      ))}
    </div>
  );
}

// ─── Main AdminTicketView ─────────────────────────────────────────────────────

export function AdminTicketView({ draw, onBack }: Props) {
  const [activeSeries, setActiveSeries] = useState(draw.series[0] ?? "A");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [ticketData, setTicketData] = useState<TicketPage | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchTickets = useCallback(
    async (pageNum: number, append = false) => {
      const params = new URLSearchParams({
        series: activeSeries,
        page: String(pageNum),
        limit: "200",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);

      if (!append) setLoadingTickets(true);
      else setLoadingMore(true);

      setError("");
      try {
        const res = await fetch(`/api/admin/draws/${draw.id}/tickets?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load tickets.");
        const data = (await res.json()) as TicketPage;
        setTicketData((prev) =>
          append && prev
            ? { ...data, tickets: [...prev.tickets, ...data.tickets] }
            : data,
        );
        setPage(pageNum);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error loading tickets.");
      } finally {
        setLoadingTickets(false);
        setLoadingMore(false);
      }
    },
    [draw.id, activeSeries, statusFilter, debouncedSearch],
  );

  useEffect(() => {
    void fetchTickets(1);
    setSelected(new Set());
  }, [fetchTickets]);

  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0 });
  }, [activeSeries, statusFilter]);

  // Toggle selection
  const toggleTicket = (t: AdminTicket) => {
    if (t.status === "sold") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t.id)) next.delete(t.id);
      else if (next.size < 200) next.add(t.id);
      return next;
    });
  };

  // Quick pick — select N available tickets
  const quickPick = (amount: number) => {
    const available = ticketData?.tickets.filter(
      (t) => t.status === "available" && !selected.has(t.id),
    ) ?? [];
    const toAdd = available.slice(0, amount - selected.size);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const t of toAdd) {
        if (next.size >= 200) break;
        next.add(t.id);
      }
      return next;
    });
  };

  // Mark selected tickets as sold / available
  const markSelected = async (newStatus: "available" | "sold") => {
    const ids = [...selected];
    setSelected(new Set());
    for (const ticketId of ids) {
      setActionLoading(ticketId);
      await fetch(`/api/admin/draws/${draw.id}/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setActionLoading(null);
    }
    void fetchTickets(1);
  };

  // Toggle single ticket status
  const handleStatusChange = async (t: AdminTicket, newStatus: "available" | "sold") => {
    setActionLoading(t.id);
    try {
      await fetch(`/api/admin/draws/${draw.id}/tickets/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setTicketData((prev) =>
        prev
          ? {
              ...prev,
              tickets: prev.tickets.map((tk) =>
                tk.id === t.id ? { ...tk, status: newStatus } : tk,
              ),
              summary: {
                ...prev.summary,
                available:
                  newStatus === "sold"
                    ? prev.summary.available - 1
                    : prev.summary.available + 1,
                sold:
                  newStatus === "sold"
                    ? prev.summary.sold + 1
                    : prev.summary.sold - 1,
              },
            }
          : prev,
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Regenerate all tickets
  const handleRegenerate = async () => {
    if (!confirm("This will delete all AVAILABLE tickets and regenerate them. Sold tickets are kept. Continue?")) return;
    setRegenerating(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/draws/${draw.id}/tickets`, { method: "PUT" });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Regeneration failed.");
      }
      const d = (await r.json()) as { inserted: number };
      alert(`✅ Regenerated ${d.inserted.toLocaleString("en-IN")} tickets.`);
      void fetchTickets(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setRegenerating(false);
    }
  };

  const summary = ticketData?.summary;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0809]">
      {/* ── Header ── */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-amber-200/10 bg-[#110b0d] px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 text-zinc-400 transition hover:border-white/25 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h2 className="text-base font-bold text-white">{draw.name}</h2>
            <p className="text-[11px] text-zinc-500">
              {draw.ticketPrefix} · ₹{draw.pricePerTicket}/ticket ·{" "}
              {new Date(draw.drawDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{" "}
              {draw.drawTime}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {summary && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px]">
              <span className="text-zinc-500">Total: <span className="font-bold text-zinc-200">{summary.total.toLocaleString("en-IN")}</span></span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">Available: <span className="font-bold text-emerald-300">{summary.available.toLocaleString("en-IN")}</span></span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">Sold: <span className="font-bold text-red-400">{summary.sold.toLocaleString("en-IN")}</span></span>
            </div>
          )}
          <button
            type="button"
            disabled={regenerating}
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:border-amber-400/45 hover:bg-amber-500/20 disabled:opacity-50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            {regenerating ? "Regenerating…" : "Regenerate Tickets"}
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 border-b border-red-400/15 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* ── Series + filters ── */}
      <div className="shrink-0 border-b border-white/8 bg-[#0f0a0c] px-4 py-3 sm:px-5">
        {/* Series tabs */}
        <div className="flex flex-wrap gap-2">
          {draw.series.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setActiveSeries(s); setPage(1); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
                activeSeries === s
                  ? "border-amber-300 bg-amber-300/15 text-amber-200"
                  : "border-white/12 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
              }`}
            >
              {s} Series
            </button>
          ))}
        </div>

        {/* Status filter + search */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {(["all", "available", "sold"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg border px-3 py-1 text-[11px] font-semibold capitalize transition ${
                statusFilter === f
                  ? "border-amber-400/40 bg-amber-400/12 text-amber-200"
                  : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket number…"
            className="ml-auto w-48 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50"
          />
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="shrink-0 flex flex-wrap gap-3 px-4 py-2 sm:px-5 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-white/12 bg-white/[0.04]" />Available</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-300/20 border border-amber-300" />Selected</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-zinc-800" />Sold</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-cyan-400/30 bg-cyan-400/10" />LP Special</span>
        <span className="ml-auto text-zinc-600 text-[10px]">Hover ticket → click ✕/✓ to toggle status</span>
      </div>

      {/* ── Ticket grid ── */}
      <div
        ref={gridRef}
        className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-2 sm:px-5"
      >
        {loadingTickets ? (
          <TicketSkeleton />
        ) : ticketData?.tickets.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-500">
            <p className="text-sm font-semibold">No tickets found</p>
            <p className="text-xs">Try a different series, filter, or search term.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5 pt-1 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {ticketData?.tickets.map((ticket) => (
                <AdminTicketBtn
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selected.has(ticket.id)}
                  onToggle={toggleTicket}
                  onStatusChange={handleStatusChange}
                  actionLoading={actionLoading}
                />
              ))}
            </div>

            {ticketData?.hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => fetchTickets(page + 1, true)}
                  className="rounded-full border border-white/15 px-6 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-white/30 disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more tickets"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Quick pick + bulk actions footer ── */}
      <div className="shrink-0 border-t border-white/8 bg-[#110b0d] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Pick:</span>
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={selected.size >= 200}
              onClick={() => quickPick(amt)}
              className="rounded-lg border border-amber-200/20 bg-amber-300/8 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:border-amber-300/50 hover:bg-amber-300/15 disabled:opacity-40"
            >
              {amt}
            </button>
          ))}

          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="ml-auto flex items-center gap-2"
              >
                <span className="text-xs font-semibold text-amber-200">
                  {selected.size} selected
                </span>
                <button
                  type="button"
                  onClick={() => void markSelected("sold")}
                  className="rounded-lg border border-red-400/25 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:border-red-400/45 hover:bg-red-500/25"
                >
                  Mark Sold
                </button>
                <button
                  type="button"
                  onClick={() => void markSelected("available")}
                  className="rounded-lg border border-emerald-400/25 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/45 hover:bg-emerald-500/25"
                >
                  Mark Available
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
