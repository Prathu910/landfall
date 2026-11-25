import { pageDescription } from "../occupation-page/meta";
import { breadcrumbLd, collectionPageLd } from "../seo/json-ld";
import { SITE_NAME, SITE_URL } from "../site";
import { dayText, formatLongMonth, longDayText, monthEnd } from "./format";
import { buildHero, buildPassport, type PassportView } from "./hero-view";
import { recapPath } from "./recap-view";
import { roundsNewestFirst } from "./round-view";
import type { RecapFacts } from "./types";

export const UPDATES_INDEX_PATH = "/updates/";
export const UPDATES_INDEX_H1 = "SkillSelect monthly updates";
/** Set as `title.absolute` (R20), so the layout template adds no brand. */
export const UPDATES_INDEX_TITLE = `SkillSelect monthly updates: 189 rounds, 190 and 491 by state | ${SITE_NAME}`;
export const UPDATES_INDEX_INTRO =
  "One page for each SkillSelect data month: the 189 invitation round, the 189 pool by points, and 190 and 491 invitations by state, from published Home Affairs data.";

export type UpdatesIndexView = {
  /** The dated direct answer under the H1 (spec 6.5). */
  answer: string;
  latest: {
    month: string;
    path: string;
    stamp: PassportView["stamp"];
    headline: string;
    figures: { value: string; label: string }[];
  };
  /** Every recap, newest first. */
  months: {
    month: string;
    path: string;
    headline: string;
    /** The newest 189 round in the month, YYYY-MM-DD. */
    roundDate: string | null;
    roundText: string;
  }[];
};

const byMonthNewestFirst = (a: RecapFacts, b: RecapFacts) =>
  a.month < b.month ? 1 : -1;

function answer(latest: RecapFacts): string {
  if (latest.data) {
    return `The latest update covers SkillSelect data as at ${longDayText(monthEnd(latest.month))}.`;
  }
  const round = roundsNewestFirst(latest)[0];
  return `The latest update covers the 189 invitation round on ${longDayText(round.date)}.`;
}

function monthEntry(facts: RecapFacts): UpdatesIndexView["months"][number] {
  const rounds = roundsNewestFirst(facts);
  const round = rounds[0];
  return {
    month: formatLongMonth(facts.month),
    path: recapPath(facts.month),
    headline: buildHero(facts, rounds).h1,
    roundDate: round?.date ?? null,
    roundText: round ? `189 round ${dayText(round.date)}` : "No 189 round",
  };
}

/**
 * The `/updates/` index from every facts file (spec 6.5): the latest month
 * as a card with its passport stamp and first three figures, then every
 * month newest first. Order of `recaps` doesn't matter.
 */
export function buildUpdatesIndex(recaps: RecapFacts[]): UpdatesIndexView {
  const sorted = [...recaps].sort(byMonthNewestFirst);
  const latest = sorted[0];
  if (!latest) throw new Error("No recap facts to index");
  const rounds = roundsNewestFirst(latest);
  const passport = buildPassport(latest, rounds);
  return {
    answer: answer(latest),
    latest: {
      month: formatLongMonth(latest.month),
      path: recapPath(latest.month),
      stamp: passport.stamp,
      headline: buildHero(latest, rounds).h1,
      figures: passport.figures.slice(0, 3),
    },
    months: sorted.map(monthEntry),
  };
}

/** The dated answer and what each page covers, cut at a word boundary. */
export function updatesIndexDescription(view: UpdatesIndexView): string {
  return pageDescription(
    [
      view.answer,
      "Monthly pages on 189 rounds, the 189 pool by points, and 190 and 491 invitations by state.",
    ],
    155,
  );
}

/** CollectionPage with an ItemList of every recap, and the breadcrumb. */
export function updatesIndexJsonLd(view: UpdatesIndexView): object[] {
  return [
    collectionPageLd({
      name: UPDATES_INDEX_H1,
      description: updatesIndexDescription(view),
      url: SITE_URL + UPDATES_INDEX_PATH,
      items: view.months.map((m) => ({
        name: m.headline,
        url: SITE_URL + m.path,
      })),
    }),
    breadcrumbLd([
      { name: "Home", item: `${SITE_URL}/` },
      { name: "Updates", item: SITE_URL + UPDATES_INDEX_PATH },
    ]),
  ];
}
