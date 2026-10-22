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

  const links = [
    { label: isHi ? "मुख्य पृष्ठ" : "Home", href: "/" },
    { label: isHi ? "मेरे टिकट" : "My Tickets", href: "/my-tickets" },
    { label: isHi ? "लाइव परिणाम" : "Live Results", href: "/live-results" },
    { label: isHi ? "सपोर्ट डेस्क" : "Support Help", href: "/support" },
  ];

  const contactItems = [
    {
      icon: (
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
      label: "subhlaxmilottery@gmail.com",
      href: "mailto:subhlaxmilottery@gmail.com",
    },
    {
      icon: <FaWhatsapp className="w-4 h-4 text-emerald-500" />,
      label: isHi ? "व्हाट्सएप सहायता" : "WhatsApp Support",
      href: "https://wa.me/+12236673706",
    },
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
    <footer className="royal-panel relative mt-10 overflow-hidden rounded-4xl sm:rounded-[40px] border border-amber-500/15 bg-linear-to-b from-[#14070f] to-[#0a0307] shadow-2xl shadow-black/50">
      {/* Background glow lines */}
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-125 w-125 rounded-full bg-amber-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-100 w-100 rounded-full bg-fuchsia-600/10 blur-[100px]" />

      <div className="relative px-6 py-10 md:px-10 md:py-16 lg:px-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          
          {/* Brand column */}
          <div className="flex flex-col gap-6 sm:col-span-2 lg:col-span-5 lg:pr-10">
            <div>
              <span className="bg-linear-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-3xl md:text-4xl font-black tracking-widest text-transparent uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                Subhlaxmi
              </span>
              <div className="mt-1 h-1 w-12 rounded-full bg-linear-to-r from-amber-500 to-orange-500" />
            </div>
            
            <p className="max-w-md text-sm text-zinc-400 leading-relaxed font-medium">
              {brandDesc}
            </p>

            {/* 18+ badge & warning */}
            <div className="mt-2 flex max-w-md flex-col gap-3 rounded-2xl border border-red-500/20 bg-linear-to-br from-red-500/10 to-transparent p-4 shadow-inner backdrop-blur-sm">
              <span className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                {playLabel}
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                {playDesc}
              </p>
            </div>
          </div>

          {/* Quick links column */}
          <div className="flex flex-col gap-5 lg:col-span-3 lg:pl-10">
            <h4 className="text-sm font-black uppercase tracking-[0.15em] text-zinc-100">
              {colQuickLinks}
            </h4>
            <ul className="flex flex-col gap-3.5">
              {links.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="group flex w-fit items-center gap-2 text-sm font-semibold text-zinc-400 transition-colors hover:text-amber-400"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20 transition-all duration-300 group-hover:w-3 group-hover:bg-amber-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact/Support Column */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            <h4 className="text-sm font-black uppercase tracking-[0.15em] text-zinc-100">
              {colContact}
            </h4>
            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
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
                    className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 p-3 transition-all hover:-translate-y-0.5 hover:bg-white/4 hover:border-white/10 hover:shadow-lg hover:shadow-black/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-white/10">
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold text-zinc-300 transition-colors group-hover:text-white truncate">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom section line & copyright info */}
        <div className="mt-16 flex flex-col items-center gap-6 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase">
            &copy; {new Date().getFullYear()} Subhlaxmi. All rights reserved.
          </p>

          {/* Security indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
              <FaShieldHalved className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                SSL Encrypted
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
              <FaBoltLightning className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Instant Draw
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Go to Top Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-[#17060d]/90 text-amber-500 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-amber-500 hover:text-[#17060d] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
            aria-label="Scroll to top"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}