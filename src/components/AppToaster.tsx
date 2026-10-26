"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function AppToaster() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    // Width listener for mobile & tablet detection
    const checkSize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    
    return () => {
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  const successClass = "!border-emerald-500/40 !text-emerald-300";
  const errorClass = "!border-red-500/40 !text-red-300";
  const warningClass = "!border-amber-400/40 !text-amber-300";
  const titleClass = "!font-sans !font-semibold !text-[13px]";
  const descClass  = "!font-sans !text-[11px] !opacity-70 !mt-0.5";
  const closeButtonClass = "!bg-white/8 hover:!bg-white/15 !text-zinc-400 hover:!text-white !border-white/10 !rounded-lg";

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
        theme="dark"
        position={position}
        richColors={false}
        closeButton
        expand={false}
        duration={4000}
        style={toasterStyle}
        toastOptions={{
          classNames: {
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
