"use client";

import { AnimatePresence, motion } from "framer-motion";

type CarouselDesktopProps = {
  src: string;
  activeIndex: number;
  images: string[];
  jumpTo: (index: number) => void;
  className?: string;
};

export function CarouselDesktop({
  src,
  activeIndex,
  images,
  jumpTo,
  className = "",
}: CarouselDesktopProps) {
  return (
    <div className={["flex w-full flex-col", className].join(" ")}>
      <div className="w-full overflow-hidden rounded-[22px] bg-black/20 border border-white/10 shadow-2xl">
        <AnimatePresence mode="wait">
          {src && (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 28, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -22, scale: 0.99 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={src}
                alt={`Desktop slider image ${activeIndex + 1}`}
                className="w-full h-auto block"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Optimized Dot Navigation */}
      <div className="mt-4 flex justify-center items-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jumpTo(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`
              cursor-pointer rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
              ${i === activeIndex
                ? "w-8 h-[6px] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]"
                : "w-[6px] h-[6px] bg-white/20 hover:bg-white/40 hover:scale-110"
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}
