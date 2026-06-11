"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCart } from "@/app/cart/cartStorage";

export function CartNavButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const cart = getCart();
      const total = cart.items.reduce((sum, item) => sum + item.ticketNumbers.length, 0);
      setCount(total);
    };
    sync();
    window.addEventListener("subhlaxmi_cart_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("subhlaxmi_cart_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const label = useMemo(() => (count > 0 ? `Cart (${count})` : "Cart"), [count]);

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="sl-cart-btn relative inline-flex items-center justify-center rounded-full border border-white/15 bg-black/20 px-3 py-2 text-zinc-100 transition hover:border-white/30"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="text-zinc-100"
        aria-hidden
      >
        <path
          d="M6.5 6h15l-1.2 7.2a2 2 0 0 1-2 1.7H9a2 2 0 0 1-2-1.6L5.2 3.8A1.5 1.5 0 0 0 3.7 2.6H2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 21a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
          fill="currentColor"
        />
        <path
          d="M18 21a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
          fill="currentColor"
        />
      </svg>

      {count > 0 ? (
        <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-[#2d1400]">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

