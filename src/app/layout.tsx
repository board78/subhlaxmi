import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { AppToaster } from "@/components/AppToaster";
import { ThemeSync } from "@/components/ThemeSync";
import { FacebookPixelProvider } from "@/components/FacebookPixelProvider";
import { RegistrationPopup } from "@/components/RegistrationPopup";
import { FloatingChatBox } from "@/components/FloatingChatBox";
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
    default: "Subhlaxmi Lottery - Online Lottery India | Tickets & Live Results",
    template: "%s | Subhlaxmi Lottery",
  },
  description:
    "Subhlaxmi Lottery - India's most trusted online lottery platform. Buy lottery tickets online, check live lottery results, and win big prizes. Subhlaxmi lottery draw results today. सुभलक्ष्मी लॉटरी - ऑनलाइन टिकट खरीदें और लाइव रिजल्ट देखें।",
  verification: {
    google: 'WUm_WRHMrUFa1_Jse43ozsnN1BUFGIik0KfhR36mq5M',
  },
  alternates: {
    canonical: "/",
  },
  // ── Favicon & App Icons ───────────────────────────────────────────────────
  icons: {
    // Browser tab icon — Next.js uses src/app/favicon.ico automatically,
    // but listing them explicitly ensures correct sizes are served.
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    // Apple home screen icon (iOS Safari "Add to Home Screen")
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    // Android/PWA icons (referenced by site.webmanifest)
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  // Web app manifest (enables "Add to Home Screen" prompt on Android)
  manifest: "/site.webmanifest",
  keywords: [
    // Primary brand keywords
    "subhlaxmi lottery",
    "Subhlaxmi Lottery",
    "subhlaxmi",
    "subhlaxmi lottery online",
    "subhlaxmi lottery result",
    "subhlaxmi lottery ticket",
    "subhlaxmi lottery today result",
    "subhlaxmi lottery draw",
    // Hindi brand keywords (for Hindi searches)
    "सुभलक्ष्मी लॉटरी",
    "सुभलक्ष्मी",
    "subhalaxmi lottery",
    "shubhlaxmi lottery",
    "subhlakshmi lottery",
    // General lottery keywords
    "online lottery",
    "lottery ticket",
    "buy lottery ticket online",
    "lottery result today",
    "live lottery results",
    "online lottery India",
    "lottery India",
    "play lottery online India",
    "lottery draw result",
    "winning lottery ticket",
    "jackpot lottery India",
    "lottery ticket buy",
    "today lottery result",
    "lottery sambad",
    "kuber lottery",
    "kuber ka khajana lottery",
    // Long tail
    "trusted online lottery platform India",
    "buy lottery tickets securely online",
    "live draw lottery results India",
    "lottery result check online",
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
    locale: "en_IN",
    siteName: "Subhlaxmi Lottery",
    title: "Subhlaxmi Lottery - Online Lottery India | Tickets & Live Results",
    description:
      "Subhlaxmi Lottery - Buy lottery tickets online, check live results, win big prizes. India's most trusted online lottery platform. सुभलक्ष्मी लॉटरी - भारत की सबसे भरोसेमंद ऑनलाइन लॉटरी।",
    url: "/",
    images: [
      { url: "/kuber.png", width: 1200, height: 630, alt: "Subhlaxmi Lottery - Kuber Ka Khajana - Online Lottery India" },
      { url: "/winnerticket.png", width: 1200, height: 630, alt: "Subhlaxmi Lottery winner ticket - Online Lottery" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subhlaxmi Lottery - Online Lottery India | Tickets & Live Results",
    description:
      "Subhlaxmi Lottery - Buy lottery tickets online, check live results. India's most trusted online lottery. सुभलक्ष्मी लॉटरी।",
    images: ["/kuber.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Subhlaxmi Lottery",
      "alternateName": ["Subhlaxmi", "Subhlaxmi Lottery Online", "Shubhlaxmi Lottery", "सुभलक्ष्मी लॉटरी"],
      "url": "https://subhlaxmi.in",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://subhlaxmi.in/live-results?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "description": "Subhlaxmi Lottery - India's most trusted online lottery platform. Buy lottery tickets online, check live lottery results, and win big prizes."
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Subhlaxmi Lottery",
      "alternateName": ["Subhlaxmi", "सुभलक्ष्मी लॉटरी"],
      "url": "https://subhlaxmi.in",
      "logo": "https://subhlaxmi.in/logo.png",
      "description": "Subhlaxmi Lottery is India's most trusted online lottery platform where you can buy lottery tickets, check live lottery results, and win big prizes.",
      "areaServed": "IN",
      "serviceType": "Online Lottery",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["English", "Hindi"]
      },
      "sameAs": [
        "https://subhlaxmi.in"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Subhlaxmi Lottery?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Subhlaxmi Lottery is India's trusted online lottery platform where you can buy lottery tickets online, check live lottery draw results, and win exciting prizes including jackpots up to 25 Crore INR."
          }
        },
        {
          "@type": "Question",
          "name": "How to buy Subhlaxmi Lottery ticket online?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Visit subhlaxmi.in, register your account, choose your preferred lottery draw like Kuber Ka Khajana, select your ticket, and pay securely via UPI. Your ticket will be confirmed instantly."
          }
        },
        {
          "@type": "Question",
          "name": "How to check Subhlaxmi Lottery result today?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Visit the Live Results page on subhlaxmi.in to check today's Subhlaxmi Lottery result. Results are updated in real-time as draws are announced."
          }
        }
      ]
    }
  ];

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Geo tags for India targeting */}
        <meta name="geo.region" content="IN" />
        <meta name="geo.country" content="India" />
        <meta name="language" content="English, Hindi" />
        <meta name="revisit-after" content="3 days" />
        <meta name="rating" content="general" />
        <link rel="alternate" hrefLang="en-in" href="https://subhlaxmi.in" />
        <link rel="alternate" hrefLang="hi" href="https://subhlaxmi.in" />
      </head>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeSync />
        <AppToaster />
        <FacebookPixelProvider />
        {children}
        <RegistrationPopup />
        <FloatingChatBox />
        <GoogleAnalytics gaId="G-XB00843X9G" />
      </body>
    </html>
  );
}
