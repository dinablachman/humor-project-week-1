import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
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
    default: "Humor project",
    template: "%s · Humor project",
  },
  description: "Famous movies from Supabase, with Google sign-in and profiles.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* The header reads the session cookie, so it streams in behind a
            fallback and does not hold up the rest of the page. */}
        <Suspense fallback={<SiteHeaderFallback />}>
          <SiteHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
