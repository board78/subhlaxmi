// ─── Shared types ────────────────────────────────────────────────────────────
// Keep types in one place so every component imports from here instead of
// re-declaring the same shape.

export type LiveResult = {
  id: string;
  drawName: string;
  drawNumber?: number;
  winningTicket: string;
  prize: string;
  winnerName: string | null;
  winnerImage: string | null;
  declaredAt: string;
};
