import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GapForge — AI Research Gap Detection Platform",
    template: "%s | GapForge",
  },
  manifest: "/manifest.json",
  description:
    "GapForge scans 250M+ academic papers across 10+ live databases to surface genuine research gaps with real citations. Features: Gap AI, Paper Writer, Grant Writer, Peer Review AI, Literature Map, and 70+ research tools.",
  keywords: [
    "research gaps", "academic research", "literature review", "research intelligence",
    "gap detection", "PhD tools", "research AI", "paper writer", "grant writer",
    "systematic review", "citation analysis", "research tools"
  ],
  authors: [{ name: "GapForge" }],
  creator: "GapForge",
  publisher: "GapForge",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "GapForge — AI Research Gap Detection Platform",
    description: "Discover genuine research gaps backed by real academic sources. 250M+ papers, 10+ databases, 70+ research tools.",
    siteName: "GapForge",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GapForge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GapForge — AI Research Gap Detection",
    description: "Discover genuine research gaps backed by real academic sources.",
    creator: "@gapforge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GapForge" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <Providers>
          <ErrorBoundary>
            {children}
            <Analytics />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
