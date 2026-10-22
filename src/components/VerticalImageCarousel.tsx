"use client";

import { useEffect, useRef, useState } from "react";
import { CarouselMobile } from "./CarouselMobile";
import { CarouselDesktop } from "./CarouselDesktop";
import { useCarouselImages } from "@/hooks/useHomeData";

const STATIC_IMAGES = [
  "/winnerticket.png", // Provide a solid fallback
] as const;

type Props = {
  className?: string;
  intervalMs?: number;
  initialImages?: string[];
};

export function VerticalImageCarousel({ className, intervalMs = 3000, initialImages }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [restartKey, setRestartKey] = useState(0);

  // SWR receives SSR initialImages as immediate fallbackData
  const dynamicImages = useCarouselImages(initialImages);

  const images = dynamicImages.length
    ? dynamicImages
    : (initialImages && initialImages.length > 0
      ? initialImages
      : (STATIC_IMAGES as unknown as string[]));

  // Preload and keep all slides in browser cache so switching is 100% instant with 0 stutter
  const preloadedRefs = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !images.length) return;
    preloadedRefs.current = images.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });
  }, [images]);

  // Continuous auto-scroll interval without any hover pause blocking
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [images.length, intervalMs, restartKey]);

  const jumpTo = (index: number) => {
    setActiveIndex(index);
    setRestartKey((prev) => prev + 1);
  };

  const src = images[activeIndex] ?? images[0];

  return (
    <div className="w-full">
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
    </div>
  );
}
