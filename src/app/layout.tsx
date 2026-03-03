import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sylvia Ndunge | Go-to-Market Architect",
    template: "%s | Sylvia Ndunge",
  },
  description:
    "Go-to-Market Architect for Web3, Fintech, and Greentech pioneers. Free AI-powered GTM audit, strategic frameworks, and fractional growth leadership.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Sylvia Ndunge",
    title: "Sylvia Ndunge | Go-to-Market Architect",
    description:
      "Go-to-Market Architect for Web3, Fintech, and Greentech pioneers. Free AI-powered GTM audit, strategic frameworks, and fractional growth leadership.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sylvia Ndunge | Go-to-Market Architect",
    description:
      "Go-to-Market Architect for Web3, Fintech, and Greentech pioneers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: "Sylvia Ndunge",
      jobTitle: "Go-to-Market Architect",
      description:
        "Fractional GTM leader for Web3, Fintech, and Greentech startups. Specializing in positioning, narrative strategy, and market entry.",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.sylvapoint.com",
      sameAs: [
        "https://www.linkedin.com/in/sylviandunge/",
        "https://x.com/sylviandunge",
        "https://www.tiktok.com/@sylviandunge",
      ],
    },
    {
      "@type": "ProfessionalService",
      name: "SylvaPoint",
      description:
        "AI-powered Go-to-Market audit and strategy tools for tech startups.",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.sylvapoint.com",
      founder: { "@type": "Person", name: "Sylvia Ndunge" },
      offers: {
        "@type": "Offer",
        name: "Free GTM Audit",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-sylva-950 focus:font-semibold"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
