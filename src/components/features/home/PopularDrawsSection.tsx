import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DrawTicketCard } from "@/components/DrawTicketCard";
import type { DrawSummaryPublic } from "@/lib/draws";

interface PopularDrawsSectionProps {
  liveDraws: DrawSummaryPublic[];
  language: string;
  popularTitle: string;
  buyTicketLabel: string;
  onBuy: (draw: DrawSummaryPublic) => void;
}

export function PopularDrawsSection({
  liveDraws,
  language,
  popularTitle,
  buyTicketLabel,
  onBuy
}: PopularDrawsSectionProps) {
  const [drawsPage, setDrawsPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("default");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!filterOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".sort-dropdown-container")) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [filterOpen]);

  const handleSortChange = (option: string) => {
    setSortBy(option);
    setDrawsPage(1);
    setFilterOpen(false);
  };

  const getPrizeValue = (draw: DrawSummaryPublic) => {
    const raw = draw.prizeAmount || "";
    const digitsMatch = raw.replace(/[^\d.]/g, "");
    let num = parseFloat(digitsMatch) || 0;
    const lower = raw.toLowerCase();
    if (lower.includes("cr") || lower.includes("crore") || lower.includes("करोड़")) {
      num *= 10000000;
    } else if (lower.includes("lakh") || lower.includes("लाख")) {
      num *= 100000;
    }
    return num;
  };

  const sortOptions = [
    { value: "default", labelEn: "Default Order", labelHi: "डिफ़ॉल्ट क्रम" },
    { value: "drawDateAsc", labelEn: "Draw Date: Nearest First", labelHi: "ड्रॉ तारीख: पहले निकटतम" },
    { value: "drawDateDesc", labelEn: "Draw Date: Furthest First", labelHi: "ड्रॉ तारीख: पहले दूरतम" },
    { value: "prizeDesc", labelEn: "Jackpot: High to Low", labelHi: "जैकपॉट: अधिक से कम" },
    { value: "prizeAsc", labelEn: "Jackpot: Low to High", labelHi: "जैकपॉट: कम से अधिक" },
    { value: "priceAsc", labelEn: "Ticket Price: Low to High", labelHi: "टिकट दाम: कम से अधिक" },
    { value: "priceDesc", labelEn: "Ticket Price: High to Low", labelHi: "टिकट दाम: अधिक से कम" },
    { value: "nameAsc", labelEn: "Name: A to Z", labelHi: "नाम: A से Z" },
    { value: "nameDesc", labelEn: "Name: Z to A", labelHi: "नाम: Z से A" },
    { value: "availableDesc", labelEn: "Tickets Available: Most First", labelHi: "उपलब्ध टिकट: अधिक पहले" },
    { value: "availableAsc", labelEn: "Tickets Available: Least First", labelHi: "उपलब्ध टिकट: कम पहले" },
    { value: "soldDesc", labelEn: "Tickets Sold: Most First", labelHi: "बिके टिकट: अधिक पहले" },
  ];

  const sortedDraws = useMemo(() => {
    if (!liveDraws.length) return [];

    const active = liveDraws.filter(d => d.status === "active");
    const upcoming = [...liveDraws.filter(d => d.status === "upcoming")].sort((a, b) =>
      new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
    );
    const closed = liveDraws.filter(d => d.status === "closed");

    const nextUpcoming = upcoming.length > 0 ? upcoming[0] : null;
    const remainingUpcoming = upcoming.slice(1);

    const defaultResult: DrawSummaryPublic[] = [];
    if (nextUpcoming) defaultResult.push(nextUpcoming);
    defaultResult.push(...active);
    defaultResult.push(...remainingUpcoming);
    defaultResult.push(...closed);

    if (sortBy === "default") {
      return defaultResult;
    }

    const items = [...liveDraws];
    switch (sortBy) {
      case "drawDateAsc":
        return items.sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());
      case "drawDateDesc":
        return items.sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
      case "prizeDesc":
        return items.sort((a, b) => getPrizeValue(b) - getPrizeValue(a));
      case "prizeAsc":
        return items.sort((a, b) => getPrizeValue(a) - getPrizeValue(b));
      case "priceAsc":
        return items.sort((a, b) => a.pricePerTicket - b.pricePerTicket);
      case "priceDesc":
        return items.sort((a, b) => b.pricePerTicket - a.pricePerTicket);
      case "nameAsc":
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case "nameDesc":
        return items.sort((a, b) => b.name.localeCompare(a.name));
      case "availableDesc":
        return items.sort((a, b) => (b.availableTickets ?? 0) - (a.availableTickets ?? 0));
      case "availableAsc":
        return items.sort((a, b) => (a.availableTickets ?? 0) - (b.availableTickets ?? 0));
      case "soldDesc":
        return items.sort((a, b) => {
          const aSold = (a.totalTickets || 500) - (a.availableTickets ?? 500);
          const bSold = (b.totalTickets || 500) - (b.availableTickets ?? 500);
          return bSold - aSold;
        });
      default:
        return defaultResult;
    }
  }, [liveDraws, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedDraws.length / 6));

  return (
    <section className="royal-panel rounded-[24px] border border-white/10 bg-[#14070f] p-4 sm:rounded-[28px] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold sm:text-xl">{popularTitle}</h2>
          <span className="hidden sm:inline-flex rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-zinc-400 font-mono tracking-wider">IST</span>
        </div>
        
        {/* Sort/Filter Dropdown */}
        <div className="sort-dropdown-container relative">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center justify-center gap-1.5 rounded-full border-0 sm:border border-transparent sm:border-white/10 bg-transparent sm:bg-white/[0.03] p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white hover:border-white/30 cursor-pointer"
            aria-label="Sort & Filter"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="hidden sm:inline">{language === "hi" ? "फ़िल्टर / क्रम" : "Sort & Filter"}</span>
            {sortBy !== "default" ? (
              <span className="hidden sm:inline-flex ml-1 text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-medium">
                {sortOptions.find(o => o.value === sortBy)?.[language === "hi" ? "labelHi" : "labelEn"]}
              </span>
            ) : (
              <span className="hidden sm:inline-flex ml-1 text-[10px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full">
                {language === "hi" ? "डिफ़ॉल्ट" : "Default"}
              </span>
            )}
          </button>

          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-[#14070f] backdrop-blur-xl p-1.5 shadow-2xl z-50 origin-top-right"
              >
                <div className="px-3 py-2 border-b border-white/5 mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {language === "hi" ? "क्रमबद्ध करें" : "Sort By"}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5 hide-scrollbar">
                  {sortOptions.map((option) => {
                    const active = option.value === sortBy;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                          active
                            ? "bg-white/10 text-white font-semibold"
                            : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span>{language === "hi" ? option.labelHi : option.labelEn}</span>
                        {active && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {sortedDraws.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-zinc-400">No active draws available</p>
          <p className="mt-1 text-xs text-zinc-600">New draws will appear here once activated by the admin.</p>
        </div>
      ) : (
        <>
          <div className="grid items-start gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 w-full">
            {sortedDraws.slice((drawsPage - 1) * 6, drawsPage * 6).map((draw, index) => (
              <DrawTicketCard
                key={draw.id}
                draw={draw}
                index={index}
                language={language as any}
                buyLabel={buyTicketLabel}
                onBuy={() => onBuy(draw)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
            <button type="button" onClick={() => setDrawsPage((p) => Math.max(1, p - 1))} disabled={drawsPage === 1}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
              Previous
            </button>
            <span className="text-[11px] font-semibold text-zinc-500">Page {drawsPage} of {totalPages}</span>
            <button type="button" onClick={() => setDrawsPage((p) => Math.min(totalPages, p + 1))} disabled={drawsPage >= totalPages}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
