import { motion } from "framer-motion";
import { VerticalImageCarousel } from "@/components/VerticalImageCarousel";

interface HeroCarouselSectionProps {
  description: string;
}

export function HeroCarouselSection({ description }: HeroCarouselSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="royal-panel royal-panel-strong sl-hero-outline relative w-full overflow-hidden rounded-[24px] border-2 border-amber-500/35 bg-transparent px-5 pb-3 pt-5 sm:rounded-[28px] sm:px-6 sm:pt-6"
    >
      <div className="relative flex w-full flex-col items-center gap-4">
        <div className="">
          <VerticalImageCarousel className="p-0" intervalMs={3000} />
        </div>
        <div className="w-full max-w-4xl text-center">
          <p className="mx-auto mt-4 max-w-3xl text-[10px] leading-4 font-medium text-[var(--foreground)] opacity-[0.92] sm:text-xs sm:leading-6 md:text-sm">
            {description}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
