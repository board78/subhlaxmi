import { Redis } from "@upstash/redis";

// Gracefully read Upstash credentials
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// In-memory counter for local development fallback
let fallbackCount = 1438;

function getTodayKey() {
  const now = new Date();
  // Adjust to IST timezone (+5.5 hours)
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return `visitors:${ist.toISOString().split("T")[0]}`;
}

export async function POST(req: Request) {
  try {
    if (!redis) {
      console.warn("Upstash Redis is not configured in .env variables. Running in stateful fallback mode.");
      fallbackCount += 1;
      return Response.json({ count: fallbackCount });
    }

    const todayKey = getTodayKey();
    
    // Directly increment the total visitor page views for the day (no IP validation)
    await redis.incr(todayKey);
    
    // Calculate current time in IST to ensure it resets at midnight
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const midnight = new Date(ist);
    midnight.setHours(24, 0, 0, 0); // Next midnight in IST
    
    // Ensure the main day counter key expires after midnight
    await redis.expireat(todayKey, Math.floor(midnight.getTime() / 1000) + 3600); // 1 hour buffer
    
    const count = await redis.get<number>(todayKey) ?? 0;
    return Response.json({ count });
  } catch (error) {
    console.error("Error in POST /api/visitors:", error);
    fallbackCount += 1;
    return Response.json({ count: fallbackCount });
  }
}

export async function GET() {
  try {
    if (!redis) {
      return Response.json({ count: fallbackCount });
    }
    const count = await redis.get<number>(getTodayKey()) ?? 0;
    return Response.json({ count });
  } catch (error) {
    console.error("Error in GET /api/visitors:", error);
    return Response.json({ count: fallbackCount });
  }
}
