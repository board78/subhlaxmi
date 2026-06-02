import type { Metadata } from "next";
import { AppToaster } from "@/app/components/AppToaster";
import { ThemeSync } from "@/app/components/ThemeSync";
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
    "Subhlaxmi helps you book lottery tickets, track draw timings, and check live results — with a clean, modern experience.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "lottery",
    "lottery tickets",
    "lottery results",
    "live results",
    "jackpot",
    "draw timings",
    "India lottery",
    "UPI",
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
        {children}
      </body>
    </html>
  );
}
