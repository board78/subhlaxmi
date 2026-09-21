"use client";

type Props = {
  pricePerTicket: number;
  perTicketLabel: string;
  language: "en" | "hi";
  drawTimeLabel: string;
};

export function TicketPriceAndDate({ pricePerTicket, perTicketLabel, language, drawTimeLabel }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        paddingTop: 10,
        marginBottom: 14,
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
          ₹{pricePerTicket} <span style={{ fontWeight: 500, fontSize: 15, color: "rgba(255,255,255,0.6)" }}>{perTicketLabel}</span>
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
          {language === "hi" ? "निकासी की तारीख" : "Draw Date"}
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
  );
}
