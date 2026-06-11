import { motion } from "framer-motion";
import type { SafeUser } from "@/lib/auth";

interface UpiPromoProps {
  title: string;
  description: string;
  buttonText: string;
  authUser: SafeUser | null;
  onOpenAuth: () => void;
}

export function UpiPromo({ title, description, buttonText, authUser, onOpenAuth }: UpiPromoProps) {
  return (
    <motion.section whileHover={{ y: -3 }} transition={{ duration: 0.18 }}
      className="royal-panel sl-upi-promo rounded-[24px] border border-orange-300/15 bg-gradient-to-r from-[#582313] via-[#8a2b13] to-[#d37b13] p-4 sm:rounded-[28px] sm:p-5">
      <p className="sl-upi-kicker text-[11px] uppercase tracking-[0.18em] text-orange-100/85 sm:text-xs">UPI • Instant results</p>
      <h2 className="sl-upi-title mt-2 max-w-lg text-xl font-semibold leading-snug sm:mt-3 sm:text-2xl">{title}</h2>
      {description && (
        <p className="sl-upi-body mt-2 max-w-xl text-xs leading-6 text-orange-50/90 sm:text-sm sm:leading-7">{description}</p>
      )}
      {!authUser && (
        <button type="button" onClick={onOpenAuth}
          className="sl-force-light-text mt-4 rounded-full border border-white/10 bg-[#180808] px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.03] sm:mt-5">
          {buttonText}
        </button>
      )}
    </motion.section>
  );
}
