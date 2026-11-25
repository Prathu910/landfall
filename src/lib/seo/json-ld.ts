import { SITE_NAME, SITE_URL } from "../site";

/**
 * The site's typed JSON-LD builders: every page's structured data comes from
 * here (docs/ENGINEERING.md, "SEO, AEO and GEO conventions").
 */

export type FaqEntry = { question: string; answer: string };
export type Crumb = { name: string; item: string };

const CONTEXT = "https://schema.org";
/** SkillSelect data is reused under this licence (docs/DATA.md). */
const SKILLSELECT_LICENSE = "https://creativecommons.org/licenses/by/3.0/au/";

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
  datePublished?: string;
  /** An absolute URL. */
  image?: string;
}): object {
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: page.headline,
    description: page.description,
    url: page.url,
    mainEntityOfPage: page.url,
    ...(page.datePublished ? { datePublished: page.datePublished } : {}),
    dateModified: page.dateModified,
    ...(page.image ? { image: page.image } : {}),
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    citation: page.citations,
  };
}

/** Published SkillSelect figures: created by Home Affairs, reused under CC BY 3.0 AU. */
export function datasetLd(page: {
  name: string;
  description: string;
  url: string;
  temporalCoverage: string;
  dateModified: string;
}): object {
  return {
    "@context": CONTEXT,
    "@type": "Dataset",
    name: page.name,
    description: page.description,
    url: page.url,
    temporalCoverage: page.temporalCoverage,
    isAccessibleForFree: true,
    license: SKILLSELECT_LICENSE,
    creator: { "@type": "Organization", name: "Department of Home Affairs" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    dateModified: page.dateModified,
  };
}

/** An index page and the pages it lists, in order. */
export function collectionPageLd(page: {
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
}): object {
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name: page.name,
    description: page.description,
    url: page.url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: page.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        ...item,
      })),
    },
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
