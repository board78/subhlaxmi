import { getDb } from "@/lib/mongodb";

/**
 * Automatically applies Cloudinary automatic format and quality optimizations
 * (e.g. AVIF/WebP, quality auto) reducing image weight by ~80% without quality loss.
 */
export function optimizeImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (!url.includes("/upload/f_auto") && !url.includes("/upload/q_auto")) {
      return url.replace("/upload/", "/upload/f_auto,q_auto/");
    }
  }
  return url;
}

const DEFAULT_CAROUSEL_IMAGES = ["/winnerticket.png"];

/**
 * Fetches carousel images directly from MongoDB on the server.
 * Returns optimized URLs sorted by order.
 */
export async function getCarouselImagesServer(): Promise<string[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection("carousel_images")
      .find()
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    if (!docs || docs.length === 0) {
      return DEFAULT_CAROUSEL_IMAGES;
    }

    const urls = docs
      .map((doc) => (typeof doc.url === "string" ? optimizeImageUrl(doc.url) : null))
      .filter((url): url is string => Boolean(url));

    return urls.length > 0 ? urls : DEFAULT_CAROUSEL_IMAGES;
  } catch (error) {
    console.error("[CarouselService] Failed to fetch carousel images:", error);
    return DEFAULT_CAROUSEL_IMAGES;
  }
}
