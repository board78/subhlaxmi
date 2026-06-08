"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type DrawFormData = {
  drawSeriesName: string;
  drawDate: string;
  drawTime: string;
  pricePerTicket: number | "";
  series: string;
  ticketPrefix: string;
  ticketRangeStart: number | "";
  ticketRangeEnd: number | "";
  prizeAmount: string;
};

const EMPTY_FORM: DrawFormData = {
  drawSeriesName: "",
  drawDate: "",
  drawTime: "6:00 PM",
  pricePerTicket: "",
  series: "A,B,C",
  ticketPrefix: "SL",
  ticketRangeStart: 10000,
  ticketRangeEnd: 99999,
  prizeAmount: "",
};

export type DrawForEdit = {
  id: string;
  name: string;
  drawSeriesName?: string;
  drawNumber?: number;
  drawDate: string;
  drawTime: string;
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

const inp =
  "w-full rounded-lg border border-white/10 bg-[#0f0810]/80 px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-amber-400/50 focus:bg-[#0f0810] focus:ring-1 focus:ring-amber-400/20";

const lbl =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500";

export function DrawFormModal({ open, editDraw, onClose, onSaved }: Props) {
  const [form, setForm] = useState<DrawFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editDraw) {
      setForm({
        drawSeriesName: editDraw.drawSeriesName ?? editDraw.name,
        drawDate: editDraw.drawDate.slice(0, 10),
        drawTime: editDraw.drawTime,
        pricePerTicket: editDraw.pricePerTicket,
        series: editDraw.series.join(","),
        ticketPrefix: editDraw.ticketPrefix,
        ticketRangeStart: editDraw.ticketRangeStart,
        ticketRangeEnd: editDraw.ticketRangeEnd,
        prizeAmount: editDraw.prizeAmount || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [open, editDraw]);

  const set = (key: keyof DrawFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const previewName = form.drawSeriesName.trim()
    ? editDraw?.drawNumber
      ? `${form.drawSeriesName.trim()} #${editDraw.drawNumber}`
      : `${form.drawSeriesName.trim()} #N`
    : "";

  // Compute preview activation from drawDate
  const previewActivatesAt = form.drawDate
    ? new Date(`${form.drawDate}T00:00:00+05:30`)
    : null;
  const previewExpiresAt = previewActivatesAt
    ? new Date(previewActivatesAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;

  const formatDate = (d: Date | null) =>
    d
      ? d.toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        })
      : "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      drawSeriesName: form.drawSeriesName.trim(),
      drawDate: form.drawDate,
      drawTime: form.drawTime,
      pricePerTicket: Number(form.pricePerTicket),
      ticketRangeStart: Number(form.ticketRangeStart),
      ticketRangeEnd: Number(form.ticketRangeEnd),
      series: form.series
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ticketPrefix: form.ticketPrefix,
      prizeAmount: form.prizeAmount,
    };
    try {
      const url = editDraw
        ? `/api/admin/draws/${editDraw.id}`
        : "/api/admin/draws";
      const method = editDraw ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 bg-[#170d14] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editDraw ? "Edit Draw" : "Create New Draw"}
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    {editDraw
                      ? "Update draw — status is auto-managed by date"
                      : "Status is automatic · 7-day cycle · auto-renews"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                {error && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-red-400/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Row 1 — Series name + prize */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>
                      Series Name{" "}
                      <span className="text-amber-400 normal-case tracking-normal">
                        *
                      </span>
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
                      <p className="mt-1 text-[11px] text-amber-400/70">
                        Will be named:{" "}
                        <span className="font-semibold">{previewName}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={lbl}>
                      Prize Amount{" "}
                      <span className="text-zinc-600 normal-case tracking-normal">
                        (optional)
                      </span>
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

                {/* Row 2 — Activation date + time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>
                      Activation Date{" "}
                      <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.drawDate}
                      onChange={(e) => set("drawDate", e.target.value)}
                      className={inp}
                      style={{ colorScheme: "dark" }}
                    />
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Goes live at 12 AM IST on this date
                    </p>
                  </div>
                  <div>
                    <label className={lbl}>
                      Display Time{" "}
                      <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.drawTime}
                      onChange={(e) => set("drawTime", e.target.value)}
                      placeholder="e.g. 6:00 PM"
                      className={inp}
                    />
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Shown on draw cards as result time
                    </p>
                  </div>
                </div>

                {/* Activation preview */}
                {previewActivatesAt && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-400/70 mb-1.5">
                      Auto-schedule preview
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                      <div>
                        <span className="text-zinc-500">Activates:</span>
                        <br />
                        <span className="font-semibold text-emerald-300">
                          {formatDate(previewActivatesAt)} IST
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">
                          Expires (7 days later):
                        </span>
                        <br />
                        <span className="font-semibold text-amber-300">
                          {formatDate(previewExpiresAt)} IST
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-zinc-600">
                      After expiry, <strong>{form.drawSeriesName.trim() || "this series"}</strong> auto-renews to the next number.
                    </p>
                  </div>
                )}

                {/* Row 3 — Price · Series · Prefix */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>
                      Price / Ticket (₹){" "}
                      <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={form.pricePerTicket}
                      onChange={(e) =>
                        set(
                          "pricePerTicket",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="100"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>
                      Series <span className="text-amber-400">*</span>
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
                      Ticket Prefix <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.ticketPrefix}
                      onChange={(e) =>
                        set("ticketPrefix", e.target.value.toUpperCase())
                      }
                      placeholder="SL"
                      maxLength={6}
                      className={inp}
                    />
                  </div>
                </div>

                {/* Row 4 — Ticket Range */}
                <div>
                  <label className={lbl}>
                    Ticket Number Range{" "}
                    <span className="text-amber-400">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      required
                      value={form.ticketRangeStart}
                      onChange={(e) =>
                        set("ticketRangeStart", Number(e.target.value))
                      }
                      placeholder="10000"
                      className={inp}
                    />
                    <span className="shrink-0 text-xs text-zinc-600">to</span>
                    <input
                      type="number"
                      required
                      value={form.ticketRangeEnd}
                      onChange={(e) =>
                        set("ticketRangeEnd", Number(e.target.value))
                      }
                      placeholder="99999"
                      className={inp}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Total tickets per series:{" "}
                    {form.ticketRangeStart !== "" && form.ticketRangeEnd !== ""
                      ? Math.max(
                          0,
                          Number(form.ticketRangeEnd) -
                            Number(form.ticketRangeStart) +
                            1,
                        ).toLocaleString("en-IN")
                      : "—"}
                  </p>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex gap-3 border-t border-white/8 bg-white/[0.01] px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-white/12 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-white/22 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : editDraw
                      ? "Update Draw"
                      : "Create Draw"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
