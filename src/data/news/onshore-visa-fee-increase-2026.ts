import type { FeeExample, NewsArticle, NewsSource } from "../../lib/news/types";

/** F2026L01607, new regulation 2.12C(11); applies from 28 November 2026. */
export const ONSHORE_CHARGE = 1500;

export const FEE_SOURCE_URLS = {
  amendment: "https://www.legislation.gov.au/F2026L01607/asmade/text",
  explanation:
    "https://www.legislation.gov.au/F2026L01607/asmade/2026-11-27/es/original/pdf",
  baseFees:
    "https://www.legislation.gov.au/F1996B03551/2026-11-13/2026-11-13/text/original/epub/OEBPS/document_1/document_1.html",
  estimator: "https://immi.homeaffairs.gov.au/visas/visa-pricing-estimator",
} as const;

export const FEE_SOURCES: readonly NewsSource[] = [
  {
    id: "amendment",
    title: "The new onshore charge: F2026L01607",
    detail:
      "Commencement, regulation 2.12C(10)–(11), listed fee categories and transitional rules.",
    url: FEE_SOURCE_URLS.amendment,
    checkedAt: "2026-11-28",
  },
  {
    id: "explanation",
    title: "Government explanatory statement",
    detail:
      "Pages 14–15 explain the visa subclasses, combined applications and exemptions.",
    url: FEE_SOURCE_URLS.explanation,
    checkedAt: "2026-11-28",
  },
  {
    id: "base-fees",
    title: "Existing base charges: Migration Regulations, Schedule 1",
    detail:
      "13 November 2026 compilation, items 1124B (partner), 1222 (student) and 1229 (graduate), read with the new amendment.",
    url: FEE_SOURCE_URLS.baseFees,
    checkedAt: "2026-11-28",
  },
  {
    id: "estimator",
    title: "Home Affairs Visa Pricing Estimator",
    detail:
      "Estimate the charges for your visa, passport, application date and family circumstances.",
    url: FEE_SOURCE_URLS.estimator,
    checkedAt: "2026-11-28",
  },
];

/** Standard main applicants only; each rate retains its scope and provenance. */
export const FEE_EXAMPLES: readonly FeeExample[] = [
  {
    visa: "485",
    name: "Temporary Graduate",
    scope: "Standard first 485 application",
    before: 5750,
    after: 5750 + ONSHORE_CHARGE,
    sourceId: "base-fees",
  },
  {
    visa: "500",
    name: "Student",
    scope: "Standard affected onshore applicant",
    before: 2500,
    after: 2500 + ONSHORE_CHARGE,
    sourceId: "base-fees",
  },
  {
    visa: "820/801",
    name: "Onshore Partner",
    scope: "Standard new combined partner application",
    before: 11710,
    after: 11710 + ONSHORE_CHARGE,
    sourceId: "base-fees",
  },
];

export const VISA_FEE_ARTICLE: NewsArticle = {
  path: "/news/onshore-visa-fee-increase-2026/",
  title: "Australia’s new $1,500 onshore visa charge",
  seoTitle: "Australia visa fees: $1,500 onshore charge (2026)",
  shortTitle: "Onshore visa fee increase, 2026",
  description:
    "From 28 November 2026, specified onshore visa applications cost AUD 1,500 extra per affected applicant. See 485, student and partner fees and exemptions.",
  summary:
    "What the extra AUD 1,500 means for standard graduate, student and partner applications, who is exempt, and how the charge affects families.",
  category: "Visa fees",
  effectiveAt: "2026-11-28",
  publishedAt: "2026-11-28",
  updatedAt: "2026-11-28",
  image: "/news/onshore-visa-fee-increase-2026/og.png",
  imageAlt:
    "Australia’s new AUD 1,500 onshore charge: standard first 485 AUD 7,250, student AUD 4,000 and new onshore partner AUD 13,210, with exemptions.",
  sources: FEE_SOURCES,
};

export const AFFECTED_VISA_GROUPS = [
  {
    title: "Study and graduate",
    visas: "500 Student · 590 Student Guardian · 485 Temporary Graduate",
  },
  {
    title: "Partner and children",
    visas:
      "801 Partner · 445 Dependent Child · 802 Child · 837 Orphan Relative",
  },
  {
    title: "Parents and other family",
    visas:
      "804 Aged Parent · 864 Contributory Aged Parent · 884 Contributory Aged Parent (Temporary) · 835 Remaining Relative · 836 Carer · 838 Aged Dependent Relative",
  },
] as const;

export const FEE_FAQ = [
  {
    question: "When does the new onshore visa charge start?",
    answer:
      "It applies to relevant visa applications made on or after 28 November 2026. Applications made before that date are outside this amendment’s application rule.",
  },
  {
    question: "Does the new $1,500 charge apply to 189, 190 or 491 visas?",
    answer:
      "No. Those visa classes are not listed for this particular charge. Their ordinary visa application charges and other applicable costs still need to be checked.",
  },
  {
    question:
      "Do existing 820 holders all need to pay another $13,210 for an 801?",
    answer:
      "No. The $13,210 example is for a standard new combined onshore partner application. It is not an additional bill for everyone already progressing from an 820 to an 801.",
  },
  {
    question:
      "Is $7,250 the charge for every Temporary Graduate 485 application?",
    answer:
      "No. It is the standard first-application example, including the new charge. Other streams, concessional fee categories and family circumstances can give a different amount.",
  },
] as const;
