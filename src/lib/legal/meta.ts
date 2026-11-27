import type { Metadata } from "next";
import { breadcrumbLd, webPageLd } from "../seo/json-ld";
import { pageMetadata } from "../seo/page-meta";
import { SITE_NAME, SITE_URL } from "../site";
import {
  AI_READ_PARAGRAPH,
  LEGAL_PAGES,
  LEGAL_UPDATED,
  type LegalPage,
  type LegalSlug,
} from "./copy";

/** A legal page's metadata: its own title, snippet, canonical and Open Graph. */
export function legalMetadata(slug: LegalSlug): Metadata {
  const page = LEGAL_PAGES[slug];
  return pageMetadata({
    path: `/${slug}/`,
    title: page.title,
    description: page.description,
  });
}

/** A legal page's JSON-LD: the page (dated by the last revision) and its breadcrumb. */
export function legalJsonLd(page: LegalPage): object[] {
  return [
    webPageLd({
      type: page.slug === "contact" ? "ContactPage" : "WebPage",
      name: page.title,
      description: page.description,
      url: `${SITE_URL}/${page.slug}/`,
      dateModified: LEGAL_UPDATED,
    }),
    breadcrumbLd([
      { name: SITE_NAME, item: `${SITE_URL}/` },
      { name: page.crumb, item: `${SITE_URL}/${page.slug}/` },
    ]),
  ];
}

/** The privacy page names Anthropic only while the AI-written summary is on. */
export function privacyPage(readEnabled: boolean): LegalPage {
  const page = LEGAL_PAGES.privacy;
  if (!readEnabled) return page;
  return {
    ...page,
    sections: page.sections.map((section) =>
      section.heading === "Who processes it"
        ? { ...section, paragraphs: [...section.paragraphs, AI_READ_PARAGRAPH] }
        : section,
    ),
  };
}
