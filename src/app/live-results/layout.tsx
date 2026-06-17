import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subhlaxmi Lottery Live Results Today | Live Draw Results",
  description:
    "Check Subhlaxmi Lottery live results today. Real-time lottery draw results, winning ticket numbers, and prize amounts. Subhlaxmi lottery result today - live updates. सुभलक्ष्मी लॉटरी आज का रिजल्ट लाइव देखें।",
  alternates: {
    canonical: "/live-results",
  },
  keywords: [
    "subhlaxmi lottery result today",
    "subhlaxmi lottery live result",
    "subhlaxmi lottery result",
    "subhlaxmi result",
    "lottery result today",
    "live lottery result",
    "live draw result",
    "lottery result check",
    "today lottery result India",
    "kuber ka khajana result",
    "kuber lottery result",
    "सुभलक्ष्मी लॉटरी रिजल्ट आज",
    "लॉटरी रिजल्ट आज",
    "live lottery results India",
    "online lottery result",
    "lottery sambad result",
    "lottery winning number",
    "lottery draw result today",
  ],
  openGraph: {
    title: "Subhlaxmi Lottery Live Results Today | Live Draw Results",
    description:
      "Check Subhlaxmi Lottery live results today. Real-time lottery draw results and winning ticket numbers. सुभलक्ष्मी लॉटरी आज का रिजल्ट।",
    url: "/live-results",
    images: [
      { url: "/winnerticket.png", width: 1200, height: 630, alt: "Subhlaxmi Lottery Live Results Today" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subhlaxmi Lottery Live Results Today",
    description: "Check Subhlaxmi Lottery live results. Real-time lottery draw results and winning ticket numbers.",
    images: ["/winnerticket.png"],
  },
};

export default function LiveResultsLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Subhlaxmi Lottery Live Results",
    "description": "Check Subhlaxmi Lottery live results today. Real-time lottery draw results and winning ticket numbers.",
    "url": "https://subhlaxmi.in/live-results",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://subhlaxmi.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Live Results",
          "item": "https://subhlaxmi.in/live-results"
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
