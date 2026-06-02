"use client";

import { AnimatePresence, motion } from "framer-motion";

type CarouselMobileProps = {
  src: string;
  activeIndex: number;
  images: string[];
  jumpTo: (index: number) => void;
  className?: string;
};

export function CarouselMobile({
  src,
  activeIndex,
  images,
  jumpTo,
  className = "",
}: CarouselMobileProps) {
  return (
    <div className={["flex w-full flex-col", className].join(" ")}>

      {/* relative add kiya taaki dots andar position ho sakein */}
      <div className="relative w-full overflow-hidden rounded-[8px] bg-black/20 border border-white/5 shadow-lg">
        <AnimatePresence mode="wait">
          {src && (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={src}
                alt={`Mobile slider image ${activeIndex + 1}`}
                className="w-full h-auto block"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dots — image ke andar bottom mein */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`
                cursor-pointer rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                ${i === activeIndex
                  ? "w-6 h-[5px] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 shadow-[0_0_6px_1px_rgba(251,191,36,0.5)]"
                  : "w-[5px] h-[5px] bg-white/40 hover:bg-white/60 hover:scale-110"
                }
              `}
            />
          ))}
        </div>

      </div>
    </div>
  );
}