"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DrawSummaryPublic } from "@/lib/draws";

import { TicketHeader } from "./draw-ticket-card/TicketHeader";
import { TicketPrize } from "./draw-ticket-card/TicketPrize";
import { TicketPriceAndDate } from "./draw-ticket-card/TicketPriceAndDate";
import { TicketActions } from "./draw-ticket-card/TicketActions";

function formatPrize(raw?: string, language: "en" | "hi" = "en") {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits) {
    const num = Number(digits);
    if (num >= 100000) {
      if (num >= 10000000) {
        const crVal = num / 10000000;
        const formattedVal = parseFloat(crVal.toFixed(2));
        const suffix = language === "hi" ? " करोड़" : " Crore";
        return `₹${formattedVal}${suffix}`;
      } else {
        const lakhVal = num / 100000;
        const formattedVal = parseFloat(lakhVal.toFixed(2));
        const suffix = language === "hi" ? " लाख" : " Lakh";
        return `₹${formattedVal}${suffix}`;
      }
    }
    return `₹${num.toLocaleString("en-IN")}`;
  }
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
  const prize = formatPrize(draw.prizeAmount, language);
  const drawDate = new Date(draw.drawDate);
  const drawTimeLabel = `${drawDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} · ${draw.drawTime}`;

  const total = draw.totalTickets || 500;
  
  // Generate a consistent pseudo-random percentage between 65 and 95
  const fakeProgress = useMemo(() => {
    let hash = 0;
    const str = draw.id + draw.name;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    return 65 + (seed % 31); // 65 to 95
  }, [draw.id, draw.name]);

  const prizeKicker = language === "hi" ? "पहला पुरस्कार जैकपॉट" : "FIRST PRIZE JACKPOT";
  const perTicketLabel = language === "hi" ? "प्रति टिकट" : "per ticket";

  return (
    <motion.article
      onClick={onBuy}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -4,
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
      }}
      style={{
        position: "relative",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 20,
        padding: "16px 20px",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background: "radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.06), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <TicketHeader draw={draw} language={language} />

      <TicketPrize prizeKicker={prizeKicker} prize={prize} />

      <TicketPriceAndDate 
        pricePerTicket={draw.pricePerTicket} 
        perTicketLabel={perTicketLabel} 
        language={language} 
        drawTimeLabel={drawTimeLabel} 
      />

      <TicketActions 
        onBuy={onBuy} 
        buyLabel={buyLabel} 
        total={total} 
        fakeProgress={fakeProgress} 
        language={language} 
      />

    </motion.article>
  );
}
