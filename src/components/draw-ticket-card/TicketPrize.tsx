"use client";

type Props = {
  prizeKicker: string;
  prize: string | null;
};

export function TicketPrize({ prizeKicker, prize }: Props) {
  return (
    <div
      style={{
        textAlign: "center",
        margin: "14px 0",
        position: "relative",
      }}
    >
      <p
        style={{
          fontSize: 9,
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
          fontSize: "clamp(1.4rem, 4.5vw, 1.85rem)",
          fontWeight: 800,
          color: "#FFD700",
          lineHeight: 1.1,
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
          textShadow: "0 0 15px rgba(255, 215, 0, 0.4)",
        }}
      >
        {prize ?? "₹?"}
      </p>
    </div>
  );
}
