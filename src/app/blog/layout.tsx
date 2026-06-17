import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subhlaxmi Lottery Blog | Tips, Winner Stories & Lottery News India",
  description:
    "Read Subhlaxmi Lottery blog for lottery tips, winner stories, lottery news India, and guides on how to buy lottery tickets online. सुभलक्ष्मी लॉटरी ब्लॉग - जीत की कहानियां और लॉटरी टिप्स।",
  alternates: {
    canonical: "/blog",
  },
  keywords: [
    "subhlaxmi lottery blog",
    "lottery tips India",
    "lottery winner stories",
    "how to buy lottery ticket online",
    "lottery news India",
    "online lottery tips",
    "lottery guide India",
    "kuber lottery tips",
    "subhlaxmi lottery tips",
    "lottery result tips",
    "lottery winning tips",
    "सुभलक्ष्मी लॉटरी ब्लॉग",
    "लॉटरी टिप्स हिंदी",
  ],
  openGraph: {
    title: "Subhlaxmi Lottery Blog | Tips, Winner Stories & Lottery News India",
    description:
      "Read Subhlaxmi Lottery blog for lottery tips, winner stories, and lottery news India. सुभलक्ष्मी लॉटरी ब्लॉग।",
    url: "/blog",
    images: [
      { url: "/logo.png", width: 1200, height: 630, alt: "Subhlaxmi Lottery Blog" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subhlaxmi Lottery Blog | Tips & Winner Stories",
    description: "Read Subhlaxmi Lottery blog for tips, winner stories, and lottery news.",
    images: ["/logo.png"],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Subhlaxmi Lottery Blog",
    "description": "Lottery tips, winner stories, and lottery news from Subhlaxmi Lottery - India's trusted online lottery platform.",
    "url": "https://subhlaxmi.in/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Subhlaxmi Lottery",
      "logo": {
        "@type": "ImageObject",
        "url": "https://subhlaxmi.in/logo.png"
      }
    },
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
          "name": "Blog",
          "item": "https://subhlaxmi.in/blog"
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
