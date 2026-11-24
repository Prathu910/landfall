import { shiftMonth } from "../data/months";
import type { CountText, MonthKey } from "../data/types";
import {
  countText,
  dayText,
  formatNumber,
  intervalText,
  monthEnd,
} from "./format";
import {
  occupationsText,
  previousCell,
  type CutoffCell,
  type LinkOccupation,
  type MoveList,
  type OccLink,
  type RoundView,
} from "./round-view";
import type { DataSection, PoolMove, RecapFacts } from "./types";

/** The [D] parts of a recap: rendered only once the month's data section exists. */

export type PoolView = {
  heading: string;
  bars: {
    score: string;
    label: string;
    /** The published floor and the hidden remainder, as shares of the tallest bar. */
    minShare: number;
    maxShare: number;
    passMark: boolean;
  }[];
  key: { published: string; hidden: string };
  caption: string;
};

export type NotableView = {
  heading: string;
  columns: {
    occupation: string;
    cutoff: string;
    previous: string;
    tieBreak: string;
    pool: string;
    invited: string;
  };
  rows: {
    occupation: OccLink;
    cutoff: string;
    previous: CutoffCell;
    tieBreak: string;
    pool: string;
    invited: string;
  }[];
  caption: string;
};

export type NotListedView = {
  heading: string;
  items: {
    occupation: OccLink;
    pool: string;
    poolLabel: string;
    note: string;
  }[];
  caption: string;
};

export type MoversView = {
  lead: string;
  /** The newest round's cut-off moves, shown beside the pool moves (spec 6.4 item 6). */
  cutoffs: RoundView["moves"];
  pool: { fell: MoveList; rose: MoveList } | null;
};

const PASS_MARK = 65;

/** Scores with a published floor, plus one hidden-only score either side. */
export function buildPoolView(data: DataSection, month: MonthKey): PoolView {
  const scores = data.pool189ByScore;
  const first = scores.findIndex((s) => s.count.min > 0);
  const last = scores.findLastIndex((s) => s.count.min > 0);
  const shown =
    first === -1 ? scores : scores.slice(Math.max(0, first - 1), last + 2);
  const tallest = Math.max(1, ...shown.map((s) => s.count.max));
  return {
    heading: `The 189 pool by points, ${dayText(monthEnd(month))}`,
    bars: shown.map(({ score, count }) => ({
      score: String(score),
      label: intervalText(count),
      minShare: count.min / tallest,
      maxShare: count.max / tallest,
      passMark: score === PASS_MARK,
    })),
    key: {
      published: "published counts",
      hidden: "plus hidden counts (under 20 each)",
    },
    caption:
      "EOIs waiting in the pool (status SUBMITTED), all occupations. One person can hold several EOIs. Counts under 20 per occupation are hidden, so each score is a range.",
  };
}

function invitedText(invited: CountText | null): string {
  if (invited === null) return "—";
  if (invited === "<20") return countText(invited);
  if (invited === "0") return "none recorded";
  return `at least ${countText(invited)}`;
}

/**
 * A null previous cut-off means "not listed" only when a previous round is
 * known: the round's own section says so, or another row has a cut-off.
 */
function previousRoundKnown(facts: RecapFacts, round: string): string | null {
  const notable = facts.data?.notable189;
  const own = facts.rounds[round]?.previousRound;
  if (own) return `${dayText(own.date)} round`;
  if (notable?.rows.some((r) => r.previousCutoff !== null)) {
    return "Previous round";
  }
  return null;
}

