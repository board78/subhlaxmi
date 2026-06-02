"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldHalved, FaBoltLightning, FaWhatsapp } from "react-icons/fa6";

interface FooterProps {
  language?: "en" | "hi";
}

export function Footer({ language = "en" }: FooterProps) {
  const isHi = language === "hi";

  const brandDesc = isHi
    ? "Subhlaxmi भारत का सबसे प्रीमियम, पारदर्शी और साफ डिजिटल लॉटरी ट्रैकर और लाइव परिणाम अनुभव प्रदान करता है।"
    : "Subhlaxmi provides India's most premium, transparent, and clean digital lottery tracking and live results experience.";

  const playLabel = isHi ? "18+ जिम्मेदारी से खेलें" : "18+ Play Responsibly";
  const playDesc = isHi
    ? "यह प्लेटफॉर्म केवल सूचना और मनोरंजन के उद्देश्य से है। लॉटरी में वित्तीय जोखिम शामिल हो सकता है। कृपया जिम्मेदारी से खेलें।"
    : "This platform is for informational & tracking purposes. Lottery participation involves financial risk. Please participate responsibly.";

  const colQuickLinks = isHi ? "त्वरित लिंक्स" : "Quick Links";
  const colContact = isHi ? "सपोर्ट संपर्क" : "Contact & Support";
  const colLegal = isHi ? "महत्वपूर्ण नीतियां" : "Legal & Policies";

  const links = [
    { label: isHi ? "मुख्य पृष्ठ" : "Home", href: "/" },
    { label: isHi ? "मेरे टिकट" : "My Tickets", href: "/?auth=signin" },
    { label: isHi ? "लाइव परिणाम" : "Live Results", href: "#" },
    { label: isHi ? "जैकपॉट्स" : "Jackpots", href: "#" },
    { label: isHi ? "सपोर्ट डेस्क" : "Support Help", href: "#" },
  ];

  const contactItems = [
    {
      icon: (
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
      label: "support@subhlaxmilottery.com",
      href: "mailto:support@subhlaxmilottery.com",
    },
    {
      icon: <FaWhatsapp className="w-4 h-4 text-emerald-500" />,
      label: isHi ? "व्हाट्सएप सहायता" : "WhatsApp Support",
      href: "https://wa.me/8949178289",
    },
  ];

  const legalLinks = [
    { label: isHi ? "नियम और शर्तें" : "Terms & Conditions", href: "#" },
    { label: isHi ? "गोपनीयता नीति" : "Privacy Policy", href: "#" },
    { label: isHi ? "वापसी नीति" : "Refund Policy", href: "#" },
    { label: isHi ? "ज़िम्मेदारी से खेलें" : "Responsible Gaming", href: "#" },
  ];

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    // Initial check
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="royal-panel relative mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-[#14070f] p-6 md:p-8 lg:p-10 shadow-2xl">

      {/* Background glow lines */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-0 left-0 h-48 w-48 rounded-full bg-fuchsia-500/5 blur-3xl" />

      <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand column */}
        <div className="flex flex-col gap-3">
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-2xl font-black tracking-wider text-transparent uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            Subhlaxmi
          </span>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            {brandDesc}
          </p>

          {/* 18+ badge & warning */}
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-red-500/25 bg-red-500/5 p-3 shadow-inner">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-wide">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {playLabel}
            </span>
            <p className="text-[10px] text-zinc-500 leading-normal font-medium">
              {playDesc}
            </p>
          </div>
        </div>

        {/* Quick links column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200 border-b border-white/5 pb-2">
            {colQuickLinks}
          </h4>
          <ul className="flex flex-col gap-2.5">
            {links.map((link, idx) => (
              <li key={idx}>
                <Link
                  href={link.href}
                  className="text-xs font-semibold text-zinc-400 transition hover:text-amber-400 flex items-center gap-1.5"
                >
                  <span className="h-1 w-1 rounded-full bg-orange-500/40" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal links column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200 border-b border-white/5 pb-2">
            {colLegal}
          </h4>
          <ul className="flex flex-col gap-2.5">
            {legalLinks.map((link, idx) => (
              <li key={idx}>
                <Link
                  href={link.href}
                  className="text-xs font-semibold text-zinc-400 transition hover:text-amber-400 flex items-center gap-1.5"
                >
                  <span className="h-1 w-1 rounded-full bg-amber-500/40" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact/Support Column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200 border-b border-white/5 pb-2">
            {colContact}
          </h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            {isHi
              ? "हमारे ग्राहक सपोर्ट चैनल लाइव हैं। भुगतान पूछताछ या सामान्य सहायता के लिए कभी भी पहुंचें।"
              : "Our customer support channels are live. Reach out anytime for payment inquiries or general assistance."}
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {contactItems.map((item, idx) => (
              <li key={idx}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:border-white/10 hover:text-white"
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom section line & copyright info */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-center sm:flex-row sm:text-left">
        <p className="text-[10px] font-semibold text-zinc-500 tracking-wide uppercase">
          &copy; {new Date().getFullYear()} Subhlaxmi. All rights reserved.
        </p>

        {/* Security indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
            <FaShieldHalved className="w-2.5 h-2.5" />
            SSL Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wide">
            <FaBoltLightning className="w-2.5 h-2.5" />
            Instant Draw
          </span>
        </div>
      </div>

      {/* Floating Go to Top Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-5 right-5 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950/60 text-zinc-400 backdrop-blur-md transition-all duration-200 hover:bg-zinc-900/80 hover:text-white active:scale-90 shadow-lg"
            aria-label="Scroll to top"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

    </footer>
  );
}
