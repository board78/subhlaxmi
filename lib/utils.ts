// ─── Pure helper functions ──────────────────────────────────────────────────
// No React imports here – just plain TypeScript utilities used across the app.

/** Simple non-crypto hash for deterministic pseudo-random values. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic sample ticket id  e.g. "sl-a-10001". */
export function formatSampleTicket(seed: string): string {
  const series = ["a", "b", "c", "d", "e"][hashString(seed) % 5];
  const n = 10000 + (hashString(`${seed}:n`) % 90000);
  return `sl-${series}-${n}`;
}

/** Generates a random alphanumeric referral code */
export function generateReferralCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Draw / countdown helpers ───────────────────────────────────────────────

const DRAW_HOURS = [13, 18, 21];

/** Returns the next upcoming draw time from `baseDate`. */
export function getNextDrawTime(baseDate: Date): Date {
  const now = new Date(baseDate);
  for (const hour of DRAW_HOURS) {
    const candidate = new Date(now);
    candidate.setHours(hour, 0, 0, 0);
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(DRAW_HOURS[0], 0, 0, 0);
  return tomorrow;
}

/** Formats a Date into a human-readable IST draw time string. */
export function formatDrawTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
  }).format(date);
}

/** Breaks milliseconds into padded days / hours / minutes / seconds strings. */
export function msToCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days:    String(days).padStart(2, "0"),
    hours:   String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

/** Parses a drawDate and drawTime string into a single unified Date object in local time. */
export function parseDrawDateTime(drawDate: string | Date, drawTime: string): Date {
  const date = new Date(drawDate);
  // Reset time to midnight
  date.setHours(0, 0, 0, 0);

  const cleanTime = drawTime.trim().toUpperCase();
  const timeRegex = /(\d+)(?::(\d+))?\s*(AM|PM)?/;
  const match = cleanTime.match(timeRegex);

  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3];

    if (ampm === "PM" && hours < 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

export function getPublicAppOrigin(request?: { nextUrl: { origin: string }; headers: Headers }): string {
  let base = process.env.APP_URL?.trim() || "";
  if (!base && request) {
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    if (proto && host) base = `${proto}://${host}`;
    else base = request.nextUrl.origin;
  }
  if (!base) base = "https://bookmysubhlaxmi.com";

  base = base.replace(/\/$/, "");
  if (base.startsWith("http://")) base = `https://${base.slice(7)}`;
  if (!base.startsWith("https://")) base = `https://${base.replace(/^\/+/, "")}`;

  return base;
}