import { SITE_NAME, SITE_URL } from "../site";

/**
 * The site's typed JSON-LD builders: every page's structured data comes from
 * here (docs/ENGINEERING.md, "SEO, AEO and GEO conventions").
 */

export type FaqEntry = { question: string; answer: string };
export type Crumb = { name: string; item: string };

const CONTEXT = "https://schema.org";

export function faqPageLd(faq: FaqEntry[]): object {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbLd(crumbs: Crumb[]): object {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      ...entry,
    })),
  };
}

/** A guide or article page: what it covers, when it was checked, who publishes it. */
export function articleLd(page: {
  headline: string;
  description: string;
  url: string;
  dateModified: string;
  citations: string[];
}): object {
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: page.headline,
    description: page.description,
    url: page.url,
    mainEntityOfPage: page.url,
    dateModified: page.dateModified,
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    citation: page.citations,
  };
}

/** Ordered steps, e.g. the route to a skilled visa. */
export function howToLd(page: {
  name: string;
  description: string;
  steps: { name: string; text: string; url: string }[];
}): object {
  return {
    "@context": CONTEXT,
    "@type": "HowTo",
    name: page.name,
    description: page.description,
    step: page.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      ...step,
    })),
  };
}

/** Safe inside a <script> tag: no "</script>" can close it early. */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
