import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { AppToaster } from "@/components/AppToaster";
import { ThemeSync } from "@/components/ThemeSync";
import { FacebookPixelProvider } from "@/components/FacebookPixelProvider";
import { RegistrationPopup } from "@/components/RegistrationPopup";
import "./globals.css";

function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return new URL(raw);
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: "Subhlaxmi Lottery",
  title: {
    default: "Lottery Online | Subhlaxmi Lottery - Buy Tickets & Live Results",
    template: "%s | Subhlaxmi Lottery",
  },
  description:
    "Play online lottery at Subhlaxmi Lottery. Buy premium lottery tickets securely, track live lottery draw timings, and check instant lottery results. India's top trusted online lottery platform.",
  verification: {
    google: 'WUm_WRHMrUFa1_Jse43ozsnN1BUFGIik0KfhR36mq5M',
  },
  alternates: {
    canonical: "/",
  },
  keywords: [
    "lottery",
    "online lottery",
    "lottery ticket",
    "buy lottery",
    "lottery result",
    "Subhlaxmi",
    "Subhlaxmi Lottery",
    "online lottery India",
    "buy lottery tickets online",
    "live lottery results",
    "play lottery online",
    "today lottery result",
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
    siteName: "Subhlaxmi Lottery",
    title: "Lottery Online | Subhlaxmi Lottery - Buy Tickets & Live Results",
    description:
      "Play online lottery at Subhlaxmi. Buy premium lottery tickets, follow draw timings, and check live lottery results securely.",
    url: "/",
    images: [
      { url: "/kuber.png", width: 1200, height: 630, alt: "Subhlaxmi Lottery - Kuber Ka Khajana" },
      { url: "/winnerticket.png", width: 1200, height: 630, alt: "Subhlaxmi Lottery winner ticket" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lottery Online | Subhlaxmi Lottery - Buy Tickets & Live Results",
    description:
      "Play online lottery at Subhlaxmi. Buy premium lottery tickets, follow draw timings, and check live lottery results securely.",
    images: ["/kuber.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Subhlaxmi Lottery",
    "url": "https://subhlaxmi.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://subhlaxmi.in/live-results?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "description": "Play online lottery at Subhlaxmi Lottery. Buy premium lottery tickets securely, track live lottery draw timings, and check instant lottery results."
  };

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeSync />
        <AppToaster />
        <FacebookPixelProvider />
        {children}
        <RegistrationPopup />
        <GoogleAnalytics gaId="G-XB00843X9G" />
      </body>
    </html>
  );
}
