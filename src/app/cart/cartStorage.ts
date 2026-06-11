"use client";

export type CartTicketItem = {
  drawId: string;
  drawName: string;
  drawDate: string;
  drawTime: string;
  pricePerTicket: number;
  ticketNumbers: string[];
};

export type CartState = {
  items: CartTicketItem[];
  updatedAt: string;
};

const STORAGE_KEY = "subhlaxmi_cart_v1";

function safeParse(raw: string | null): CartState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CartState;
  } catch {
    return null;
  }
}

export function getCart(): CartState {
  if (typeof window === "undefined") return { items: [], updatedAt: new Date(0).toISOString() };
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || !Array.isArray(parsed.items)) return { items: [], updatedAt: new Date(0).toISOString() };
  return parsed;
}

export function setCart(next: CartState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("subhlaxmi_cart_updated"));
}

export function clearCart() {
  setCart({ items: [], updatedAt: new Date().toISOString() });
}

export function mergeCarts(primary: CartState, secondary: CartState): CartState {
  const map = new Map<string, CartTicketItem>();

  const upsert = (item: CartTicketItem) => {
    const key = item.drawId;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, ticketNumbers: [...new Set(item.ticketNumbers)] });
      return;
    }
    map.set(key, {
      ...existing,
      ...item,
      ticketNumbers: [...new Set([...existing.ticketNumbers, ...item.ticketNumbers])],
    });
  };

  primary.items.forEach(upsert);
  secondary.items.forEach(upsert);

  return { items: [...map.values()], updatedAt: new Date().toISOString() };
}

export function addToCart(payload: Omit<CartTicketItem, "ticketNumbers"> & { ticketNumbers: string[] }) {
  const current = getCart();
  const deduped = [...new Set(payload.ticketNumbers)].filter(Boolean);
  if (!deduped.length) return;

  const idx = current.items.findIndex((i) => i.drawId === payload.drawId);
  const updatedAt = new Date().toISOString();

  if (idx >= 0) {
    const existing = current.items[idx]!;
    const merged = [...new Set([...existing.ticketNumbers, ...deduped])];
    const items = [...current.items];
    items[idx] = { ...existing, ...payload, ticketNumbers: merged };
    setCart({ items, updatedAt });
    return;
  }

  setCart({
    items: [...current.items, { ...payload, ticketNumbers: deduped }],
    updatedAt,
  });
}

export function removeTickets(drawId: string, ticketNumbers: string[]) {
  const current = getCart();
  const removeSet = new Set(ticketNumbers);
  const items = current.items
    .map((item) =>
      item.drawId !== drawId
        ? item
        : { ...item, ticketNumbers: item.ticketNumbers.filter((n) => !removeSet.has(n)) },
    )
    .filter((item) => item.ticketNumbers.length > 0);

  setCart({ items, updatedAt: new Date().toISOString() });
}

export function removeDraw(drawId: string) {
  const current = getCart();
  const items = current.items.filter((i) => i.drawId !== drawId);
  setCart({ items, updatedAt: new Date().toISOString() });
}

/** Milliseconds for comparing which cart snapshot is newer (client vs server). */
export function cartUpdatedAtMs(cart: CartState): number {
  const t = Date.parse(cart.updatedAt);
  return Number.isFinite(t) ? t : 0;
}

