import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";

import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";

import "./globals.css";

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [siteConfig.ogImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${inter.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background-base text-foreground-primary flex min-h-full flex-col">
        <a
          href="#main-content"
          className="bg-background-raised text-foreground-primary focus-visible:ring-ring sr-only rounded-md px-4 py-2 text-sm focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus-visible:ring-3"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AnnouncementBar message="Free discreet shipping on research orders over $200 · Research use only" />
          <Header />
          <MobileNav />
          <main id="main-content" className="flex flex-1 flex-col">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
