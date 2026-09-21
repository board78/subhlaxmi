"use client";

export function TicketGridSkeleton() {
  return (
    <div className="grid w-full grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-lg border border-white/6 bg-white/4"
        />
      ))}
    </div>
  );
}
