import { normalizeOccupationName, type ParsedRound } from "./rounds";

export type RoundsFile = {
  date: string;
  rows: { name: string; code: string | null; cutoff: number }[];
}[];

export type MatchedRounds = {
  file: RoundsFile; // newest first
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
      const codes = byName.get(normalizeOccupationName(occupationName)) ?? [];
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
