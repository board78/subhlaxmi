// ─── FACADE ──────────────────────────────────────────────────────────────────
// This file acts as a facade to maintain backward compatibility with existing
// imports across the application. New code should import directly from the
// appropriate layers in `src/types/` or `src/server/services/`.

export * from "@/types/qpc.types";
export * from "@/server/services/qpc.service";
