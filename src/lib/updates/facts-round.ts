import type { RoundsFile, StoredRound, StoredRow } from "../data/rounds-file";
import type { CutoffMove, OccRef, RoundSection } from "./types";

const MAX_LISTED_MOVES = 6;

type Entry = { key: string; code: string | null; name: string; row: StoredRow };

/** The next older parsed round before `date`, or null. */
export function previousRound(
  file: RoundsFile,
  date: string,
): StoredRound | null {
  const older = file.rounds.filter((round) => round.date < date);
  if (older.length === 0) return null;
  return older.reduce((a, b) => (a.date >= b.date ? a : b));
}

/** One entry per listed occupation: same-code rows keep the lowest cut-off. */
function listedEntries(
  round: StoredRound,
  names: ReadonlyMap<string, string>,
): Map<string, Entry> {
  const entries = new Map<string, Entry>();
  for (const row of round.rows) {
    const key = row.code === null ? `name:${row.name}` : `code:${row.code}`;
    const seen = entries.get(key);
    if (seen && seen.row.cutoff <= row.cutoff) continue;
    const name = (row.code !== null && names.get(row.code)) || row.name;
    entries.set(key, { key, code: row.code, name, row });
  }
  return entries;
}

const byName = (a: { name: string }, b: { name: string }): number =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0;

const size = (m: CutoffMove): number => Math.abs(m.current - m.previous);
const largestFirst = (a: CutoffMove, b: CutoffMove): number =>
  size(b) - size(a) || byName(a, b);

function pickCards(falls: CutoffMove[], rises: CutoffMove[]): CutoffMove[] {
  if (falls.length > 0 && rises.length > 0) {
    return [...falls.slice(0, 2), ...rises.slice(0, 1)];
  }
  return [...falls, ...rises].sort(largestFirst).slice(0, 3);
}

function buildComparison(
  current: Map<string, Entry>,
  previous: Map<string, Entry>,
): {
  comparison: NonNullable<RoundSection["comparison"]>;
  cardPicks: CutoffMove[];
} {
  let same = 0;
  let fell = 0;
  let rose = 0;
  const falls: CutoffMove[] = [];
  const rises: CutoffMove[] = [];
  const newlyListed: OccRef[] = [];
  for (const entry of current.values()) {
    const before = previous.get(entry.key);
    if (!before) {
      newlyListed.push({ code: entry.code, name: entry.name });
      continue;
    }
    const move = {
      previous: before.row.cutoff,
      current: entry.row.cutoff,
    };
    if (move.current === move.previous) same += 1;
    else if (move.current < move.previous) fell += 1;
    else rose += 1;
    if (move.current === move.previous || entry.code === null) continue;
    (move.current < move.previous ? falls : rises).push({
      code: entry.code,
      name: entry.name,
      ...move,
    });
  }
  const notListedAgain = [...previous.values()]
    .filter((entry) => !current.has(entry.key))
    .map((entry) => ({ code: entry.code, name: entry.name }));
  falls.sort(largestFirst);
  rises.sort(largestFirst);
  return {
    comparison: {
      fell,
      rose,
      same,
      newlyListed: newlyListed.sort(byName),
      notListedAgain: notListedAgain.sort(byName),
      falls: falls.slice(0, MAX_LISTED_MOVES),
      rises: rises.slice(0, MAX_LISTED_MOVES),
    },
    // Card picks come from the full lists, not the six shown.
    cardPicks: pickCards(falls, rises),
  };
}

export function buildRoundSection(input: {
  round: StoredRound;
  previous: StoredRound | null;
  names: ReadonlyMap<string, string>;
  sources: RoundSection["sources"];
  today: string;
}): RoundSection {
  const { round, previous, names, sources, today } = input;
  if (!round.totals || !round.totals.some((t) => t.subclass === "189")) {
    throw new Error(`Round totals missing for ${round.date}`);
  }
  const current = listedEntries(round, names);
  const before = previous ? listedEntries(previous, names) : null;

  const occupations = [...current.values()]
    .map(({ key, code, name, row }) => ({
      code,
      name,
      cutoff: row.cutoff,
      previousCutoff: before?.get(key)?.row.cutoff ?? null,
      tieBreak: row.tieBreak,
    }))
    .sort(byName);

  const counts = new Map<number, number>();
  for (const o of occupations) {
    counts.set(o.cutoff, (counts.get(o.cutoff) ?? 0) + 1);
  }
  const distribution = [...counts]
    .map(([score, n]) => ({ score, occupations: n }))
    .sort((a, b) => a.score - b.score);

  const compared = before ? buildComparison(current, before) : null;

  return {
    generatedAt: today,
    sources,
    totals: round.totals,
    occupations,
    distribution,
    previousRound:
      previous && before ? { date: previous.date, listed: before.size } : null,
    comparison: compared?.comparison ?? null,
    cardPicks: compared?.cardPicks ?? [],
  };
}