export function buildNotableView(
  facts: RecapFacts,
  link: LinkOccupation,
): NotableView | null {
  const notable = facts.data?.notable189;
  if (!notable || notable.rows.length === 0) return null;
  const known = previousRoundKnown(facts, notable.round);
  const end = dayText(monthEnd(facts.month));
  const round = dayText(notable.round);
  return {
    heading: "Listed occupations with the largest 189 pools",
    columns: {
      occupation: "Occupation",
      cutoff: `Lowest score invited, ${round}`,
      previous: known ?? "Previous round",
      tieBreak: "Tie-break date",
      pool: `189 pool, ${end}`,
      invited: `Holding a 189 invitation, ${end}`,
    },
    rows: notable.rows.map((row) => ({
      occupation: link(row),
      cutoff: String(row.cutoff),
      previous: known
        ? previousCell(row.cutoff, row.previousCutoff)
        : { value: "—", change: null },
      tieBreak: row.tieBreak ? dayText(row.tieBreak) : "—",
      pool: countText(row.pool),
      invited: invitedText(row.invited),
    })),
    caption: `The ${occupationsText(notable.rows.length)} listed in the ${round} round with the largest 189 pools. Tie-break date: at the lowest score, EOIs that reached it on or before this date were invited. Invitation counts are a minimum: EOIs that had already lodged a visa application by ${end} are no longer counted as invited.`,
  };
}

function notListedNote(row: DataSection["largePoolsNotListed"][number]) {
  const { roundsNotListed: count, lastListed } = row;
  if (!lastListed) {
    return `Not listed in any of the ${formatNumber(count)} rounds in our data`;
  }
  const span =
    count === 1 ? "the latest round" : `the last ${formatNumber(count)} rounds`;
  return `Not listed in ${span}; last listed ${dayText(lastListed.date)} at ${lastListed.cutoff} points`;
}

export function buildNotListedView(
  facts: RecapFacts,
  link: LinkOccupation,
): NotListedView | null {
  const data = facts.data;
  if (!data || data.largePoolsNotListed.length === 0) return null;
  const round = data.notable189?.round;
  const rows = data.largePoolsNotListed;
  const which = rows.length === 1 ? "It is" : `All ${rows.length} are`;
  return {
    heading: round
      ? `Large 189 pools the ${dayText(round)} round did not list`
      : "Large 189 pools the latest round did not list",
    items: rows.map((row) => ({
      occupation: link(row),
      pool: formatNumber(row.pool),
      poolLabel: "EOIs in pool",
      note: notListedNote(row),
    })),
    caption: `${which} on the Home Affairs 189 occupation list (checked ${dayText(data.sources.federalListCheckedAt)}). Not listed means the round's table didn't include them; it isn't a zero cut-off.`,
  };
}

function poolMoves(
  moves: PoolMove[],
  heading: string,
  caption: string,
  link: LinkOccupation,
): MoveList {
  return {
    heading,
    items: moves.map((m) => ({
      occupation: link(m),
      text: `${formatNumber(m.previous)} → ${formatNumber(m.current)}`,
    })),
    caption,
  };
}

export function buildMoversView(
  data: DataSection,
  month: MonthKey,
  newest: RoundView | null,
  link: LinkOccupation,
): MoversView | null {
  const { fell, rose } = data.movers;
  const pool =
    fell.length + rose.length === 0
      ? null
      : {
          fell: poolMoves(
            fell,
            "189 pool fell most",
            "EOIs leave the pool when invited, closed or expired; the data doesn't say which for each EOI.",
            link,
          ),
          rose: poolMoves(
            rose,
            "189 pool rose most",
            "Exact counts at both dates; the data doesn't say why a pool changed.",
            link,
          ),
        };
  const cutoffs = newest?.moves ?? null;
  if (!pool && !cutoffs) return null;
  const previousEnd = dayText(monthEnd(shiftMonth(month, -1)));
  const lead = [
    cutoffs && newest
      ? `Lowest score invited in the ${newest.dateText} round, compared with the round before it.`
      : null,
    pool
      ? `The 189 pools that changed most between ${previousEnd} and ${dayText(monthEnd(month))}, for occupations with exact counts at both dates.`
      : null,
  ];
  return {
    lead: lead.filter((s): s is string => s !== null).join(" "),
    cutoffs,
    pool,
  };
}
