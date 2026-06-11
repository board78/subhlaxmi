"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { DUMMY_BOOKINGS } from "../data/toastData";

type RealBooking = {
  id: string;
  name: string;
  city: string;
  tickets: number;
  drawName: string;
  bookedAt: string;
};

export function LiveBookingToast() {
  const realBookingsRef = useRef<RealBooking[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());

  // Fetch real bookings periodically
  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const res = await fetch("/api/tickets/recent");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          realBookingsRef.current = json.data;
        }
      } catch (err) {
        console.error("Failed to fetch recent bookings for toast", err);
      }
    };

    fetchRecentBookings();
    const interval = setInterval(fetchRecentBookings, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show first toast after 3 seconds
    const initialTimeout = setTimeout(() => {
      triggerRandomToast();
    }, 3000);

    // Trigger every 8 seconds (displays for 4s, hidden for 4s, feels natural)
    const interval = setInterval(() => {
      triggerRandomToast();
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const triggerRandomToast = () => {
    toast.dismiss(); // Instantly dismiss all previous toasts

    // Try to get an unshown REAL booking
    let bookingToDisplay: { name: string; city: string; tickets: number; drawName: string } | null = null;
    let isReal = false;

    const unshownReal = realBookingsRef.current.find(b => !shownIdsRef.current.has(b.id));

    if (unshownReal) {
      shownIdsRef.current.add(unshownReal.id);
      bookingToDisplay = unshownReal;
      isReal = true;
      // Optional: limit the size of the set so it doesn't grow infinitely
      if (shownIdsRef.current.size > 100) {
        const firstElements = Array.from(shownIdsRef.current).slice(0, 50);
        firstElements.forEach(id => shownIdsRef.current.delete(id));
      }
    } else {
      // Fallback to static dummy bookings
      const randomIndex = Math.floor(Math.random() * DUMMY_BOOKINGS.length);
      bookingToDisplay = DUMMY_BOOKINGS[randomIndex];
    }

    if (!bookingToDisplay) return;
    const booking = bookingToDisplay;

    // Wait 150ms before triggering the new toast for smooth transition
    setTimeout(() => {
      toast.custom(
        (t) => (
          <motion.div
            initial={{ opacity: 0, x: 120, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 120, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "100%",
              maxWidth: 320,
              borderRadius: 16,
              background: "linear-gradient(135deg, #1E222B 0%, #12141A 100%)",
              border: "1.5px solid rgba(255, 215, 0, 0.45)", // Unified Gold border
              padding: "12px 16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255, 215, 0, 0.15)",
              display: "flex",
              gap: 12,
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Pulsing Light Glow Accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 4,
                height: "100%",
                background: "linear-gradient(180deg, #FFD700, #EF4444)",
              }}
            />

            {/* Glowing Icon Container */}
            <div
              style={{
                display: "flex",
                height: 38,
                width: 38,
                borderRadius: 10,
                background: "rgba(255, 215, 0, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFD700",
                boxShadow: "0 0 8px rgba(255, 215, 0, 0.2)",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
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
            </div>

            {/* Text Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#2ECC71", // Pulsing green Live badge
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#2ECC71",
                      boxShadow: "0 0 6px #2ECC71",
                      display: "inline-block",
                      animation: "pulse 1.5s infinite"
                    }}
                  />
                  Live Booking
                </span>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.4)",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                    fontFamily: "sans-serif",
                  }}
                >
                  ✕
                </button>
              </div>
              
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#FFFFFF",
                  margin: "4px 0 2px",
                  lineHeight: 1.3,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ fontWeight: 700, color: "#FFD700" }}>{booking.name}</span>
                <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)" }}> ({booking.city})</span>
              </p>
              
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.75)",
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                booked <span style={{ fontWeight: 700, color: "#FFFFFF" }}>{booking.tickets} tickets</span> of{" "}
                <span style={{ fontWeight: 600, color: "#FFD700", textTransform: "capitalize" }}>{booking.drawName}</span>
              </p>
            </div>
            {/* Inline style for the pulse animation if it doesn't exist globally */}
            <style>{`
              @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </motion.div>
        ),
        { duration: 4000 }
      );
    }, 150);
  };

  return null;
}
