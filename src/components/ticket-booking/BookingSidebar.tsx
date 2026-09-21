"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import { HiTicket } from "react-icons/hi2";
import type { TicketPublic } from "@/lib/draws";

type Props = {
  selected: Map<string, TicketPublic>;
  selectedCount: number;
  clearSelection: () => void;
  toggleTicket: (t: TicketPublic) => void;
  pricePerTicket: number;
  gstAmount: number;
  grandTotal: number;
  bookingState: string;
  bookingError: string;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  drawStatus: string;
};

export function BookingSidebar({
  selected,
  selectedCount,
  clearSelection,
  toggleTicket,
  pricePerTicket,
  gstAmount,
  grandTotal,
  bookingState,
  bookingError,
  handleAddToCart,
  handleBuyNow,
  drawStatus,
}: Props) {
  return (
    <>
      <aside className="hidden min-h-0 w-72 shrink-0 flex-col overflow-hidden border-l border-white/8 bg-[#110b0d] lg:flex xl:w-80">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
            Selected Tickets
            <span className="ml-2 rounded-full bg-amber-300/15 px-2 py-0.5 text-amber-200">
              {selectedCount}
            </span>
          </p>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-[10px] text-zinc-500 transition hover:text-zinc-300"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          {selectedCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-zinc-600">
              <span className="text-zinc-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.15)] bg-white/5 p-3 rounded-full border border-white/5 inline-flex items-center justify-center">
                <HiTicket className="w-6 h-6 rotate-[15deg]" />
              </span>
              <p className="text-xs font-semibold mt-1">No tickets selected yet</p>
              <p className="text-[11px] leading-5">
                Click a ticket number from the grid or use Quick Pick to auto-select.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {[...selected.values()].map((t) => (
                <div
                  key={t.number}
                  className="flex items-center justify-between rounded-xl border border-amber-200/15 bg-amber-300/5 px-3 py-2"
                >
                  <span className="font-mono text-xs font-semibold text-amber-200">{t.number}</span>
                  <button
                    type="button"
                    onClick={() => toggleTicket(t)}
                    className="text-zinc-600 transition hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/8 p-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Tickets selected</span>
              <span className="text-zinc-200">{selectedCount}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Price per ticket</span>
              <span className="text-zinc-200">₹{pricePerTicket}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>GST (18%)</span>
              <span className="text-zinc-200">
                ₹{selectedCount > 0 ? (gstAmount * selectedCount).toFixed(2) : 0}
              </span>
            </div>
            <div className="sl-sidebar-total-row flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-amber-300">
              <span>Total</span>
              <span>₹{grandTotal > 0 ? grandTotal.toFixed(2) : 0}</span>
            </div>
          </div>

          {bookingState === "error" && (
            <p className="mt-3 rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {bookingError}
            </p>
          )}

          {bookingState === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-3 text-[11px]"
            >
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <FaCheckCircle className="w-3.5 h-3.5" />
                Added to cart
              </p>
              <p className="mt-1 text-zinc-300 ml-5">Go to cart to pay and confirm.</p>
            </motion.div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedCount}
              className="sl-modal-secondary-btn rounded-full border border-white/12 bg-white/8 px-3 py-2 text-sm font-bold text-zinc-100 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart
            </button>
            <motion.button
              type="button"
              onClick={handleBuyNow}
              disabled={
                !selectedCount || bookingState === "booking" || bookingState === "success" || drawStatus === "closed"
              }
              whileHover={selectedCount > 0 && drawStatus !== "closed" ? { scale: 1.02 } : {}}
              transition={{ duration: 0.14 }}
              className="w-full rounded-full sl-cta-gradient sl-force-light-text px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {drawStatus === "closed"
                ? "Closed"
                : bookingState === "booking"
                  ? "Loading…"
                  : bookingState === "success"
                    ? "Added"
                    : selectedCount > 0
                      ? "Buy Now"
                      : "Select Tickets"}
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="shrink-0 border-t border-white/10 bg-[#18080f] px-4 py-3 lg:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-zinc-400">
                  {selectedCount} ticket{selectedCount !== 1 ? "s" : ""} selected
                </p>
                <p className="mt-0.5 text-sm font-bold text-amber-300">Total: ₹{grandTotal.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full border border-white/12 px-3 py-2 text-xs text-zinc-400"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={bookingState === "booking"}
                className="sl-modal-secondary-btn rounded-full border border-white/12 bg-white/8 px-3 py-2 text-sm font-bold text-zinc-100 transition disabled:opacity-50"
              >
                {bookingState === "booking" ? "Loading…" : "Add"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={bookingState === "booking"}
                className="rounded-full sl-cta-gradient sl-force-light-text px-3 py-2 text-sm font-bold transition disabled:opacity-50"
              >
                {bookingState === "booking" ? "Loading…" : "Buy Now"}
              </button>
            </div>
            {bookingState === "error" && (
              <p className="mt-2 text-[11px] text-red-300">{bookingError}</p>
            )}
            {bookingState === "success" ? (
              <p className="mt-2 text-[11px] text-emerald-300 flex items-center justify-center gap-1">
                <FaCheckCircle className="w-3 h-3" />
                Added to cart
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
