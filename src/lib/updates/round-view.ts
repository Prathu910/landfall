import { occupationPath } from "../occupation-page/slug";
import { dayText, formatLongMonth, formatNumber, longDayText } from "./format";
import type { CutoffMove, OccRef, RecapFacts, RoundSection } from "./types";

/** An occupation name, linked to its page when it has one. */
export type OccLink = { name: string; href: string | null };
export type LinkOccupation = (ref: OccRef) => OccLink;

/** A previous cut-off beside this round's: "75" with "−5", or "Not listed". */
export type CutoffCell = {
  value: string;
  change: { direction: "fell" | "rose" | "same"; text: string } | null;
};

export type MoveList = {
  heading: string;
  items: { occupation: OccLink; text: string }[];
  caption: string;
};

export type RoundView = {
  date: string;
  dateText: string;
  heading: string;
  total: string;
  listed: string;
  /** "65–100", or one score when every occupation had the same. */
  cutoffRange: string;
  lead: string;
  distribution: {
    bars: { score: string; occupations: string; share: number }[];
    caption: string;
  };
  newlyListed: { heading: string; items: OccLink[] } | null;
  notListedAgain: { heading: string; items: OccLink[] } | null;
  table: {
    columns: {
      occupation: string;
      cutoff: string;
      /** Null when no earlier round is stored to compare with. */
      previous: string | null;
      tieBreak: string;
    };
    rows: {
      occupation: OccLink;
      cutoff: string;
      previous: CutoffCell | null;
      tieBreak: string;
    }[];
    caption: string;
  };
  /** Cut-off falls and rises against the previous round; null without one. */
  moves: { fell: MoveList; rose: MoveList } | null;
};

const PASS_MARK = 65;

/**
 * Links an occupation to its page. Unmatched round names (code null) stay
 * unlinked; given `pageCodes`, so does any code without a page.
 */
export function occupationLinker(
  pageCodes?: ReadonlySet<string>,
): LinkOccupation {
  return ({ code, name }) => ({
    name,
    href:
      code !== null && (!pageCodes || pageCodes.has(code))
        ? occupationPath({ code, name })
        : null,
  });
}

