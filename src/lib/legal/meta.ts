import type { Metadata } from "next";
import { pageMetadata } from "../seo/page-meta";
import {
  AI_READ_PARAGRAPH,
  LEGAL_PAGES,
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
