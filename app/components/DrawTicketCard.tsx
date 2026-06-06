"use client";

import { motion } from "framer-motion";
import type { DrawSummaryPublic } from "@/lib/draws";

function formatPrize(raw?: string, language: "en" | "hi" = "en") {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits) {
    const num = Number(digits);
    if (num >= 100000) {
      if (num >= 10000000) {
        const crVal = num / 10000000;
        const formattedVal = parseFloat(crVal.toFixed(2));
        const suffix = language === "hi" ? " करोड़" : " Crore";
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
  const available = draw.availableTickets ?? 500;
  const sold = Math.max(0, total - available);
  const soldPercent = total > 0 ? Math.min(100, Math.max(0, (sold / total) * 100)) : 0;

  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    active: {
      label: language === "hi" ? "सक्रिय" : "Active",
      bg: "rgba(16, 185, 129, 0.15)",
      color: "#34D399",
    },
    upcoming: {
      label: language === "hi" ? "आने वाली" : "Upcoming",
      bg: "#2ECC71",
      color: "#022C22",
    },
    closed: {
      label: language === "hi" ? "बंद" : "Closed",
      bg: "rgba(239, 68, 68, 0.15)",
      color: "#F87171",
    },
    drawn: {
      label: language === "hi" ? "निकाला गया" : "Drawn",
      bg: "rgba(156, 163, 175, 0.15)",
      color: "#D1D5DB",
    },
  };

  const currentStatus = statusMap[draw.status] || {
    label: draw.status,
    bg: "#2ECC71",
    color: "#022C22",
  };

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
        borderColor: "#FFD700",
        boxShadow: "0 15px 30px rgba(230, 184, 0, 0.2), 0 0 15px rgba(255, 215, 0, 0.1)",
      }}
      style={{
        width: "100%",
        // maxWidth: 320, // Super premium compact width
        // margin: "0 auto",
        // width: "100%",
        borderRadius: 20,
        border: "1.2px solid rgba(230, 184, 0, 0.4)", // Thin gold border
        background: "linear-gradient(180deg, #1A1D24 0%, #111317 100%)", // Deep charcoal/slate black background
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        padding: 18, // Reduced padding for tighter spacing
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Top Header Row with Status Badge */}
      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: 6 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            background: currentStatus.bg,
            color: currentStatus.color,
            borderRadius: 999,
            padding: "3px 9px",
            fontSize: 9, // Smaller font size
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: draw.status === "upcoming" ? "0 0 8px rgba(46, 204, 113, 0.25)" : "none",
          }}
        >
          <span style={{ fontSize: 10 }}>✧</span>
          {currentStatus.label}
        </span>
      </div>

      {/* Draw Title/Logo */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <h3
          style={{
            fontSize: 22, // Scale down title size from 32
            fontWeight: 800,
            color: "#FFD700", // Bright gold
            margin: 0,
            letterSpacing: "-0.01em",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {draw.name.replace(/\b\w/g, c => c.toUpperCase())}
        </h3>
        <p
          style={{
            fontSize: 11, // Scale down tagline
            color: "rgba(255, 255, 255, 0.6)",
            margin: "3px 0 0",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Every number is a chance for luxury.
        </p>
      </div>

      {/* Hero Prize Box */}
      <div
        style={{
          textAlign: "center",
          margin: "14px 0", // Saved 10px height
          position: "relative",
        }}
      >
        <p
          style={{
            fontSize: 9, // Reduced kicker size
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.5)",
            margin: "0 0 4px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {prizeKicker}
        </p>
        <p
          style={{
            fontSize: "clamp(1.4rem, 4.5vw, 1.85rem)", // Beautiful scaled prize text
            fontWeight: 800,
            color: "#FFD700",
            lineHeight: 1.1,
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
            textShadow: "0 0 15px rgba(255, 215, 0, 0.4)", // Soft glow
          }}
        >
          {prize ?? "—"}
        </p>
      </div>

      {/* Ticket Price & Draw Date Info Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: 10,
          marginBottom: 14, // Saved height
        }}
      >
        {/* Ticket Price */}
        <div>
          <span
            style={{
              display: "block",
              fontSize: 8.5,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {language === "hi" ? "टिकट की कीमत" : "Ticket Price"}
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ₹{draw.pricePerTicket} <span style={{ fontWeight: 500, fontSize: 15, color: "rgba(255,255,255,0.6)" }}>{perTicketLabel}</span>
          </span>
        </div>

        {/* Draw Date */}
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              display: "block",
              fontSize: 8.5,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {language === "hi" ? "ड्रॉ की तारीख" : "Draw Date"}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.8 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {drawTimeLabel}
          </span>
        </div>
      </div>

      {/* Buy Button */}
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onBuy();
        }}
        whileHover={{ scale: 1.02, backgroundColor: "#D11A3A" }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: "100%",
          background: "#C40C30",
          border: "none",
          borderRadius: 12, // More rounded-premium compact shape
          padding: "10px 16px", // Highly tactile compact padding
          fontSize: 14, // Scale down button font
          fontWeight: 700,
          color: "#FFFFFF",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.02em",
          boxShadow: "0 4px 12px rgba(196, 12, 48, 0.25)",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {buyLabel}
      </motion.button>

      {/* Sales Loader & Stats below Buy Button */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10, // Scaled down text
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.5)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span>{sold.toLocaleString("en-IN")} Sold</span>
          <span>{total.toLocaleString("en-IN")} Total</span>
        </div>
        {/* Progress bar loader */}
        <div
          style={{
            height: 4, // Slim progress bar
            width: "100%",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${soldPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #EF4444)",
              borderRadius: 999,
            }}
          />
        </div>
        {soldPercent > 75 && (
          <p
            style={{
              marginTop: 1,
              fontSize: 9,
              fontWeight: 600,
              color: "#FFD700",
              textAlign: "center",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            {language === "hi" ? "⚡ लगभग भर चुका!" : "⚡ Selling fast!"}
          </p>
        )}
      </div>

      {/* Secure Badge at bottom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          marginTop: 12,
          color: "rgba(255, 255, 255, 0.35)",
          fontSize: 9.5, // Extremely refined and neat size
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>
          {language === "hi"
            ? "सुरक्षित और विश्वसनीय सरकारी लॉटरी"
            : "Secure & Trusted Government Lottery"}
        </span>
      </div>
    </motion.article>
  );
}