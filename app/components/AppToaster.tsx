"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function AppToaster() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const read = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
    setTimeout(() => setTheme(read()), 0);
    const obs = new MutationObserver(() => setTheme(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    
    // Width listener for mobile & tablet detection
    const checkSize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  const isDark = theme === "dark";

  const toastClass = isDark
    ? "!bg-[#1a0d14]/90 !text-zinc-100 !border-white/10 !backdrop-blur-xl !rounded-2xl !py-3.5 !px-4 !border !shadow-lg"
    : "!bg-white/90 !text-slate-900 !border-slate-200 !backdrop-blur-xl !rounded-2xl !py-3.5 !px-4 !border !shadow-lg";

  const successClass = isDark
    ? "!border-emerald-500/40 !text-emerald-300"
    : "!border-emerald-500/40 !text-emerald-800";

  const errorClass = isDark
    ? "!border-red-500/40 !text-red-300"
    : "!border-red-500/40 !text-red-800";

  const warningClass = isDark
    ? "!border-amber-400/40 !text-amber-300"
    : "!border-amber-400/40 !text-amber-800";

  const titleClass = "!font-sans !font-semibold !text-[13px]";
  const descClass  = "!font-sans !text-[11px] !opacity-70 !mt-0.5";

  const closeButtonClass = isDark
    ? "!bg-white/8 hover:!bg-white/15 !text-zinc-400 hover:!text-white !border-white/10 !rounded-lg"
    : "!bg-slate-100 hover:!bg-slate-200 !text-slate-400 hover:!text-slate-700 !border-slate-200 !rounded-lg";

  // Dynamic positioning and inline styles based on viewport size
  const position = isMobileOrTablet ? "bottom-right" : "top-right";
  const toasterStyle = isMobileOrTablet
    ? { bottom: "20px", right: "20px" }
    : { top: "85px" };

  return (
    <>
      <style>{`
        /* Desktop specific styles: slide in from right, top 85px alignment */
        @media (min-width: 1025px) {
          [data-sonner-toaster] [data-sonner-toast] {
            animation: slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) !important;
          }
          [data-sonner-toaster] [data-sonner-toast][data-removed="true"] {
            animation: slideOutRight 0.25s cubic-bezier(0.4, 0, 1, 1) forwards !important;
          }
        }

        /* Mobile and Tablet specific styles: position in bottom-right footer space, slide up from bottom */
        @media (max-width: 1024px) {
          [data-sonner-toaster] {
            bottom: 20px !important;
            right: 20px !important;
            left: auto !important;
          }
          
          /* Full-width alignment on narrow phones */
          @media (max-width: 480px) {
            [data-sonner-toaster] {
              left: 16px !important;
              right: 16px !important;
              bottom: 16px !important;
              width: calc(100% - 32px) !important;
            }
            [data-sonner-toaster] [data-sonner-toast] {
              width: 100% !important;
            }
          }
          
          [data-sonner-toaster] [data-sonner-toast] {
            animation: slideInUpMobile 0.32s cubic-bezier(0.22, 1, 0.36, 1) !important;
            margin: 0 !important;
          }
          [data-sonner-toaster] [data-sonner-toast][data-removed="true"] {
            animation: slideOutDownMobile 0.22s cubic-bezier(0.4, 0, 1, 1) forwards !important;
          }
        }

        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(110%); opacity: 0; }
        }
        @keyframes slideInUpMobile {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes slideOutDownMobile {
          from { transform: translateY(0);     opacity: 1; }
          to   { transform: translateY(30px);   opacity: 0; }
        }
      `}</style>
      <Toaster
        theme={theme}
        position={position}
        richColors={false}
        closeButton
        expand={false}
        duration={4000}
        style={toasterStyle}
        toastOptions={{
          classNames: {
            toast:       `${toastClass}`,
            success:     successClass,
            error:       errorClass,
            warning:     warningClass,
            title:       titleClass,
            description: descClass,
            closeButton: closeButtonClass,
          },
        }}
      />
    </>
  );
}