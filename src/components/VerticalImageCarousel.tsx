"use client";

import { useEffect, useRef, useState } from "react";
import { CarouselMobile } from "./CarouselMobile";
import { CarouselDesktop } from "./CarouselDesktop";
import { useCarouselImages } from "@/hooks/useHomeData";

const STATIC_IMAGES = [
  "/winnerticket.png", // Provide a solid fallback
] as const;

type Props = { className?: string; intervalMs?: number };

export function VerticalImageCarousel({ className, intervalMs = 1000 }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  // SWR handles caching across page navigations instantly
  const dynamicImages = useCarouselImages();

  const images = dynamicImages.length ? dynamicImages : (STATIC_IMAGES as unknown as string[]);

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
    <>
      {/* Mobile + Tablet Carousel - visible up to lg screen size */}
      <div className="block lg:hidden w-full">
        <CarouselMobile
          src={src}
          activeIndex={activeIndex}
          images={images}
          jumpTo={jumpTo}
          className={className}
        />
      </div>

      {/* Desktop Carousel - visible from lg screen size upwards */}
      <div className="hidden lg:block w-full">
        <CarouselDesktop
          src={src}
          activeIndex={activeIndex}
          images={images}
          jumpTo={jumpTo}
          className={className}
        />
      </div>

      {/* 🚀 SEO & Performance: Preload all images so they don't blink/flash when animating */}
      <div className="hidden">
        {images.map((img) => (
          <link key={img} rel="preload" href={img} as="image" />
        ))}
      </div>
    </>
  );
}
