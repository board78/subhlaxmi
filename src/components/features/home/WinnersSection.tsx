import { useState } from "react";
import { FaTrophy } from "react-icons/fa6";
import { WinnerCard } from "@/components/WinnerCard";
import type { LiveResult } from "@/lib/types";

interface WinnersSectionProps {
  liveResults: LiveResult[];
}

export function WinnersSection({ liveResults }: WinnersSectionProps) {
  const [winnerBurst, setWinnerBurst] = useState({ image: "", key: 0 });

  return (
    <section className="royal-panel sl-winners-section mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#14070f] p-5 sm:mt-5">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute right-[-7rem] bottom-[-7rem] h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sl-winners-kicker text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">Trusted results</p>
          <h2 className="mt-2 text-xl font-semibold">Celebrating Our Winners</h2>
          <p className="mt-1 text-xs text-zinc-500">Recent wins from verified ticket buyers.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          {liveResults.filter((r) => r.winnerName).length} winners
        </span>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {liveResults.filter((r) => r.winnerName).slice(0, 5).map((winner, index) => {
          const palette = [
            "from-amber-400/30 to-orange-500/25", "from-cyan-400/25 to-blue-500/25",
            "from-emerald-400/25 to-lime-500/20", "from-fuchsia-400/25 to-purple-500/25",
            "from-sky-400/25 to-teal-500/20",
          ];
          return (
            <WinnerCard
              key={winner.id}
              winnerName={winner.winnerName!}
              imageUrl={winner.winnerImage}
              amount={winner.prize}
              gradientClass={palette[index % palette.length]}
              burstKey={winnerBurst.image === winner.id ? winnerBurst.key : 0}
              onBurst={() => setWinnerBurst((c) => ({ image: winner.id, key: c.key + 1 }))}
            />
          );
        })}
        {liveResults.filter((r) => r.winnerName).length === 0 && (
          <div className="col-span-full py-16 text-center flex flex-col items-center justify-center">
            <div className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.35)] p-4 bg-white/5 rounded-full border border-white/5 flex items-center justify-center">
              <FaTrophy className="w-8 h-8" />
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-400">Winner results will appear here soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}
