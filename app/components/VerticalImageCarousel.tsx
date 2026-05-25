"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ─── VerticalImageCarousel ────────────────────────────────────────────────────
// Auto-advances through a list of images.  Falls back to the static list if the
// /api/carousel-images endpoint returns nothing.

const STATIC_IMAGES = [
  "/slider1.png", "/slider2.png", "/slider3.png", "/slider4.png",
  "/slider5.png", "/slider7.png", "/slider8.png", "/slider9.png", "/slider10.png",
] as const;

type Props = { className?: string; intervalMs?: number };

export function VerticalImageCarousel({ className, intervalMs = 1000 }: Props) {
  const [activeIndex, setActiveIndex]     = useState(0);
  const [dynamicImages, setDynamicImages] = useState<string[]>([]);
  const timerRef    = useRef<number | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  // Try to fetch dynamic images from the API
  useEffect(() => {
    fetch("/api/carousel-images")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        if (data.images?.length) setDynamicImages(data.images.map((img: { url: string }) => img.url));
      })
      .catch(() => {});
  }, []);

  const images = dynamicImages.length ? dynamicImages : (STATIC_IMAGES as unknown as string[]);

  // Auto-advance timer
  useEffect(() => {
    const tick = () => {
      timerRef.current = window.setTimeout(() => {
        setActiveIndex((i) => (i + 1) % images.length);
        tick();
      }, intervalMs);
    };
    tick();
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [intervalMs, images.length, restartKey]);

  const jumpTo = (index: number) => {
    setActiveIndex(index);
    setRestartKey((prev) => prev + 1);
  };

  const src = images[activeIndex] ?? images[0];

  return (
    <div className={["relative flex w-full flex-col", className ?? ""].join(" ")}>
      <div className="relative aspect-[1672/941] w-full overflow-hidden rounded-[22px] bg-black/20">
        <AnimatePresence mode="wait">
          {src && (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 28, scale: 0.99 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={  { opacity: 0, y: -22, scale: 0.99 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={src}
                alt={`Slider image ${activeIndex + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1200px"
                className="object-contain object-center"
                priority={activeIndex === 0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dot navigation */}
      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i} type="button" onClick={() => jumpTo(i)}
            className={`h-2 cursor-pointer rounded-full transition ${i === activeIndex ? "w-7 bg-amber-300" : "w-2 bg-white/25 hover:bg-white/40"}`}
            aria-label={`Show slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}