/** The month's rounds, newest first. */
export function roundsNewestFirst(
  facts: RecapFacts,
): { date: string; section: RoundSection }[] {
  return Object.entries(facts.rounds)
    .map(([date, section]) => ({ date, section }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * The newest round before a month without one: the data section's notable
 * table is built from it (spec 6.3). Null when the month had a round or no
 * round is known.
 */
export function lastRoundBefore(facts: RecapFacts): string | null {
  if (Object.keys(facts.rounds).length > 0) return null;
  return facts.data?.notable189?.round ?? null;
}

/** "No 189 round in December 2026; the last was on 15 Oct 2026". */
export function noRoundText(facts: RecapFacts): string {
  const text = `No 189 round in ${formatLongMonth(facts.month)}`;
  const last = lastRoundBefore(facts);
  return last ? `${text}; the last was on ${dayText(last)}` : text;
}

/** The round's 189 total from the Home Affairs totals table (never missing, R4). */
export function round189Total(section: RoundSection): number {
  const row = section.totals.find((t) => t.subclass === "189");
  if (!row) throw new Error("Round totals missing the 189 row");
  return row.invited;
}

export function occupationsText(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? "occupation" : "occupations"}`;
}

/** The lowest and highest cut-off listed in the round. */
export function cutoffBounds(section: RoundSection): {
  lowest: { score: number; occupations: number };
  highest: number;
} {
  const { distribution } = section;
  return {
    lowest: distribution[0],
    highest: distribution[distribution.length - 1].score,
  };
}

/** "65–100", or one score when every occupation had the same. */
export function cutoffRangeText(section: RoundSection): string {
  const { lowest, highest } = cutoffBounds(section);
  return lowest.score === highest
    ? String(highest)
    : `${lowest.score}–${highest}`;
}

function spreadSentence(section: RoundSection): string {
  const { lowest, highest } = cutoffBounds(section);
  const listed = section.occupations.length;
  if (lowest.score === highest) {
    if (listed === 1) return `Its lowest score invited was ${highest}.`;
    const all = listed === 2 ? "both" : `all ${formatNumber(listed)}`;
    return `For ${all} of them the lowest score invited was ${highest}.`;
  }
  const pass = lowest.score === PASS_MARK ? ", the pass mark" : "";
  return `For ${formatNumber(lowest.occupations)} of them the lowest score invited was ${lowest.score}${pass}; the highest was ${highest}.`;
}

function roundLead(date: string, section: RoundSection): string {
  const total = formatNumber(round189Total(section));
  return [
    `Home Affairs invited ${total} EOIs for the 189 visa on ${longDayText(date)}.`,
    section.previousRound
      ? `The previous 189 round was on ${longDayText(section.previousRound.date)}.`
      : null,
    `The round listed ${occupationsText(section.occupations.length)}.`,
    spreadSentence(section),
    "At the lowest score, EOIs were invited only if they reached it on or before the tie-break date.",
  ]
    .filter((s): s is string => s !== null)
    .join(" ");
}

/** The previous round's cut-off beside this one; null means the round didn't list it. */
export function previousCell(
  current: number,
  previous: number | null,
): CutoffCell {
  if (previous === null) return { value: "Not listed", change: null };
  const value = String(previous);
  if (current < previous) {
    return {
      value,
      change: { direction: "fell", text: `−${previous - current}` },
    };
  }
  if (current > previous) {
    return {
      value,
      change: { direction: "rose", text: `+${current - previous}` },
    };
  }
  return { value, change: { direction: "same", text: "same" } };
}

function moveList(
  heading: string,
  moves: CutoffMove[],
  caption: string,
  link: LinkOccupation,
): MoveList {
  return {
    heading,
    items: moves.map((m) => ({
      occupation: link(m),
      text: `${m.previous} → ${m.current}`,
    })),
    caption,
  };
}

function cutoffMoves(
  comparison: NonNullable<RoundSection["comparison"]>,
  link: LinkOccupation,
): RoundView["moves"] {
  const { fell, rose, same } = comparison;
  const counted = (n: number) =>
    n === 0 ? "No occupation" : occupationsText(n);
  const unchanged =
    same === 0
      ? "none was unchanged"
      : `${formatNumber(same)} ${same === 1 ? "was" : "were"} unchanged`;
  return {
    fell: moveList(
      "Lowest score invited fell",
      comparison.falls,
      `${counted(fell)} fell, ${unchanged}.`,
      link,
    ),
    rose: moveList(
      "Lowest score invited rose",
      comparison.rises,
      `${counted(rose)} rose.`,
      link,
    ),
  };
}

function listedLists(
  section: RoundSection,
  link: LinkOccupation,
): Pick<RoundView, "newlyListed" | "notListedAgain"> {
  const { comparison, previousRound } = section;
  if (!comparison || !previousRound) {
    return { newlyListed: null, notListedAgain: null };
  }
  const before = dayText(previousRound.date);
  const list = (heading: string, refs: OccRef[]) =>
    refs.length === 0
      ? null
      : { heading: `${heading} (${refs.length})`, items: refs.map(link) };
  return {
    newlyListed: list(
      `Listed this round, not on ${before}`,
      comparison.newlyListed,
    ),
    notListedAgain: list(
      `Listed on ${before}, not this round`,
      comparison.notListedAgain,
    ),
  };
}

/** One 189 round's part of a recap, from its round section alone. */
export function buildRoundView(
  date: string,
  section: RoundSection,
  link: LinkOccupation,
): RoundView {
  const { lowest, highest } = cutoffBounds(section);
  const tallest = Math.max(...section.distribution.map((d) => d.occupations));
  const listed = section.occupations.length;
  const previousRound = section.previousRound;
  return {
    date,
    dateText: dayText(date),
    heading: `The ${longDayText(date)} round`,
    total: formatNumber(round189Total(section)),
    listed: formatNumber(listed),
    cutoffRange:
      lowest.score === highest ? String(highest) : `${lowest.score}–${highest}`,
    lead: roundLead(date, section),
    distribution: {
      bars: section.distribution.map((d) => ({
        score: String(d.score),
        occupations: formatNumber(d.occupations),
        share: d.occupations / tallest,
      })),
      caption: `Points along the bottom; the number above each bar is how many of the ${occupationsText(listed)} had that as their lowest score invited.`,
    },
    ...listedLists(section, link),
    table: {
      columns: {
        occupation: "Occupation",
        cutoff: `Lowest score invited, ${dayText(date)}`,
        previous: previousRound ? `${dayText(previousRound.date)} round` : null,
        tieBreak: "Tie-break date",
      },
      rows: section.occupations.map((o) => ({
        occupation: link(o),
        cutoff: String(o.cutoff),
        previous: previousRound
          ? previousCell(o.cutoff, o.previousCutoff)
          : null,
        tieBreak: o.tieBreak ? dayText(o.tieBreak) : "—",
      })),
      caption:
        "Every occupation the round listed. Tie-break date: at the lowest score, EOIs that reached it on or before this date were invited. Home Affairs publishes the round's total, not how many EOIs each occupation got.",
    },
    moves: section.comparison ? cutoffMoves(section.comparison, link) : null,
  };
}
