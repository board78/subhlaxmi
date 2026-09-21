"use client";

import { motion } from "framer-motion";
import type { DrawPublic } from "@/lib/draws";

type Tab = "available" | "lp_special" | "search";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  draw: DrawPublic;
  ticketData: any; // Using any or picking specific types from TicketPage
  activeSeries: string;
  setActiveSeries: (series: string) => void;
  setPage: (page: number) => void;
};

export function SeriesSelector({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  draw,
  ticketData,
  activeSeries,
  setActiveSeries,
  setPage,
}: Props) {
  
  const activeSeriesRange = {
    start: draw.ticketRangeStart.toString().padStart(5, "0"),
    end: draw.ticketRangeEnd.toString().padStart(5, "0"),
  };

  return (
    <>
      <div className="shrink-0 border-b border-white/8 bg-[#0f0a0c]">
        <div className="flex overflow-x-auto px-4 text-xs font-bold uppercase tracking-[0.12em] sm:px-5">
          {(["available", "lp_special", "search"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab !== "search") setSearchQuery("");
              }}
              className={`relative shrink-0 cursor-pointer px-4 py-3 transition sm:px-5 ${
                activeTab === tab ? "text-amber-300" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "available"
                ? "Available"
                : tab === "lp_special"
                  ? "LP Series"
                  : "Search Number"}
              {activeTab === tab && (
                <motion.div
                  layoutId="book-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-300"
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === "search" && (
          <div className="px-4 pb-3 pt-1 sm:px-5">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket number e.g. 10025"
              className="w-full rounded-2xl border border-amber-200/20 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50"
              inputMode="numeric"
            />
          </div>
        )}
      </div>

      <div className="shrink-0 border-b border-white/8 bg-[#0f0a0c] px-4 py-3 sm:px-5">
        {ticketData?.stats && (
          <div className="mb-3 text-[10px] leading-relaxed text-zinc-400 sm:text-xs">
            Series: <span className="text-amber-200">{activeSeries}</span>
            {" · "}Range:{" "}
            <span className="text-zinc-200">
              {draw.ticketPrefix}-{activeSeries}-{activeSeriesRange.start} to{" "}
              {draw.ticketPrefix}-{activeSeries}-{activeSeriesRange.end}
            </span>
            {" · "}Total:{" "}
            <span className="text-zinc-200">{ticketData.stats.total.toLocaleString("en-IN")}</span>
            {" · "}Available:{" "}
            <span className="font-semibold text-emerald-300">
              {ticketData.stats.available.toLocaleString("en-IN")}
            </span>
            {" · "}Sold:{" "}
            <span className="font-semibold text-red-400">
              {ticketData.stats.sold.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {draw.series.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setActiveSeries(s);
                setPage(1);
              }}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
                activeSeries === s
                  ? "border-amber-300 bg-amber-300/15 text-amber-200"
                  : "border-white/12 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
              }`}
            >
              {s} Series
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-4 text-[10px] font-semibold text-zinc-400 sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-emerald-400/40 bg-emerald-400/30" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-red-400/40 bg-red-400/30" />
              Sold
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-cyan-400/40 bg-cyan-400/30" />
              LP Special
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
