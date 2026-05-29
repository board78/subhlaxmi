"use client";

import { motion } from "framer-motion";
import type { DrawSummaryPublic } from "@/lib/draws";

const THEMES = [
  {
    accent: "#7c6fff",
    glow: "rgba(124,111,255,0.22)",
    border: "rgba(124,111,255,0.35)",
    prizeBg: "rgba(124,111,255,0.10)",
    prizeColor: "#c4baff",
    badgeBg: "rgba(124,111,255,0.18)",
    badgeColor: "#a89fff",
    btnBg: "linear-gradient(135deg,#6c5fff,#4f46e5)",
    btnGlow: "rgba(108,95,255,0.45)",
  },
  {
    accent: "#f4506a",
    glow: "rgba(244,80,106,0.20)",
    border: "rgba(244,80,106,0.30)",
    prizeBg: "rgba(244,80,106,0.09)",
    prizeColor: "#ffaab8",
    badgeBg: "rgba(244,80,106,0.16)",
    badgeColor: "#ff8fa0",
    btnBg: "linear-gradient(135deg,#e11d48,#be123c)",
    btnGlow: "rgba(225,29,72,0.45)",
  },
  {
    accent: "#10b981",
    glow: "rgba(16,185,129,0.20)",
    border: "rgba(16,185,129,0.28)",
    prizeBg: "rgba(16,185,129,0.09)",
    prizeColor: "#6ee7b7",
    badgeBg: "rgba(16,185,129,0.16)",
    badgeColor: "#34d399",
    btnBg: "linear-gradient(135deg,#059669,#047857)",
    btnGlow: "rgba(5,150,105,0.45)",
  },
  {
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.20)",
    border: "rgba(245,158,11,0.28)",
    prizeBg: "rgba(245,158,11,0.09)",
    prizeColor: "#fcd34d",
    badgeBg: "rgba(245,158,11,0.14)",
    badgeColor: "#fbbf24",
    btnBg: "linear-gradient(135deg,#d97706,#b45309)",
    btnGlow: "rgba(217,119,6,0.45)",
  },
  {
    accent: "#06b6d4",
    glow: "rgba(6,182,212,0.20)",
    border: "rgba(6,182,212,0.28)",
    prizeBg: "rgba(6,182,212,0.09)",
    prizeColor: "#67e8f9",
    badgeBg: "rgba(6,182,212,0.14)",
    badgeColor: "#22d3ee",
    btnBg: "linear-gradient(135deg,#0891b2,#0e7490)",
    btnGlow: "rgba(8,145,178,0.45)",
  },
  {
    accent: "#e879f9",
    glow: "rgba(232,121,249,0.20)",
    border: "rgba(232,121,249,0.28)",
    prizeBg: "rgba(232,121,249,0.09)",
    prizeColor: "#f0abfc",
    badgeBg: "rgba(232,121,249,0.14)",
    badgeColor: "#e879f9",
    btnBg: "linear-gradient(135deg,#a21caf,#86198f)",
    btnGlow: "rgba(162,28,175,0.45)",
  },
];

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
  const theme = THEMES[index % THEMES.length];
  const prize = formatPrize(draw.prizeAmount, language);
  const drawDate = new Date(draw.drawDate);
  const drawTimeLabel = `${drawDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} · ${draw.drawTime}`;

  const pctLeft =
    draw.totalTickets > 0
      ? Math.max(0, Math.min(100, (draw.availableTickets / draw.totalTickets) * 100))
      : null;
  const soldPct = pctLeft != null ? 100 - pctLeft : null;

  const statusMap: Record<string, { label: string }> = {
    active:   { label: language === "hi" ? "सक्रिय"      : "Active"    },
    upcoming: { label: language === "hi" ? "आने वाली"    : "Upcoming"  },
    closed:   { label: language === "hi" ? "बंद"          : "Closed"    },
    drawn:    { label: language === "hi" ? "निकाला गया"  : "Drawn"     },
  };
  const statusLabel = statusMap[draw.status]?.label ?? draw.status;
  const prizeKicker = language === "hi" ? "पहला पुरस्कार" : "First Prize";
  const perTicketLabel = language === "hi" ? "प्रति टिकट" : "per ticket";

  return (
    <motion.article
      onClick={onBuy}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -6,
        boxShadow: `0 20px 60px ${theme.glow}, 0 0 0 1px ${theme.border}`,
      }}
      style={{
        borderRadius: 24,
        border: `1.5px solid ${theme.border}`,
        background: "linear-gradient(160deg,#12101a 0%,#0c0b12 100%)",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: `0 4px 24px rgba(0,0,0,0.45)`,
      }}
    >
      {/* Subtle top glow line */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          opacity: 0.6,
        }}
      />

      <div style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: theme.badgeBg,
              color: theme.badgeColor,
              border: `1px solid ${theme.border}`,
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: theme.accent,
                boxShadow: `0 0 6px ${theme.accent}`,
                display: "inline-block",
              }}
            />
            {statusLabel}
          </span>
        </div>

        {/* Draw name */}
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f1f0f8",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {draw.name}
        </p>

        {/* Prize hero box */}
        <div
          style={{
            background: theme.prizeBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: "14px 16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Corner shine */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: theme.accent,
              opacity: 0.06,
              filter: "blur(20px)",
            }}
          />
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: theme.accent,
              opacity: 0.75,
              margin: "0 0 5px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {prizeKicker}
          </p>
          <p
            style={{
              fontSize: "clamp(1.55rem, 4.5vw, 2rem)",
              fontWeight: 800,
              color: theme.prizeColor,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              margin: 0,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {prize ?? "—"}
          </p>

          {/* Dashed divider */}
          <div
            aria-hidden
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "10px 0",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                border: `1.5px solid rgba(255,255,255,0.15)`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                borderTop: "1.5px dashed rgba(255,255,255,0.08)",
              }}
            />
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                border: `1.5px solid rgba(255,255,255,0.15)`,
                flexShrink: 0,
              }}
            />
          </div>

          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(255,255,255,0.38)",
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {perTicketLabel}{" "}
            <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>
              ₹{draw.pricePerTicket.toLocaleString("en-IN")}
            </span>
          </p>
        </div>

        {/* Progress bar */}
        {pctLeft != null && (
          <div>
            <div
              style={{
                height: 5,
                width: "100%",
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pctLeft}%` }}
                transition={{ duration: 0.9, delay: index * 0.07 + 0.3, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${theme.accent}, ${theme.prizeColor})`,
                }}
              />
            </div>
            {soldPct != null && soldPct > 72 && (
              <p
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#fb923c",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                {language === "hi" ? "⚡ लगभग भर चुका" : "⚡ Selling fast"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 18px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 500,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {drawTimeLabel}
        </div>

        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBuy();
          }}
          whileHover={{ scale: 1.04, boxShadow: `0 6px 22px ${theme.btnGlow}` }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: theme.btnBg,
            border: "none",
            borderRadius: 999,
            padding: "8px 18px",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            boxShadow: `0 4px 14px ${theme.btnGlow}`,
          }}
        >
          {buyLabel}
        </motion.button>
      </div>

      {/* Bottom accent bar on hover — achieved via a permanent thin bar */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          opacity: 0.5,
        }}
      />
    </motion.article>
  );
}