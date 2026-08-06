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
    default: "GapForge — Research Intelligence Platform",
    template: "%s | GapForge",
  },
  description:
    "Discover genuine research gaps, get weekly intelligence drops, and simplify academic papers with AI-powered source verification.",
  keywords: ["research gaps", "academic research", "literature review", "research intelligence"],
  authors: [{ name: "GapForge" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "GapForge — Research Intelligence Platform",
    description: "Discover genuine research gaps backed by real academic sources.",
    siteName: "GapForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "GapForge — Research Intelligence Platform",
    description: "Discover genuine research gaps backed by real academic sources.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
