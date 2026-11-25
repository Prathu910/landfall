import {
  AI_READ_PARAGRAPH,
  LEGAL_PAGES,
  type LegalPage,
  type LegalSlug,
} from "./copy";

/** A legal page's metadata: its own title, snippet and canonical path. */
export function legalMetadata(slug: LegalSlug) {
  const page = LEGAL_PAGES[slug];
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${slug}/` },
  };
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
