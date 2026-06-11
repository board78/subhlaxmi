function getBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return new URL(raw);
  return new URL("http://localhost:3000");
}

export default function sitemap() {
  const baseUrl = getBaseUrl();

  return [
    {
      url: new URL("/", baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}

