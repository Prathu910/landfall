import { formatMonth } from "../report/copy";
import { wholeSentences } from "../seo/description";
import { articleLd, breadcrumbLd, datasetLd, faqPageLd } from "../seo/json-ld";
import { BRAND_SUFFIX, fitTitle } from "../seo/title";
import { SITE_URL } from "../site";
import { STATE_VISAS } from "./program";
import type { StatePageView } from "./view";

/** The full `<title>` within 60 characters; routes set it as `title.absolute`. */
export function stateTitle(view: StatePageView): string {
  const { searchName } = view.page;
  const month = formatMonth(view.facts.asAt);
  return fitTitle([
    `${searchName} 190 & 491 invitations and points, ${month}${BRAND_SUFFIX}`,
    `${searchName} 190 & 491 invitation data, ${month}${BRAND_SUFFIX}`,
    `${searchName} 190 & 491 invitation data, ${month}`,
  ]);
}

/** The direct answer's whole sentences, topped up with true fixed ones. */
export function stateDescription(view: StatePageView): string {
  return wholeSentences(view.hero.answer, [
    `Month-end SkillSelect data by points and occupation, with ${view.page.searchName}'s ${view.facts.programYear} rules.`,
    "Check your own points free.",
  ]);
}

/**
 * False only when nothing about the state is published: no month of either
 * visa has a count of 20 or more, and neither pool has one either.
 */
export function isStateIndexable(view: StatePageView): boolean {
  return STATE_VISAS.some((visa) => {
    const facts = view.facts.visas[visa];
    const anyMonth = facts.series.months.some(
      (m) => (m.figure?.total.min ?? 0) > 0,
    );
    return anyMonth || (facts.pool?.min ?? 0) > 0;
  });
}

/** The sitemap and Article date: the newest of the data, round page and rules checks. */
export function stateModified(view: StatePageView): string {
  const { manifest, rulesCheckedAt } = view.facts;
  return [
    manifest.checkedAt,
    manifest.roundsCheckedAt ?? manifest.checkedAt,
    rulesCheckedAt,
  ]
    .sort()
    .at(-1) as string;
}

export function stateJsonLd(view: StatePageView): object[] {
  const { facts, page } = view;
  const url = SITE_URL + page.path;
  const firstMonth = facts.visas["190"].series.months[0]?.month ?? facts.asAt;
  const window = `${formatMonth(firstMonth)} to ${formatMonth(facts.asAt)}`;
  const description = stateDescription(view);
  return [
    breadcrumbLd(
      view.hero.crumbs.map((crumb) => ({
        name: crumb.name,
        item: SITE_URL + crumb.href,
      })),
    ),
    faqPageLd(view.faq),
    datasetLd({
      name: `SkillSelect 190 and 491 invitations and EOIs for ${page.fullName}, ${window}`,
      description: `Month-end counts of EOIs holding a 190 or 491 invitation from ${page.fullName} (${page.code}), by occupation and points, and the EOI pool naming ${page.searchName}, from the Department of Home Affairs SkillSelect EOI data, with the Home Affairs state and territory nominations table. Counts under 20 for an occupation and score are hidden and kept as a range from 0 to 19.`,
      url,
      temporalCoverage: `${firstMonth}/${facts.asAt}`,
      dateModified: facts.manifest.checkedAt,
      version: facts.manifest.snapshotId,
      isBasedOn: [
        facts.manifest.sources.dashboard,
        facts.manifest.sources.currentRounds,
      ],
      variableMeasured: [
        "EOIs in INVITED status",
        "EOIs in SUBMITTED status",
        "State and territory nominations",
      ],
      spatialCoverage: page.fullName,
      catalog: { name: "MigrateLens state pages", url: `${SITE_URL}/states/` },
    }),
    articleLd({
      headline: view.hero.h1,
      description,
      url,
      dateModified: stateModified(view),
      citations: [
        facts.manifest.sources.dashboard,
        facts.manifest.sources.currentRounds,
        facts.card.url,
      ],
    }),
  ];
}

/** Indexable states only, each dated by `stateModified`. */
export function stateSitemapEntries(
  views: readonly StatePageView[],
): { url: string; lastModified: string }[] {
  return views.filter(isStateIndexable).map((view) => ({
    url: SITE_URL + view.page.path,
    lastModified: stateModified(view),
  }));
}
