import type { RoundsFile, StoredRound } from "../data/rounds-file";
import { formatNumber } from "../updates/format";
import { formatDate } from "../migration";
import { breadcrumbLd, datasetLd } from "../seo/json-ld";
import { SITE_NAME, SITE_URL } from "../site";

/**
 * The 189 cut-offs hub (/occupations/189-cut-offs/, audit A-P2-2) and the
 * occupation pages' tie-break dates, read from rounds.json. A null cut-off
 * means the round didn't list the occupation ("Not listed"), never zero.
 */

export type CutoffRow = {
  /** null when no dashboard occupation matched the round's row. */
  code: string | null;
  name: string;
  /** The occupation page, when the occupation has one. */
  path: string | null;
  /** One cut-off per round in `CutoffTable.rounds`, newest first. */
  cutoffs: (number | null)[];
  /** The tie-break date published with the newest listed cut-off, if any. */
  tieBreak: string | null;
};

export type CutoffTable = {
  /** Round dates, newest first. */
  rounds: string[];
  rows: CutoffRow[];
};

export type IndexedOccupation = { code: string; name: string; path: string };

const keyOf = (row: { code: string | null; name: string }) =>
  row.code === null ? `name:${row.name}` : `code:${row.code}`;

/** One row per listed occupation: same-code rows keep the lowest cut-off (as the recap does). */
function listedRows(round: StoredRound) {
  const rows = new Map<string, StoredRound["rows"][number]>();
  for (const row of round.rows) {
    const seen = rows.get(keyOf(row));
    if (!seen || row.cutoff < seen.cutoff) rows.set(keyOf(row), row);
  }
  return rows;
}

/** Every occupation listed in any of the newest `count` rounds, A to Z. */
export function cutoffTable(
  file: RoundsFile,
  pages: IndexedOccupation[],
  count = 4,
): CutoffTable {
  const rounds = file.rounds.slice(0, count);
  const listed = rounds.map(listedRows);
  const byCode = new Map(pages.map((p) => [p.code, p]));
  const keys = new Set(listed.flatMap((m) => [...m.keys()]));
  const rows = [...keys].map((key): CutoffRow => {
    const found = listed.map((m) => m.get(key) ?? null);
    const sample = found.find((r) => r !== null);
    if (!sample) throw new Error(`No round lists ${key}`);
    const page = sample.code ? byCode.get(sample.code) : undefined;
    return {
      code: sample.code,
      name: page?.name ?? sample.name,
      path: page?.path ?? null,
      cutoffs: found.map((r) => (r ? r.cutoff : null)),
      tieBreak: sample.tieBreak,
    };
  });
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return { rounds: rounds.map((r) => r.date), rows };
}

/** The tie-break date the round published for one occupation, or null. */
export function tieBreakFor(
  file: RoundsFile,
  code: string,
  date: string,
): string | null {
  const round = file.rounds.find((r) => r.date === date);
  if (!round) return null;
  const rows = round.rows.filter((r) => r.code === code);
  if (rows.length === 0) return null;
  const lowest = rows.reduce((a, b) => (b.cutoff < a.cutoff ? b : a));
  return lowest.tieBreak;
}

/**
 * The hub's answer-first sentence, from the newest round: its date, the
 * published 189 total (when the round has one), the occupations it listed
 * and its cut-off span.
 */
export function cutoffsAnswer(file: RoundsFile, table: CutoffTable): string {
  const newest = file.rounds[0];
  const cutoffs = table.rows.flatMap((r) =>
    r.cutoffs[0] === null ? [] : [r.cutoffs[0]],
  );
  const total = newest.totals?.find((t) => t.subclass === "189");
  const invited = total
    ? `invited ${formatNumber(total.invited)} EOIs across ${formatNumber(cutoffs.length)} occupations`
    : `listed ${formatNumber(cutoffs.length)} occupations`;
  const lo = Math.min(...cutoffs);
  const hi = Math.max(...cutoffs);
  const span =
    lo === hi
      ? `a cut-off of ${lo} points`
      : `cut-offs from ${lo} to ${hi} points`;
  const count = table.rounds.length === 4 ? "four" : `${table.rounds.length}`;
  return `In the latest 189 round, on ${formatDate(newest.date)}, Home Affairs ${invited}, with ${span}. This table lists each occupation’s cut-off in the last ${count} rounds; “Not listed” means the round didn’t include it, not a cut-off of zero. Source: Home Affairs SkillSelect invitation rounds.`;
}

/** The hub's metadata (its title gets the layout's "· MigrateLens"). */
export const CUTOFFS_PAGE = {
  path: "/occupations/189-cut-offs/",
  title: "189 cut-offs by occupation (last 4 rounds)",
  description:
    "The 189 invitation cut-off for every occupation listed in the last four SkillSelect rounds, with tie-break dates, from the Home Affairs round results.",
  heading: "189 cut-offs by occupation",
  crumb: "189 cut-offs",
} as const;

/** Dataset (the table) and breadcrumbs: MigrateLens › Occupations › 189 cut-offs. */
export function cutoffsJsonLd(
  answer: string,
  table: CutoffTable,
  sources: string[],
): object[] {
  const url = SITE_URL + CUTOFFS_PAGE.path;
  const newest = table.rounds[0];
  const oldest = table.rounds[table.rounds.length - 1];
  return [
    datasetLd({
      name: `189 invitation round cut-offs by occupation, ${formatDate(oldest)} to ${formatDate(newest)}`,
      description: answer,
      url,
      temporalCoverage: `${oldest}/${newest}`,
      dateModified: newest,
      version: `189-rounds-${newest}`,
      isBasedOn: sources,
      variableMeasured: [
        "189 invitation round cut-off (lowest points invited) by occupation",
        "189 tie-break date by occupation",
      ],
      catalog: {
        name: `${SITE_NAME} SkillSelect occupation data`,
        url: `${SITE_URL}/occupations/`,
      },
    }),
    breadcrumbLd([
      { name: SITE_NAME, item: `${SITE_URL}/` },
      { name: "Occupations", item: `${SITE_URL}/occupations/` },
      { name: CUTOFFS_PAGE.crumb, item: url },
    ]),
  ];
}
