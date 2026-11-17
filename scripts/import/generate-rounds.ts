import {
  normalizeOccupationName,
  type ParsedRound,
  type RoundPages,
  type SkippedRound,
} from "./rounds";

export type MatchedRound = {
  date: string;
  rows: { name: string; code: string | null; cutoff: number }[];
};

/** src/data/rounds.json: parsed rounds newest first, plus rounds the parser skipped. */
export type RoundsFile = { rounds: MatchedRound[]; skipped: SkippedRound[] };

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
  file: MatchedRound[]; // newest first
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

/** Matches round rows to dashboard occupations by normalised name. */
export function matchRounds(
  rounds: ParsedRound[],
  occupations: { code: string; name: string }[],
): MatchedRounds {
  const byName = codesByName(occupations);
  const unmatched = new Set<string>();
  const newestFirst = [...rounds].sort((a, b) => b.date.localeCompare(a.date));
  const perRound = newestFirst.map((round) => {
    const cutoffByCode = new Map<string, number>();
    const rows = round.rows.map(({ occupationName, cutoff }) => {
      const dashboardName =
        ROUND_NAME_ALIASES[occupationName] ?? occupationName;
      const codes = byName.get(normalizeOccupationName(dashboardName)) ?? [];
      if (codes.length > 1) {
        throw new Error(
          `Round ${round.date}: "${occupationName}" matches several occupations (${codes.join(", ")})`,
        );
      }
      const code = codes[0] ?? null;
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
      return { name: occupationName, code, cutoff };
    });
    return { date: round.date, rows, cutoffByCode };
  });
  return {
    file: perRound.map(({ date, rows }) => ({ date, rows })),
    unmatched: [...unmatched].sort(),
    cutoffs: (code) =>
      perRound.map(({ date, cutoffByCode }) => ({
        date,
        cutoff: cutoffByCode.get(code) ?? null,
      })),
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoredRow(row: unknown): boolean {
  return (
    isObject(row) &&
    typeof row.name === "string" &&
    row.name !== "" &&
    (row.code === null || typeof row.code === "string") &&
    typeof row.cutoff === "number" &&
    Number.isInteger(row.cutoff)
  );
}

function isRoundsFile(value: unknown): value is RoundsFile {
  return (
    isObject(value) &&
    Array.isArray(value.rounds) &&
    value.rounds.every(
      (round) =>
        isObject(round) &&
        typeof round.date === "string" &&
        DATE_RE.test(round.date) &&
        Array.isArray(round.rows) &&
        round.rows.every(isStoredRow),
    ) &&
    Array.isArray(value.skipped) &&
    value.skipped.every(
      (skip) =>
        isObject(skip) &&
        typeof skip.date === "string" &&
        DATE_RE.test(skip.date) &&
        typeof skip.reason === "string" &&
        skip.reason !== "",
    )
  );
}

/** Rebuilds parsed rounds from a stored rounds.json (for --generate-only). */
export function readRoundsFile(value: unknown): RoundPages {
  if (!isRoundsFile(value)) {
    throw new Error(
      "src/data/rounds.json is missing or not a { rounds, skipped } file; run data:import",
    );
  }
  return {
    rounds: value.rounds.map((round) => ({
      date: round.date,
      rows: round.rows.map(({ name, cutoff }) => ({
        occupationName: name,
        cutoff,
      })),
    })),
    skipped: value.skipped.map(({ date, reason }) => ({ date, reason })),
  };
}
