import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
    default: "SylvaPoint — GTM Audit Tool",
    template: "%s | SylvaPoint",
  },
  description:
    "Grade your Go-To-Market strategy in 60 seconds. Free automated GTM audit across 6 dimensions: positioning, copy, SEO, lead capture, performance, and visual creative.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SylvaPoint",
    title: "SylvaPoint — Grade Your Go-To-Market in 60 Seconds",
    description:
      "Free automated GTM audit. Score your website across 6 dimensions based on frameworks from Dunford, Schwartz, Hormozi, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SylvaPoint — GTM Audit Tool",
    description:
      "Grade your Go-To-Market strategy in 60 seconds. Free automated audit across 6 dimensions.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SylvaPoint",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Grade your Go-To-Market strategy in 60 seconds. Free automated GTM audit across 6 dimensions: positioning, copy, SEO, lead capture, performance, and visual creative.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.sylvapoint.com",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "50",
  },
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
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
