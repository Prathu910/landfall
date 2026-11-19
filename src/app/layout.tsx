import type { Metadata } from "next";
import "@fontsource/newsreader/latin-600.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "MigrateLens: your points and where they'd put you",
    template: "%s · MigrateLens",
  },
  description:
    "Check your points-test basics and see where they sit in published SkillSelect data. A free, source-backed report for Australian 189, 190 and 491 pathways.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "MigrateLens: Know your points. See where they'd put you.",
      },
    ],
    siteName: "MigrateLens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "MigrateLens: Know your points. See where they'd put you.",
      },
    ],
  },
  robots: SITE_INDEXABLE
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
