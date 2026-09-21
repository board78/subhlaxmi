"use client";

import { RefObject } from "react";
import type { TicketPublic } from "@/lib/draws";
import { TicketButton } from "./TicketButton";
import { TicketGridSkeleton } from "./TicketGridSkeleton";

type TicketPage = {
  tickets: TicketPublic[];
  total: number;
  hasMore: boolean;
  page: number;
};

type Props = {
  gridRef: RefObject<HTMLDivElement | null>;
  drawStatus: string;
  loadingTickets: boolean;
  ticketData: TicketPage | null;
  selected: Map<string, TicketPublic>;
  toggleTicket: (ticket: TicketPublic) => void;
  loadingMore: boolean;
  onLoadMore: (page: number) => void;
  currentPage: number;
};

export function NumberGrid({
  gridRef,
  drawStatus,
  loadingTickets,
  ticketData,
  selected,
  toggleTicket,
  loadingMore,
  onLoadMore,
  currentPage,
}: Props) {
  return (
    <div
      ref={gridRef}
      className="hide-scrollbar relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-2 sm:px-5"
    >
      {drawStatus === "closed" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="rounded-2xl border border-red-500/30 bg-[#1a0b0d] p-6 text-center shadow-2xl">
            <p className="text-lg font-bold text-red-400">Booking Closed</p>
            <p className="mt-1 text-sm text-zinc-400">This draw is closed. Waiting for results.</p>
          </div>
        </div>
      )}
      
      {loadingTickets ? (
        <div className="flex h-40 items-center justify-center">
          <TicketGridSkeleton />
        </div>
      ) : ticketData?.tickets.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-500">
          <p className="text-sm font-semibold">No tickets found</p>
          <p className="text-xs">Try a different series or search term.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5 pt-1 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {ticketData?.tickets.map((ticket) => (
              <TicketButton
                key={ticket.id}
                ticket={ticket}
                isSelected={selected.has(ticket.number)}
                onToggle={toggleTicket}
              />
            ))}
          </div>

          {ticketData?.hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => onLoadMore(currentPage + 1)}
                className="cursor-pointer rounded-full border border-white/15 px-6 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-white/30 disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more tickets"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
