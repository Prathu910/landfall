import type { MonthKey, StateVisa } from "../data/types";
import type { FaqEntry } from "../seo/json-ld";
import { buildCompareView, type CompareView } from "./compare-view";
import {
  buildMoversView,
  buildNotableView,
  buildNotListedView,
  buildPoolView,
  type MoversView,
  type NotableView,
  type NotListedView,
  type PoolView,
} from "./data-view";
import { recapFaq } from "./faq";
import { formatLongMonth } from "./format";
import {
  buildHero,
  buildPassport,
  type HeroView,
  type PassportView,
} from "./hero-view";
import { buildMethodView, type MethodView } from "./method-view";
import {
  buildRoundView,
  lastRoundBefore,
  noRoundText,
  occupationLinker,
  roundsNewestFirst,
  type RoundView,
} from "./round-view";
import { buildStateSection, type StateSectionView } from "./state-view";
import type { RecapFacts } from "./types";

export type RecapKind = "round-only" | "data-only" | "full";

export type RecapView = {
  kind: RecapKind;
  month: MonthKey;
  path: string;
  breadcrumb: { name: string; href: string }[];
  hero: HeroView;
  passport: PassportView;
  /** Newest first. */
  rounds: RoundView[];
  noRound: { text: string; href: string | null } | null;
  pool: PoolView | null;
  notable: NotableView | null;
  notListed: NotListedView | null;
  states: Record<StateVisa, StateSectionView> | null;
  movers: MoversView | null;
  compare: CompareView | null;
  method: MethodView;
  faq: FaqEntry[];
};

export type RecapContext = {
  /** Months with a facts file, for links to other recaps. */
  recapMonths: MonthKey[];
  /**
   * Codes that have an occupation page (index entries with data). Required:
   * a code without a page would link to a 404.
   */
  occupationPages: ReadonlySet<string>;
};

export const recapPath = (month: MonthKey): string => `/updates/${month}/`;

function kindOf(facts: RecapFacts): RecapKind {
  const hasRound = Object.keys(facts.rounds).length > 0;
  if (hasRound) return facts.data ? "full" : "round-only";
  if (facts.data) return "data-only";
  throw new Error(`Facts file for ${facts.month} has no section`);
}

function noRound(facts: RecapFacts, ctx: RecapContext): RecapView["noRound"] {
  if (Object.keys(facts.rounds).length > 0) return null;
  const last = lastRoundBefore(facts);
  const lastMonth = last?.slice(0, 7);
  return {
    text: noRoundText(facts),
    href:
      lastMonth && ctx.recapMonths.includes(lastMonth)
        ? recapPath(lastMonth)
        : null,
  };
}

/** The whole recap page for one month, from its facts file alone (spec 6.4). */
export function buildRecapView(
  facts: RecapFacts,
  ctx: RecapContext,
): RecapView {
  const kind = kindOf(facts);
  const month = formatLongMonth(facts.month);
  const link = occupationLinker(ctx.occupationPages);
  const rounds = roundsNewestFirst(facts);
  const roundViews = rounds.map((r) => buildRoundView(r.date, r.section, link));
  const data = facts.data;
  return {
    kind,
    month: facts.month,
    path: recapPath(facts.month),
    breadcrumb: [
      { name: "Home", href: "/" },
      { name: "Updates", href: "/updates/" },
      { name: month, href: recapPath(facts.month) },
    ],
    hero: buildHero(facts, rounds),
    passport: buildPassport(facts, rounds),
    rounds: roundViews,
    noRound: noRound(facts, ctx),
    pool: data ? buildPoolView(data, facts.month) : null,
    notable: buildNotableView(facts, link),
    notListed: buildNotListedView(facts, link),
    states: data
      ? {
          "190": buildStateSection("190", data, facts.month, link),
          "491": buildStateSection("491", data, facts.month, link),
        }
      : null,
    movers: data
      ? buildMoversView(data, facts.month, roundViews[0] ?? null, link)
      : null,
    compare: data ? buildCompareView(data, facts.month) : null,
    method: buildMethodView(facts, rounds),
    faq: recapFaq(facts),
  };
}
