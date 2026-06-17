function getBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return new URL(raw);
  return new URL("https://bookmysubhlaxmi.com");
}

export default function robots() {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cart", "/payment", "/payment-status"],
      },
    ],
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}

