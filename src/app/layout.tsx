import type { Metadata } from "next";
import { AppToaster } from "@/components/AppToaster";
import { ThemeSync } from "@/components/ThemeSync";
import { FacebookPixelProvider } from "@/components/FacebookPixelProvider";
import "./globals.css";

function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return new URL(raw);
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: "Subhlaxmi",
  title: {
    default: "Subhlaxmi | Modern Lottery Tickets & Live Results",
    template: "%s | Subhlaxmi",
  },
  description:
    "Play Subhlaxmi Lottery online. Book premium lottery tickets securely, track live draw timings, and check instant results. India's trusted online lottery platform.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Subhlaxmi",
    "Subhlaxmi Lottery",
    "Subhlaxmi Result",
    "online lottery India",
    "buy lottery tickets online",
    "Subhlaxmi weekly draw",
    "live lottery results",
    "Kuber Ka Khajana",
    "India lottery tickets",
    "trusted lottery platform",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Subhlaxmi",
    title: "Subhlaxmi | Modern Lottery Tickets & Live Results",
    description:
      "Book tickets, follow draw timings, and check live results — designed for a clean, premium experience.",
    url: "/",
    images: [
      { url: "/kuber.png", width: 1200, height: 630, alt: "Subhlaxmi - Kuber Ka Khajana" },
      { url: "/winnerticket.png", width: 1200, height: 630, alt: "Subhlaxmi winner ticket" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subhlaxmi | Modern Lottery Tickets & Live Results",
    description:
      "Book tickets, follow draw timings, and check live results — designed for a clean, premium experience.",
    images: ["/kuber.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ThemeSync />
        <AppToaster />
        <FacebookPixelProvider />
        {children}
      </body>
    </html>
  );
}
