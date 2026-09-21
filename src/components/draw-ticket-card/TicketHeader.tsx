"use client";

import type { DrawSummaryPublic } from "@/lib/draws";

type Props = {
  draw: DrawSummaryPublic;
  language: "en" | "hi";
};

export function TicketHeader({ draw, language }:
  Props) {
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

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
              color: "#000",
              padding: "3px 7px",
              borderRadius: 6,
              fontSize: 9,
              fontWeight: 800,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {draw.ticketPrefix}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>•</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            <span style={{ fontSize: 10 }}>₹ {draw.prizeAmount}</span>
          </span>
        </div>
        <div
          style={{
            background: currentStatus.bg,
            color: currentStatus.color,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 8.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: "currentColor",
              boxShadow: "0 0 6px currentColor",
              animation: draw.status === "active" ? "pulse 2s infinite" : "none",
            }}
          />
          {currentStatus.label}
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.01em",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {(draw.drawSeriesName || draw.name.replace(/\s*#\d+$/, "")).replace(/\b\w/g, c => c.toUpperCase())}
          </h3>
          {(() => {
            let dNum = draw.drawNumber;
            if (!dNum) {
              const match = draw.name.match(/#(\d+)$/);
              if (match) dNum = parseInt(match[1], 10);
            }
            if (!dNum) return null;
            return (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#000",
                  backgroundColor: "#FFD700",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: "uppercase"
                }}
              >
                Draw #{dNum}
              </span>
            );
          })()}
        </div>
        <p
          style={{
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.6)",
            margin: "3px 0 0",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Every number is a chance for luxury.
        </p>
      </div>
    </>
  );
}
