"use client";

import { motion } from "framer-motion";
import type { TicketPublic } from "@/lib/draws";

export function TicketButton({
  ticket,
  isSelected,
  onToggle,
}: {
  ticket: TicketPublic;
  isSelected: boolean;
  onToggle: (t: TicketPublic) => void;
}) {
  const isSold = ticket.status === "sold";
  const displayNum = (ticket.number || "—").trim().toLowerCase();

  let base =
    "relative w-full min-h-[2.5rem] rounded-lg border px-1 py-2 text-center font-mono text-[10px] font-semibold tabular-nums leading-tight transition select-none sm:min-h-[2.75rem] sm:text-[11px]";

  if (isSold) {
    base += " border-zinc-700/30 bg-zinc-900/40 text-zinc-700 cursor-not-allowed line-through";
  } else if (isSelected) {
    base +=
      " sl-ticket-selected border-amber-500 bg-gradient-to-b from-[#3a2518] to-[#140c09] text-amber-100 shadow-[0_0_0_1px_rgba(251,146,60,0.45),0_6px_20px_rgba(0,0,0,0.35)]";
  } else if (ticket.category === "lp_special") {
    base +=
      " sl-ticket-lp border-cyan-400/30 bg-cyan-900/20 text-cyan-200 hover:border-cyan-300/60 hover:bg-cyan-300/10 cursor-pointer";
  } else if (ticket.category === "special") {
    base +=
      " border-purple-400/30 bg-purple-900/20 text-purple-200 hover:border-purple-300/60 hover:bg-purple-300/10 cursor-pointer";
  } else {
    base +=
      " border-amber-200/20 bg-[#1a0e14] text-zinc-200 hover:border-amber-300/50 hover:bg-amber-300/5 hover:text-amber-100 cursor-pointer";
  }

  return (
    <motion.button
      type="button"
      className={base}
      onClick={() => onToggle(ticket)}
      whileTap={!isSold ? { scale: 0.94 } : {}}
      transition={{ duration: 0.08 }}
    >
      <span className="block max-w-full truncate" title={displayNum}>
        {displayNum}
      </span>
      {ticket.category === "lp_special" && (
        <span className="sl-ticket-lp-badge absolute right-0.5 top-0.5 rounded-sm bg-cyan-400/30 px-0.5 text-[8px] text-cyan-300">
          LP
        </span>
      )}
      {ticket.category === "special" && (
        <span className="absolute right-0.5 top-0.5 rounded-sm bg-purple-400/30 px-0.5 text-[8px] text-purple-300">
          SP
        </span>
      )}
    </motion.button>
  );
}
