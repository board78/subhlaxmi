"use client";

import { motion } from "framer-motion";
import type { DrawSummaryPublic } from "@/lib/draws";

const ACCENTS = [
  "from-[#2ca7ff] to-[#6157ff]",
  "from-[#ff7b38] to-[#ff3d6e]",
  "from-[#7a5cff] to-[#c052ff]",
  "from-[#e0a60d] to-[#ff7b38]",
  "from-[#00c6ff] to-[#0072ff]",
  "from-[#f857a6] to-[#ff5858]",
];

function formatPrize(raw?: string) {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits) return `₹${Number(digits).toLocaleString("en-IN")}`;
  return raw.startsWith("₹") ? raw : `₹${raw}`;
}

type Props = {
  draw: DrawSummaryPublic;
  index: number;
  language: "en" | "hi";
  buyLabel: string;
  onBuy: () => void;
};

export function DrawTicketCard({ draw, index, language, buyLabel, onBuy }: Props) {
  const accent = ACCENTS[index % ACCENTS.length];
  const prize = formatPrize(draw.prizeAmount);
  const drawDate = new Date(draw.drawDate);
  const drawTimeLabel = `${drawDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${draw.drawTime}`;
  const pctLeft =
    draw.totalTickets > 0
      ? Math.max(0, Math.min(100, (draw.availableTickets / draw.totalTickets) * 100))
      : null;
  const soldPct = pctLeft != null ? 100 - pctLeft : null;

  const statusMap: Record<string, { label: string; color: string }> = {
    active: {
      label: language === "hi" ? "सक्रिय" : "Active",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    upcoming: {
      label: language === "hi" ? "आने वाली" : "Upcoming",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    closed: {
      label: language === "hi" ? "बंद" : "Closed",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    drawn: {
      label: language === "hi" ? "निकाला गया" : "Drawn",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
  };
  const status = statusMap[draw.status] ?? {
    label: draw.status,
    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };

  const prizeKicker = language === "hi" ? "पहला पुरस्कार" : "First prize";
  const onlyLeft = language === "hi" ? "बचे" : "left";

  return (
    <motion.article
      onClick={onBuy}
      whileHover={{ boxShadow: "0 0 28px rgba(255,153,0,0.18)" }}
      transition={{ duration: 0.18 }}
      className={`group sl-draw-card self-start cursor-pointer rounded-3xl bg-gradient-to-r p-[2px] ${accent}`}
    >
      <div className="flex flex-col overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="sl-popular-draw-card flex flex-col rounded-[22px] bg-[#120b0f] p-3 transition-[border-radius] duration-300 ease-out sm:p-4 group-hover:rounded-t-[22px] group-hover:rounded-b-[14px]">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <p className="sl-ticket-draw-name min-w-0 flex-1 truncate text-[11px] font-semibold leading-snug sm:text-xs md:text-sm">
              {draw.name}
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
              <div className="sl-ticket-draw-time-pill rounded-xl bg-white/10 px-2 py-1 text-right text-[9px] leading-tight text-zinc-100 sm:rounded-2xl sm:px-2.5 sm:py-1.5 sm:text-[10px] md:text-xs">
                {drawTimeLabel}
              </div>
              <div className={`rounded-xl border px-2 py-1 text-[9px] font-bold sm:rounded-2xl sm:px-2.5 sm:py-1.5 sm:text-[10px] md:text-xs ${status.color}`}>
                {status.label}
              </div>
            </div>
          </div>

          <div className="sl-draw-prize-hero relative mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent px-3 py-3 sm:px-4 sm:py-3.5">
            <div
              className={`pointer-events-none absolute inset-0 opacity-40 bg-gradient-to-r ${accent}`}
              aria-hidden
            />
            <div className="relative flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px]">
                  {prizeKicker}
                </p>
                <p className="mt-0.5 truncate text-[clamp(1.35rem,4vw,1.85rem)] font-extrabold leading-none tracking-tight text-amber-300 tabular-nums sm:text-[1.75rem]">
                  {prize ?? "—"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] font-medium text-zinc-500 sm:text-[10px]">
                  {language === "hi" ? "टिकट" : "Per ticket"}
                </p>
                <p className="text-sm font-bold leading-tight text-white sm:text-base">
                  ₹{draw.pricePerTicket.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div
              className="relative mt-2.5 flex items-center gap-2 border-t border-dashed border-white/10 pt-2.5"
              aria-hidden
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#120b0f] ring-1 ring-white/15" />
              <span className="h-px flex-1 bg-white/10" />
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#120b0f] ring-1 ring-white/15" />
            </div>
          </div>

          {pctLeft != null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500">
                <span>
                  {language === "hi" ? "केवल" : "Only"}{" "}
                  <span className="text-amber-200">{draw.availableTickets.toLocaleString("en-IN")}</span>{" "}
                  {onlyLeft}
                </span>
                <span>{draw.totalTickets.toLocaleString("en-IN")} total</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border border-emerald-200/15 bg-gradient-to-r from-emerald-950/70 via-amber-950/50 to-red-950/60 shadow-inner shadow-black/30">
                <div className="sl-progress-fill h-full rounded-full" style={{ width: `${pctLeft}%` }} />
              </div>
              {soldPct != null && soldPct > 72 && (
                <p className="mt-1 text-[9px] font-semibold text-orange-300/90">
                  {language === "hi" ? "लगभग भर चुका" : "Selling fast"}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            className="mt-3 w-fit rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-amber-500/25 hover:text-amber-100 sm:mt-4 sm:px-4 sm:py-2 sm:text-xs"
          >
            {buyLabel}
          </button>
        </div>
        <div
          className={`h-0 shrink-0 overflow-hidden rounded-b-[22px] bg-gradient-to-r transition-[height] duration-300 ease-out group-hover:h-[36px] group-hover:rounded-t-[14px] ${accent}`}
          aria-hidden
        />
      </div>
    </motion.article>
  );
}
