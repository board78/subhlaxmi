"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDrawNumber } from "@/lib/utils";

export type DrawFormData = {
  drawSeriesName: string;
  drawTime: string;
  pricePerTicket: number | "";
  series: string;
  ticketPrefix: string;
  ticketRangeStart: number | "";
  ticketRangeEnd: number | "";
  prizeAmount: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  statusOverride: "auto" | "upcoming" | "active" | "closed" | "drawn";
};

const EMPTY_FORM: DrawFormData = {
  drawSeriesName: "",
  drawTime: "",
  pricePerTicket: "",
  series: "A,B,C",
  ticketPrefix: "SL",
  ticketRangeStart: 10000,
  ticketRangeEnd: 99999,
  prizeAmount: "",
  startDate: "",
  startTime: "00:00",
  endDate: "",
  endTime: "23:59",
  statusOverride: "auto",
};

export type DrawForEdit = {
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
  prizeAmount?: string;
};

type Props = {
  open: boolean;
  editDraw: DrawForEdit | null;
  onClose: () => void;
  onSaved: () => void;
};

function toISTDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:30`);
}

function fromISO(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return {
    date: ist.toISOString().slice(0, 10),
    time: ist.toISOString().slice(11, 16),
  };
}

// ── Shared style tokens ──────────────────────────────────────────────────────
const inp =
  "w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition-all duration-150 focus:border-amber-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-400/10";

const lbl =
  "mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const IconPlay = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconStop = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconClose = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
);
const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
  </svg>
);
const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const IconTicket = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
  </svg>
);

// ── Section divider ──────────────────────────────────────────────────────────
function SectionHeader({ icon, label, accent }: { icon: React.ReactNode; label: string; accent: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${accent}`}>
      <span className="opacity-80">{icon}</span>
      <span className="text-[10.5px] font-bold uppercase tracking-[0.16em]">{label}</span>
    </div>
  );
}

