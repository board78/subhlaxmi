"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDrawNumber } from "@/lib/utils";
import { toISTDate, fromISO, IconStar, IconClose, IconAlert, IconChevron } from "./draws/DrawFormUtils";
import { BasicInfoSection, TimingSection, TicketConfigSection, StatusOverrideSection } from "./draws/DrawFormSections";

export type DrawFormData = {
  name?: string; // added to maintain compatibility with new refactoring
  drawSeriesName: string;
  drawTime: string;
  pricePerTicket: string | number;
  series: string;
  ticketPrefix: string;
  ticketRangeStart: string | number;
  ticketRangeEnd: string | number;
  prizeAmount: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  activatesAtDate?: string;
  activatesAtTime?: string;
  statusOverride: "auto" | "upcoming" | "active" | "closed" | "drawn";
};

const EMPTY_FORM: DrawFormData = {
  name: "",
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
  activatesAtDate: "",
  activatesAtTime: "00:00",
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
  statusOverride?: string;
  prizeAmount?: string;
};

type Props = {
  open: boolean;
  editDraw: DrawForEdit | null;
  onClose: () => void;
  onSaved: () => void;
};

export function DrawFormModal({ open, editDraw, onClose, onSaved }: Props) {
  const [form, setForm] = useState<DrawFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // "7days" = auto-compute end from start+7d; "custom" = manual end date
  const [durationMode, setDurationMode] = useState<"7days" | "custom">("7days");
  const [showStatusOverride, setShowStatusOverride] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editDraw) {
      const start = fromISO(editDraw.activatesAt);
      const end   = fromISO(editDraw.expiresAt);
      const rawStatus = editDraw.statusOverride as DrawFormData["statusOverride"] | undefined;
      const knownStatuses: DrawFormData["statusOverride"][] = ["upcoming", "active", "closed", "drawn"];
      const statusOverride = rawStatus && knownStatuses.includes(rawStatus) ? rawStatus : "auto";
      
      const startMs = new Date(editDraw.activatesAt).getTime();
      const endMs   = new Date(editDraw.expiresAt).getTime();
      const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
      setDurationMode(diffDays === 7 ? "7days" : "custom");
      
      setForm({
        name: editDraw.name,
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
        activatesAtDate: start.date,
        activatesAtTime: start.time,
        drawDate: end.date,
        statusOverride,
      } as any);
      setShowStatusOverride(statusOverride !== "auto");
    } else {
      setForm(EMPTY_FORM);
      setDurationMode("7days");
      setShowStatusOverride(false);
    }
    setError("");
  }, [open, editDraw]);

  const set = (key: keyof DrawFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Fallbacks for DrawFormSections to map to the new form state
  const mappedForm = {
    ...form,
    startDate: form.activatesAtDate || form.startDate,
    startTime: form.activatesAtTime || form.startTime,
    endDate: (form as any).drawDate || form.endDate,
    endTime: form.drawTime || form.endTime,
  };

  const effectiveEndDate = durationMode === "7days" && mappedForm.startDate
    ? (() => {
        const d = new Date(`${mappedForm.startDate}T${mappedForm.startTime}:00+05:30`);
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
      })()
    : mappedForm.endDate;
  const effectiveEndTime = durationMode === "7days" ? mappedForm.startTime : mappedForm.endTime;

  const previewActivatesAt = mappedForm.startDate && mappedForm.startTime ? toISTDate(mappedForm.startDate, mappedForm.startTime) : null;
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

  const effectiveStatus = form.statusOverride !== "auto" ? form.statusOverride : computedAutoStatus;

  const fmtDT = (d: Date | null) =>
    d ? d.toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    }) + " IST" : "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mappedForm.startDate || !mappedForm.startTime) { setError("Start date and time are required."); return; }
    if (durationMode === "custom" && (!mappedForm.endDate || !mappedForm.endTime)) {
      setError("End date and time are required."); return;
    }
    if (previewActivatesAt && previewExpiresAt && previewExpiresAt <= previewActivatesAt) {
      setError("End date/time must be after start date/time."); return;
    }
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = {
      name: mappedForm.name,
      drawSeriesName: mappedForm.drawSeriesName.trim(),
      drawTime: mappedForm.drawTime,
      pricePerTicket: Number(mappedForm.pricePerTicket),
      ticketRangeStart: Number(mappedForm.ticketRangeStart),
      ticketRangeEnd: Number(mappedForm.ticketRangeEnd),
      series: mappedForm.series.split(",").map((s) => s.trim()).filter(Boolean),
      ticketPrefix: mappedForm.ticketPrefix,
      prizeAmount: mappedForm.prizeAmount,
      startDate: mappedForm.startDate,
      startTime: mappedForm.startTime,
      endDate: effectiveEndDate,
      endTime: effectiveEndTime,
      status: mappedForm.statusOverride,
    };
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

  const previewName = mappedForm.drawSeriesName.trim()
    ? editDraw?.drawNumber
      ? `${mappedForm.drawSeriesName.trim()} ${formatDrawNumber(editDraw.drawNumber)}`
      : `${mappedForm.drawSeriesName.trim()} #N`
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
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
                  <IconStar />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-2">
                    {editDraw ? "Edit Draw" : "Create New Draw"}
                    {editDraw?.drawNumber != null && (
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                        {formatDrawNumber(editDraw.drawNumber)}
                      </span>
                    )}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {editDraw ? "Update existing draw details and timeline." : "Configure a new draw series."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition p-1"
              >
                <IconClose />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto flex-1">
              <form id="draw-form" onSubmit={handleSubmit}>
                <div className="px-6 py-5 space-y-6">
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                      <IconAlert />
                      <span className="leading-snug flex-1">{error}</span>
                    </div>
                  )}

                  {/* Sections extracted into components */}
                  <BasicInfoSection form={mappedForm as any} set={set} />
                  
                  <div className="border-t border-white/[0.05]" />

                  <TimingSection form={mappedForm as any} set={set} durationMode={durationMode} setDurationMode={setDurationMode} />
                  
                  {/* Summary / Preview */}
                  <div className={`rounded-xl border px-5 py-4 ${
                    effectiveStatus === "active" ? "border-emerald-500/30 bg-emerald-500/5" :
                    effectiveStatus === "upcoming" ? "border-blue-500/30 bg-blue-500/5" :
                    effectiveStatus === "drawn" ? "border-amber-500/30 bg-amber-500/5" :
                    "border-white/[0.05] bg-white/[0.02]"
                  }`}>
                    <div className="grid grid-cols-3 gap-4 text-[12px]">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                        <p className={`font-bold ${
                          effectiveStatus === "active" ? "text-emerald-400" :
                          effectiveStatus === "upcoming" ? "text-blue-400" :
                          effectiveStatus === "drawn" ? "text-amber-400" :
                          "text-zinc-400"
                        }`}>
                          {(effectiveStatus || "—").toUpperCase()}
                          {form.statusOverride !== "auto" && <span className="ml-1 text-[9px] text-amber-500/80">(OVERRIDE)</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Activates</p>
                        <p className="font-medium text-zinc-200">{fmtDT(previewActivatesAt)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Expires / Draws</p>
                        <p className="font-medium text-zinc-200">
                          {fmtDT(previewExpiresAt)}
                          {durationLabel && <span className="ml-1.5 text-zinc-500">({durationLabel})</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Advanced settings toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowStatusOverride(!showStatusOverride)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 transition"
                    >
                      <span className={`transition-transform duration-200 ${showStatusOverride ? "rotate-90" : ""}`}>
                        <IconChevron />
                      </span>
                      Advanced: Override Status
                    </button>
                    <AnimatePresence>
                      {showStatusOverride && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <StatusOverrideSection form={mappedForm as any} set={set} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-white/[0.05]" />

                  <TicketConfigSection form={mappedForm as any} set={set} />

                </div>

                {/* Footer */}
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
