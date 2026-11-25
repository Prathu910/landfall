import { isRoundsFile, type StoredRound } from "../../src/lib/data/rounds-file";
import {
  normalizeOccupationName,
  type ParsedRound,
  type RoundPages,
} from "./rounds";

export type {
  RoundsFile,
  StoredRound,
  StoredRow,
} from "../../src/lib/data/rounds-file";

/**
 * Reviewed source spellings that differ from the dashboard name, keyed by
 * the round page's exact text. Each one appears on the recorded round pages
 * (13 June 2024) and names an occupation in the index (generate-rounds.test).
 * "Patho" is left unmatched: the page's text is truncated, so the occupation
 * it means is not stated.
 */
export const ROUND_NAME_ALIASES: Record<string, string> = {
  "Life Scientist (nec)": "Life Scientists nec",
  "Psychologist (nec)": "Psychologists nec",
};

export type MatchedRounds = {
  file: StoredRound[]; // newest first
  unmatched: string[]; // round names with no dashboard occupation, sorted
  /** Per code, every round newest first; null = not listed in that round. */
  cutoffs: (code: string) => { date: string; cutoff: number | null }[];
};

function codesByName(
  occupations: { code: string; name: string }[],
): Map<string, string[]> {
  const byName = new Map<string, string[]>();
  for (const { code, name } of occupations) {
    const key = normalizeOccupationName(name);
    byName.set(key, [...(byName.get(key) ?? []), code]);
  }
  return byName;
}

function matchName(
  byName: Map<string, string[]>,
  date: string,
  occupationName: string,
): string | null {
  const dashboardName = ROUND_NAME_ALIASES[occupationName] ?? occupationName;
  const codes = byName.get(normalizeOccupationName(dashboardName)) ?? [];
  if (codes.length > 1) {
    throw new Error(
      `Round ${date}: "${occupationName}" matches several occupations (${codes.join(", ")})`,
    );
  }
  return codes[0] ?? null;
}

/**
 * Matches round rows to dashboard occupations by normalised name. A row read
 * back from rounds.json keeps its stored code; a stored row with no match is
 * matched again, so an occupation added later still gets its history.
 */
export function matchRounds(
  rounds: ParsedRound[],
  occupations: { code: string; name: string }[],
): MatchedRounds {
  const byName = codesByName(occupations);
  const unmatched = new Set<string>();
  const newestFirst = [...rounds].sort((a, b) => b.date.localeCompare(a.date));
  const perRound = newestFirst.map((round) => {
    const cutoffByCode = new Map<string, number>();
    const rows = round.rows.map((row) => {
      const { occupationName, cutoff, tieBreak } = row;
      const code = row.code ?? matchName(byName, round.date, occupationName);
      if (code === null) {
        unmatched.add(occupationName);
      } else {
        // A repeated row keeps the lowest score invited, as for split columns.
        const seen = cutoffByCode.get(code);
        cutoffByCode.set(
          code,
          seen === undefined ? cutoff : Math.min(seen, cutoff),
        );
      }
      return { name: occupationName, code, cutoff, tieBreak };
    });
    const stored: StoredRound = {
      date: round.date,
      totals: round.totals,
      tieBreak: round.tieBreak,
      rows,
      nominations: round.nominations,
    };
    return { stored, cutoffByCode };
  });
  return {
    file: perRound.map(({ stored }) => stored),
    unmatched: [...unmatched].sort(),
    cutoffs: (code) =>
      perRound.map(({ stored, cutoffByCode }) => ({
        date: stored.date,
        cutoff: cutoffByCode.get(code) ?? null,
      })),
  };
}

/**
 * Rebuilds parsed rounds from a stored rounds.json (for --generate-only and
 * for keeping stored rounds). Every v2 field comes back, including each row's
 * stored code, so regenerating writes the same file.
 */
export function readRoundsFile(value: unknown): RoundPages {
  if (!isRoundsFile(value)) {
    throw new Error(
      "src/data/rounds.json is missing or not a schemaVersion 2 rounds file; run data:import",
    );
  }
  return {
    rounds: value.rounds.map((round) => ({
      date: round.date,
      totals: round.totals,
      tieBreak: round.tieBreak,
      rows: round.rows.map(({ name, code, cutoff, tieBreak }) => ({
        occupationName: name,
        cutoff,
        tieBreak,
        code,
      })),
      nominations: round.nominations,
    })),
    skipped: value.skipped.map(({ date, reason }) => ({ date, reason })),
  };
}