export function DrawFormModal({ open, editDraw, onClose, onSaved }: Props) {
  const [form, setForm] = useState<DrawFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // "7days" = auto-compute end from start+7d; "custom" = manual end date
  const [durationMode, setDurationMode] = useState<"7days" | "custom">("7days");

  useEffect(() => {
    if (!open) return;
    if (editDraw) {
      const start = fromISO(editDraw.activatesAt);
      const end   = fromISO(editDraw.expiresAt);
      const rawStatus = editDraw.status as DrawFormData["statusOverride"];
      const knownStatuses: DrawFormData["statusOverride"][] = ["upcoming", "active", "closed", "drawn"];
      const statusOverride = knownStatuses.includes(rawStatus) ? rawStatus : "auto";
      // Detect if the existing draw is 7 days exactly
      const startMs = new Date(editDraw.activatesAt).getTime();
      const endMs   = new Date(editDraw.expiresAt).getTime();
      const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
      setDurationMode(diffDays === 7 ? "7days" : "custom");
      setForm({
        drawSeriesName: editDraw.drawSeriesName ?? editDraw.name,
        drawTime: editDraw.drawTime,
        pricePerTicket: editDraw.pricePerTicket,
        series: editDraw.series.join(","),
        ticketPrefix: editDraw.ticketPrefix,
        ticketRangeStart: editDraw.ticketRangeStart,
        ticketRangeEnd: editDraw.ticketRangeEnd,
        prizeAmount: editDraw.prizeAmount || "",
        startDate: start.date,
        startTime: start.time,
        endDate: end.date,
        endTime: end.time,
        statusOverride,
      });
    } else {
      setForm(EMPTY_FORM);
      setDurationMode("7days");
    }
    setError("");
  }, [open, editDraw]);

  const set = (key: keyof DrawFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // When durationMode is "7days", derive endDate/endTime from startDate+7 days
  const effectiveEndDate = durationMode === "7days" && form.startDate
    ? (() => {
        const d = new Date(`${form.startDate}T${form.startTime}:00+05:30`);
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
      })()
    : form.endDate;
  const effectiveEndTime = durationMode === "7days" ? form.startTime : form.endTime;

  const previewActivatesAt = form.startDate && form.startTime ? toISTDate(form.startDate, form.startTime) : null;
  const previewExpiresAt   = effectiveEndDate && effectiveEndTime ? toISTDate(effectiveEndDate, effectiveEndTime) : null;

  const durationMs = previewActivatesAt && previewExpiresAt
    ? previewExpiresAt.getTime() - previewActivatesAt.getTime()
    : null;

  const durationLabel = (() => {
    if (!durationMs || durationMs <= 0) return null;
    const hrs = durationMs / (1000 * 60 * 60);
    if (hrs < 24) return `${Math.round(hrs)}h`;
    const d = hrs / 24;
    return `${d % 1 === 0 ? d.toFixed(0) : d.toFixed(1)} days`;
  })();

  const computedAutoStatus = (() => {
    if (!previewActivatesAt || !previewExpiresAt) return null;
    const now = new Date();
    if (now < previewActivatesAt) return "upcoming";
    if (now < previewExpiresAt) return "active";
    return "closed";
  })();

  const fmtDT = (d: Date | null) =>
    d ? d.toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    }) + " IST" : "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.startTime) { setError("Start date and time are required."); return; }
    if (durationMode === "custom" && (!form.endDate || !form.endTime)) {
      setError("End date and time are required."); return;
    }
    if (previewActivatesAt && previewExpiresAt && previewExpiresAt <= previewActivatesAt) {
      setError("End date/time must be after start date/time."); return;
    }
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = {
      drawSeriesName: form.drawSeriesName.trim(),
      drawTime: form.drawTime,
      pricePerTicket: Number(form.pricePerTicket),
      ticketRangeStart: Number(form.ticketRangeStart),
      ticketRangeEnd: Number(form.ticketRangeEnd),
      series: form.series.split(",").map((s) => s.trim()).filter(Boolean),
      ticketPrefix: form.ticketPrefix,
      prizeAmount: form.prizeAmount,
      startDate: form.startDate,
      startTime: form.startTime,
      endDate: effectiveEndDate,
      endTime: effectiveEndTime,
    };
    if (form.statusOverride !== "auto") payload.status = form.statusOverride;
    try {
      const r = await fetch(
        editDraw ? `/api/admin/draws/${editDraw.id}` : "/api/admin/draws",
        { method: editDraw ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      );
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Save failed.");
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const previewName = form.drawSeriesName.trim()
    ? editDraw?.drawNumber
      ? `${form.drawSeriesName.trim()} ${formatDrawNumber(editDraw.drawNumber)}`
      : `${form.drawSeriesName.trim()} #N`
    : "";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[640px] rounded-2xl border border-white/[0.07] bg-[#130a10] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh]"
          >
            {/* ── Header ───────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
                  <IconStar />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-2">
                    {editDraw ? "Edit Draw" : "Create New Draw"}
                    {editDraw?.drawNumber != null && (
                      <span className="bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 px-2 py-0.5 rounded-full text-xs font-bold ml-2">
                        {formatDrawNumber(editDraw.drawNumber)}
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {editDraw ? "Update configuration and schedule" : "Configure draw details and schedule"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition hover:border-white/20 hover:text-zinc-300 hover:bg-white/5"
              >
                <IconClose />
              </button>
            </div>

            {/* ── Body ─────────────────────────────────────── */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} id="draw-form">
                <div className="px-6 py-5 space-y-6">

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[12px] text-red-300">
                      <span className="mt-0.5 shrink-0 text-red-400"><IconAlert /></span>
                      {error}
                    </div>
                  )}

                  {/* ── Basics ────────────────────────────── */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>
                        Series Name <span className="text-amber-500 normal-case tracking-normal ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.drawSeriesName}
                        onChange={(e) => set("drawSeriesName", e.target.value)}
                        placeholder="e.g. Subhlaxmi"
                        className={inp}
                      />
                      {previewName && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-400/80">
                          <IconChevron />
                          <span className="font-semibold">{previewName}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={lbl}>
                        Prize Amount
                        <span className="ml-1.5 normal-case tracking-normal text-zinc-600 font-normal text-[10px]">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.prizeAmount}
                        onChange={(e) => set("prizeAmount", e.target.value)}
                        placeholder="e.g. ₹5,00,000"
                        className={inp}
                      />
                    </div>
                  </div>

                  {/* ── Schedule ──────────────────────────── */}
                  <div className="space-y-4">
                    <SectionHeader
                      icon={<IconPlay />}
                      label="Schedule"
                      accent="bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/15 rounded-lg"
                    />

                    {/* Duration Mode Toggle */}
                    <div>
                      <p className={`${lbl} mb-2`}>Duration</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["7days", "custom"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setDurationMode(mode)}
                            className={`flex flex-col items-center rounded-xl border py-2.5 px-3 text-center transition-all duration-150 ${
                              durationMode === mode
                                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20"
                                : "border-white/[0.07] text-zinc-500 bg-white/[0.02] hover:border-white/15 hover:text-zinc-300"
                            }`}
                          >
                            <span className="text-[12px] font-bold">{mode === "7days" ? "7 Days" : "Custom"}</span>
                            <span className="text-[9px] mt-0.5 opacity-60">{mode === "7days" ? "Auto end after 7 days" : "Set custom end date"}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start date+time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>
                          <span className="flex items-center gap-1.5"><IconCalendar /> Start Date <span className="text-amber-500">*</span></span>
                        </label>
                        <input
                          type="date"
                          required
                          value={form.startDate}
                          onChange={(e) => set("startDate", e.target.value)}
                          className={inp}
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                      <div>
                        <label className={lbl}>
                          <span className="flex items-center gap-1.5"><IconClock /> Start Time (IST) <span className="text-amber-500">*</span></span>
                        </label>
                        <input
                          type="time"
                          required
                          value={form.startTime}
                          onChange={(e) => set("startTime", e.target.value)}
                          className={inp}
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                    </div>

                    {previewActivatesAt && (
                      <p className="text-[11px] text-emerald-400/70 pl-1">
                        Goes active: <span className="font-semibold text-emerald-300">{fmtDT(previewActivatesAt)}</span>
                      </p>
                    )}

                    {/* Custom end date (only shown in custom mode) */}
                    {durationMode === "custom" && (
                      <div className="space-y-3">
                        <SectionHeader
                          icon={<IconStop />}
                          label="Closing Schedule — Draw stops accepting"
                          accent="bg-rose-500/[0.08] text-rose-400 border border-rose-500/15 rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={lbl}>
                              <span className="flex items-center gap-1.5"><IconCalendar /> End Date <span className="text-amber-500">*</span></span>
                            </label>
                            <input
                              type="date"
                              required
                              value={form.endDate}
                              onChange={(e) => set("endDate", e.target.value)}
                              className={inp}
                              style={{ colorScheme: "dark" }}
                            />
                          </div>
                          <div>
                            <label className={lbl}>
                              <span className="flex items-center gap-1.5"><IconClock /> End Time (IST) <span className="text-amber-500">*</span></span>
                            </label>
                            <input
                              type="time"
                              required
                              value={form.endTime}
                              onChange={(e) => set("endTime", e.target.value)}
                              className={inp}
                              style={{ colorScheme: "dark" }}
                            />
                          </div>
                        </div>
                        {previewExpiresAt && (
                          <p className="text-[11px] text-rose-400/70 pl-1">
                            Closes: <span className="font-semibold text-rose-300">{fmtDT(previewExpiresAt)}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* 7-day auto preview */}
                    {durationMode === "7days" && previewActivatesAt && (
                      <p className="text-[11px] text-rose-400/70 pl-1">
                        Auto closes: <span className="font-semibold text-rose-300">{fmtDT(previewExpiresAt)}</span>
                      </p>
                    )}
                  </div>

                  {/* ── Schedule Summary ──────────────────── */}
                  {previewActivatesAt && previewExpiresAt && (
                    <div className={`rounded-xl border px-5 py-4 ${
                      durationMs && durationMs > 0
                        ? "border-white/[0.07] bg-white/[0.03]"
                        : "border-red-500/20 bg-red-500/[0.06]"
                    }`}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-3">
                        Schedule Summary
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-[12px]">
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Active from</p>
                          <p className="font-semibold text-emerald-300 leading-snug">{fmtDT(previewActivatesAt)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Closes at</p>
                          <p className="font-semibold text-rose-300 leading-snug">{fmtDT(previewExpiresAt)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Duration · Status</p>
                          <p className="font-semibold text-amber-300">
                            {durationMs && durationMs > 0 ? durationLabel : "⚠ Invalid"}
                          </p>
                          {computedAutoStatus && (
                            <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              computedAutoStatus === "active"   ? "bg-emerald-500/15 text-emerald-400" :
                              computedAutoStatus === "upcoming" ? "bg-blue-500/15 text-blue-400" :
                                                                  "bg-zinc-500/15 text-zinc-400"
                            }`}>
                              {computedAutoStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Result Display Time ───────────────── */}
                  <div>
                    <label className={lbl}>
                      Result Display Time <span className="text-amber-500">*</span>
                      <span className="ml-1.5 normal-case tracking-normal text-zinc-600 font-normal text-[10px]">— shown on draw card</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.drawTime}
                      onChange={(e) => set("drawTime", e.target.value)}
                      placeholder="e.g. 4:00 PM"
                      className={inp}
                    />
                    <p className="mt-1.5 text-[11px] text-zinc-600">
                      Displayed as result time on public draw cards
                    </p>
                  </div>

                  {/* ── Status Override ───────── */}
                  <div>
                    <label className={lbl}>
                        Status Override
                        <span className="ml-1.5 normal-case tracking-normal text-zinc-600 font-normal text-[10px]">— force a specific state</span>
                      </label>
                      <div className="grid grid-cols-5 gap-2 mt-1">
                        {([
                          { value: "auto",     label: "Auto",     sub: "Date-based" },
                          { value: "upcoming", label: "Upcoming", sub: "Not live yet" },
                          { value: "active",   label: "Active",   sub: "Live now" },
                          { value: "closed",   label: "Closed",   sub: "Ended" },
                          { value: "drawn",    label: "Drawn",    sub: "Result done" },
                        ] as const).map((opt) => {
                          const isSelected = form.statusOverride === opt.value;
                          const colors: Record<string, string> = {
                            auto:     "border-zinc-600/60 text-zinc-300 bg-zinc-800/40",
                            upcoming: "border-blue-500/50 text-blue-300 bg-blue-500/10",
                            active:   "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
                            closed:   "border-zinc-500/50 text-zinc-400 bg-zinc-700/20",
                            drawn:    "border-amber-500/50 text-amber-300 bg-amber-500/10",
                          };
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => set("statusOverride", opt.value)}
                              className={`flex flex-col items-center rounded-xl border py-2.5 px-1.5 text-center transition-all duration-150 ${
                                isSelected
                                  ? `${colors[opt.value]} ring-1 ring-inset ring-current/40 shadow-sm`
                                  : "border-white/[0.07] text-zinc-600 bg-white/[0.02] hover:border-white/15 hover:text-zinc-400"
                              }`}
                            >
                              <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                              <span className="text-[9px] mt-1 opacity-60 leading-tight">{opt.sub}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className={`mt-2 text-[11px] pl-0.5 ${form.statusOverride !== "auto" ? "text-amber-400/70" : "text-zinc-600"}`}>
                        {form.statusOverride !== "auto"
                          ? "Manual override active — date-based auto-compute is paused for this draw."
                          : "Status is automatically managed by start and end schedule."}
                      </p>
                    </div>

                  {/* Divider */}
                  <div className="border-t border-white/[0.05]" />

                  {/* ── Ticket Config ─────────────────────── */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-zinc-500"><IconTicket /></span>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-zinc-500">Ticket Configuration</p>
                    </div>

                    {/* Price · Series · Prefix */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className={lbl}>
                          Price / Ticket (₹) <span className="text-amber-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={form.pricePerTicket}
                          onChange={(e) => set("pricePerTicket", e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="100"
                          className={inp}
                        />
                      </div>
                      <div>
                        <label className={lbl}>
                          Series <span className="text-amber-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.series}
                          onChange={(e) => set("series", e.target.value)}
                          placeholder="A,B,C"
                          className={inp}
                        />
                      </div>
                      <div>
                        <label className={lbl}>
                          Prefix <span className="text-amber-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.ticketPrefix}
                          onChange={(e) => set("ticketPrefix", e.target.value.toUpperCase())}
                          placeholder="SL"
                          maxLength={6}
                          className={inp}
                        />
                      </div>
                    </div>

                    {/* Ticket Range */}
                    <div>
                      <label className={lbl}>
                        Ticket Number Range <span className="text-amber-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          required
                          value={form.ticketRangeStart}
                          onChange={(e) => set("ticketRangeStart", Number(e.target.value))}
                          placeholder="10000"
                          className={inp}
                        />
                        <span className="shrink-0 text-[11px] font-semibold text-zinc-600 px-1">TO</span>
                        <input
                          type="number"
                          required
                          value={form.ticketRangeEnd}
                          onChange={(e) => set("ticketRangeEnd", Number(e.target.value))}
                          placeholder="99999"
                          className={inp}
                        />
                      </div>
                      {form.ticketRangeStart !== "" && form.ticketRangeEnd !== "" && (
                        <p className="mt-2 text-[11px] text-zinc-500 pl-0.5">
                          <span className="font-semibold text-zinc-300">
                            {Math.max(0, Number(form.ticketRangeEnd) - Number(form.ticketRangeStart) + 1).toLocaleString("en-IN")}
                          </span>{" "}tickets per series
                          {form.series && ` · ${form.series.split(",").filter(Boolean).length} series`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Footer ───────────────────────────────── */}
                <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4 bg-black/20">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-[12px] font-semibold text-zinc-400 transition hover:border-white/20 hover:text-zinc-200 hover:bg-white/[0.03]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-amber-900/25 transition hover:from-amber-400 hover:to-orange-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving…" : editDraw ? "Update Draw" : "Create Draw"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
