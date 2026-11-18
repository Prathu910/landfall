import type { Metadata } from "next";
import "@fontsource/newsreader/latin-600.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Landfall — A clearer picture of Australian skilled migration",
    template: "%s · Landfall",
  },
  description:
    "Understand your skilled migration points, personal dates and published occupation data. A free, source-backed check for Australian 189, 190 and 491 pathways.",
  metadataBase: new URL(
    "https://landfall-migration-report.cappedpike4.chatgpt.site",
  ),
  robots: { index: false, follow: false },
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
