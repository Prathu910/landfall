import type { MonthKey } from "../data/types";
import { splitSentences, wholeSentences } from "../seo/description";
import { BRAND_SUFFIX, fitTitle } from "../seo/title";
import { articleLd, breadcrumbLd, datasetLd, faqPageLd } from "../seo/json-ld";
import { SITE_NAME, SITE_URL } from "../site";
import { formatLongMonth, longDayText, monthEnd } from "./format";
import type { RecapView } from "./recap-view";
import type { RecapFacts } from "./types";

/**
 * The full page title. Routes set it as `title.absolute` (R20): the layout's
 * "· MigrateLens" template would repeat the brand.
 */
export function recapTitle(facts: RecapFacts): string {
  const month = formatLongMonth(facts.month);
  const hasRound = Object.keys(facts.rounds).length > 0;
  const topic =
    facts.data === null
      ? "189 round results"
      : hasRound
        ? "189 round, 190 and 491"
        : "190 and 491 by state";
  // At most 60 characters: the brand goes first, then "update".
  return fitTitle([
    `SkillSelect ${month} update: ${topic}${BRAND_SUFFIX}`,
    `SkillSelect ${month}: ${topic}${BRAND_SUFFIX}`,
    `SkillSelect ${month} update: ${topic}`,
  ]);
}

/** The direct answer in whole sentences (or clauses), at most 160 characters. */
export function recapDescription(view: RecapView): string {
  return wholeSentences(splitSentences(view.hero.answer), [
    "Monthly SkillSelect data from Home Affairs, explained.",
    "Source: Home Affairs SkillSelect.",
  ]);
}

/** What a month's Dataset measures. */
const RECAP_VARIABLES = [
  "189 invitations and cut-offs by occupation",
  "189 EOI pool by points score",
  "190 and 491 EOIs submitted and in invited status, by state",
];

const absolute = (path: string): string =>
  path.startsWith("/") ? SITE_URL + path : path;

/**
 * Article (dated by the facts file's first and last generation), Dataset
 * only once the month's data section exists, FAQPage and BreadcrumbList.
 * `ogImage` is a site path or an absolute URL.
 */
export function recapJsonLd(
  facts: RecapFacts,
  view: RecapView,
  ogImage: string,
): object[] {
  const url = absolute(view.path);
  const description = recapDescription(view);
  const month = formatLongMonth(facts.month);
  const article = articleLd({
    headline: view.hero.h1,
    description,
    url,
    datePublished: facts.firstGeneratedAt,
    dateModified: facts.updatedAt,
    image: absolute(ogImage),
    citations: view.method.sources.map((s) => s.href),
  });
  const dataset = facts.data
    ? [
        datasetLd({
          name: `SkillSelect EOI data, ${month}`,
          description: `189, 190 and 491 EOI pools by points, 189 invitation rounds and EOIs in invited status by state, as at ${longDayText(monthEnd(facts.month))}, from published Home Affairs SkillSelect data.`,
          url,
          identifier: facts.data.sources.snapshotId,
          version: facts.data.sources.snapshotId,
          temporalCoverage: facts.month,
          // The page's date: the same day as the Article's dateModified.
          dateModified: facts.updatedAt,
          isBasedOn: view.method.sources.map((s) => s.href),
          variableMeasured: RECAP_VARIABLES,
          catalog: {
            name: `${SITE_NAME} monthly SkillSelect updates`,
            url: `${SITE_URL}/updates/`,
          },
        }),
      ]
    : [];
  return [
    article,
    ...dataset,
    faqPageLd(view.faq),
    breadcrumbLd(
      view.breadcrumb.map((c) => ({ name: c.name, item: absolute(c.href) })),
    ),
  ];
}

/**
 * The recap's OG image: the month's own card, else its newest round's card,
 * else the site image. `publicFiles` holds paths relative to `public/`
 * (no leading slash).
 */
export function ogImageFor(
  month: MonthKey,
  publicFiles: ReadonlySet<string>,
): string {
  const own = `social/${month}/og.png`;
  if (publicFiles.has(own)) return `/${own}`;
  const rounds = [...publicFiles]
    .filter(
      (f) => f.startsWith(`social/${month}/round-`) && f.endsWith("/og.png"),
    )
    .sort();
  const newest = rounds.at(-1);
  return newest ? `/${newest}` : "/og.png";
}
