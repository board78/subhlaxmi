function getBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return new URL(raw);
  return new URL("http://localhost:3000");
}

export default function robots() {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}

