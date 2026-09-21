"use client";

import { motion } from "framer-motion";

type Props = {
  onBuy: () => void;
  buyLabel: string;
  total: number;
  fakeProgress: number;
  language: "en" | "hi";
};

export function TicketActions({ onBuy, buyLabel, total, fakeProgress, language }: Props) {
  return (
    <>
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
          borderRadius: 12,
          padding: "10px 16px",
          fontSize: 14,
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
            justifyContent: "flex-end",
            alignItems: "center",
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.5)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span>{total.toLocaleString("en-IN")} Total</span>
        </div>
        {/* Progress bar loader */}
        <div
          style={{
            height: 4,
            width: "100%",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fakeProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #EF4444)",
              borderRadius: 999,
            }}
          />
        </div>
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
          fontSize: 9.5,
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
    </>
  );
}
