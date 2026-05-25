// ─── PanelCorners ─────────────────────────────────────────────────────────────
// Purely decorative royal-corner accents placed at each corner of a panel.
// No props needed – just drop it inside a `relative` container.

export function PanelCorners() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="royal-corner royal-corner-tl left-2 top-2 scale-75" />
      <div className="royal-corner royal-corner-tr right-2 top-2 scale-75" />
      <div className="royal-corner royal-corner-bl bottom-2 left-2 scale-75" />
      <div className="royal-corner royal-corner-br bottom-2 right-2 scale-75" />
    </div>
  );
}