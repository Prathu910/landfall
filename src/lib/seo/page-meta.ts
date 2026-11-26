import type { Metadata } from "next";
import { SITE_NAME } from "../site";

/**
 * Open Graph locale. The audience reads English worldwide, but every page is
 * about Australian migration and is written in Australian English (the html
 * lang is en-AU), so en_AU matches the content.
 */
export const OG_LOCALE = "en_AU";

export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/** The site-wide share card (public/og.png, from `npm run og:image`). */
export const SITE_OG_IMAGE: OgImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "MigrateLens: Know your points. See where they'd put you.",
};

export type PageMetaInput = {
  /** The site path, ending in "/". */
  path: string;
  /** Plain titles get the layout's "· MigrateLens"; `absolute` is used as is. */
  title: string | { absolute: string };
  description: string;
  /** Guides, occupation pages and recaps are articles. */
  type?: "website" | "article";
  /** YYYY-MM-DD, for articles. */
  modifiedTime?: string;
  publishedTime?: string;
  image?: OgImage;
  robots?: Metadata["robots"];
};

/**
 * One page's metadata: title, description, canonical and a complete Open
 * Graph object. Next merges metadata shallowly, so a page that sets
 * `openGraph` replaces the layout's; this restates every field (og:title and
 * og:description are filled from the page's own title and description).
 */
export function pageMetadata(page: PageMetaInput): Metadata {
  const type = page.type ?? "website";
  const image = page.image ?? SITE_OG_IMAGE;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type,
      url: page.path,
      locale: OG_LOCALE,
      siteName: SITE_NAME,
      images: [image],
      ...(type === "article" && page.modifiedTime
        ? { modifiedTime: page.modifiedTime }
        : {}),
      ...(type === "article" && page.publishedTime
        ? { publishedTime: page.publishedTime }
        : {}),
    },
    twitter: { card: "summary_large_image", images: [image] },
    ...(page.robots ? { robots: page.robots } : {}),
  };
}

/** Metadata for one of the site's own pages (`site-pages.ts`). */
export function sitePageMetadata(
  page: {
    path: string;
    title: string;
    absolute?: boolean;
    description: string;
  },
  extra: Partial<PageMetaInput> = {},
): Metadata {
  return pageMetadata({
    path: page.path,
    title: page.absolute ? { absolute: page.title } : page.title,
    description: page.description,
    ...extra,
  });
}
