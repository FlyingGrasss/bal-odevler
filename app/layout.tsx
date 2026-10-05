import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { appUrl } from "@/lib/utils";

const siteName = "BAL Ödevler";
const siteDescription = "Bornova Anadolu Lisesi öğrencilerinin ve öğretmenlerinin güncel ödevleri.";
const siteUrl = appUrl();
const siteKeywords = ["BAL Ödevler", "Bornova Anadolu Lisesi", "ödevler", "okul ödevleri", "teslim tarihi"];
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });

const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": siteUrl + "#organization",
      name: "Bornova Anadolu Lisesi öğrencileri",
      url: siteUrl,
      logo: siteUrl + "icon.png",
      description: siteDescription,
      sameAs: ["https://www.instagram.com/balogrenci/", "https://linktr.ee/baloder"],
    },
    {
      "@type": "WebSite",
      "@id": siteUrl + "#website",
      url: siteUrl,
      name: siteName,
      inLanguage: "tr-TR",
      publisher: { "@id": siteUrl + "#organization" },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [{ name: "Bornova Anadolu Lisesi öğrencileri" }],
  creator: "Bornova Anadolu Lisesi öğrencileri",
  publisher: "Bornova Anadolu Lisesi öğrencileri",
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "tr_TR",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData) }} />
        <Providers>
          <Suspense fallback={<div className="h-16" aria-hidden="true" />}><SiteHeader /></Suspense>
          <main className="site-main">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
