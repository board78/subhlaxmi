"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function AppToaster() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const read = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
    setTimeout(() => setTheme(read()), 0);
    const obs = new MutationObserver(() => setTheme(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      expand={false}
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "sl-toast !font-sans !shadow-lg !border",
          title: "!font-semibold",
          description: "!text-[13px] !opacity-90",
        },
      }}
    />
  );
}
