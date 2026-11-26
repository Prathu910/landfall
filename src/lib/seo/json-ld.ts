import { SITE_NAME, SITE_URL } from "../site";

/**
 * The site's typed JSON-LD builders: every page's structured data comes from
 * here (docs/ENGINEERING.md, "SEO, AEO and GEO conventions").
 */

export type FaqEntry = { question: string; answer: string };
export type Crumb = { name: string; item: string };

const CONTEXT = "https://schema.org";
const LANGUAGE = "en-AU";
/** SkillSelect data is reused under this licence (docs/DATA.md). */
const SKILLSELECT_LICENSE = "https://creativecommons.org/licenses/by/3.0/au/";

/** The site entity's ids: the nodes live on the home page; every page refers to them. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/** The About page: who runs the site, its data, editorial and corrections policy. */
export const PUBLISHING_PRINCIPLES_URL = `${SITE_URL}/about/`;
export const CONTACT_EMAIL = "hello@migratelens.com";
/** The site's own share image, for articles without one of their own. */
export const SITE_IMAGE = `${SITE_URL}/og.png`;
const LOGO = {
  "@type": "ImageObject",
  url: `${SITE_URL}/brand/logo-512.png`,
  width: 512,
  height: 512,
};

/** Who writes and publishes: the organisation, by @id, with its name for readers that don't join nodes. */
const ORGANIZATION_REF = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
};
const PUBLISHER_REF = { ...ORGANIZATION_REF, logo: LOGO };

/** The SkillSelect data's creator. */
const HOME_AFFAIRS = {
  "@type": "GovernmentOrganization",
  name: "Department of Home Affairs",
  url: "https://www.homeaffairs.gov.au/",
};

/**
 * MigrateLens as an organisation (home page only). The description repeats
 * what the site says of itself; no social profiles exist yet, so no sameAs.
 */
export function organizationLd(): object {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: LOGO,
    description:
      "MigrateLens is an independent information site that compares Australian skilled-migration points for the 189, 190 and 491 visas with published SkillSelect data from the Department of Home Affairs. It is not a registered migration agent.",
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ahmedabad",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      url: `${SITE_URL}/contact/`,
      availableLanguage: "English",
    },
    publishingPrinciples: PUBLISHING_PRINCIPLES_URL,
  };
}

/** The site itself (home page only). No SearchAction: search has no URL. */
export function websiteLd(): object {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: "Migrate Lens",
    url: `${SITE_URL}/`,
    inLanguage: LANGUAGE,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type WebPageType =
  "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage";

/** A page that is not an article or a dataset: part of the site, about its subject. */
export function webPageLd(page: {
  type?: WebPageType;
  name: string;
  description: string;
  /** An absolute URL. */
  url: string;
  dateModified?: string;
}): object {
  return {
    "@context": CONTEXT,
    "@type": page.type ?? "WebPage",
    "@id": page.url,
    name: page.name,
    description: page.description,
    url: page.url,
    inLanguage: LANGUAGE,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    // The About page is about the organisation itself.
    ...(page.type === "AboutPage"
      ? { mainEntity: { "@id": ORGANIZATION_ID } }
      : {}),
    ...(page.dateModified ? { dateModified: page.dateModified } : {}),
  };
}

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
  /** An absolute URL; the site's share image when the page has none. */
  image?: string;
}): object {
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: page.headline,
    description: page.description,
    url: page.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": page.url },
    ...(page.datePublished ? { datePublished: page.datePublished } : {}),
    dateModified: page.dateModified,
    image: page.image ?? SITE_IMAGE,
    inLanguage: LANGUAGE,
    isAccessibleForFree: true,
    isPartOf: { "@id": WEBSITE_ID },
    author: ORGANIZATION_REF,
    publisher: PUBLISHER_REF,
    citation: page.citations,
  };
}

export type DatasetInput = {
  name: string;
  /** The full summary (Google allows 50 to 5,000 characters), not a cut snippet. */
  description: string;
  url: string;
  temporalCoverage: string;
  dateModified: string;
  /** The snapshot id, e.g. "skillselect-2026-10-31". */
  version: string;
  /** The published source pages the figures come from. */
  isBasedOn: string[];
  variableMeasured: string[];
  catalog: { name: string; url: string };
  identifier?: string;
  /** Our processed JSON for this dataset, described honestly. */
  distribution?: { contentUrl: string; description: string };
};

/** Published SkillSelect figures: created by Home Affairs, reused under CC BY 3.0 AU. */
export function datasetLd(page: DatasetInput): object {
  return {
    "@context": CONTEXT,
    "@type": "Dataset",
    name: page.name,
    description: page.description,
    url: page.url,
    ...(page.identifier ? { identifier: page.identifier } : {}),
    version: page.version,
    temporalCoverage: page.temporalCoverage,
    spatialCoverage: { "@type": "Place", name: "Australia" },
    variableMeasured: page.variableMeasured,
    isAccessibleForFree: true,
    license: SKILLSELECT_LICENSE,
    isBasedOn: page.isBasedOn,
    creator: HOME_AFFAIRS,
    publisher: PUBLISHER_REF,
    includedInDataCatalog: { "@type": "DataCatalog", ...page.catalog },
    ...(page.distribution
      ? {
          distribution: [
            {
              "@type": "DataDownload",
              encodingFormat: "application/json",
              ...page.distribution,
            },
          ],
        }
      : {}),
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
    "@id": page.url,
    name: page.name,
    description: page.description,
    url: page.url,
    inLanguage: LANGUAGE,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
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

/** A glossary: the set, and each term at its own anchor on the page. */
export function definedTermSetLd(page: {
  name: string;
  description: string;
  /** An absolute URL; each term lives at `${url}#${id}`. */
  url: string;
  dateModified: string;
  terms: { id: string; name: string; description: string }[];
}): object {
  const setId = `${page.url}#terms`;
  return {
    "@context": CONTEXT,
    "@type": "DefinedTermSet",
    "@id": setId,
    name: page.name,
    description: page.description,
    url: page.url,
    inLanguage: LANGUAGE,
    dateModified: page.dateModified,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    hasDefinedTerm: page.terms.map((term) => ({
      "@type": "DefinedTerm",
      "@id": `${page.url}#${term.id}`,
      name: term.name,
      description: term.description,
      url: `${page.url}#${term.id}`,
      inDefinedTermSet: { "@id": setId },
    })),
  };
}

/** Safe inside a <script> tag: no "</script>" can close it early. */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
