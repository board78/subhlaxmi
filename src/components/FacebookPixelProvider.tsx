"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
        if (!pixelId) return;

        ReactPixel.init(pixelId, undefined, {
          autoConfig: true,
          debug: false,
        });
        ReactPixel.pageView();
      })
      .catch((err) => console.error("Error loading Facebook Pixel:", err));
  }, []);

  useEffect(() => {
    import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
        if (pixelId) {
          ReactPixel.pageView();
        }
      })
      .catch((err) => console.error("Error sending PageView on navigation:", err));
  }, [pathname, searchParams]);

  return null;
}

export function FacebookPixelProvider() {
  return (
    <Suspense fallback={null}>
      <PixelTracker />
    </Suspense>
  );
}
