/** The four Lighthouse categories the founder's goal covers (24 Nov 2026). */
export const CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type FormFactor = "mobile" | "desktop";
export type Scheme = "light" | "dark";

/** One Lighthouse run, reduced to what the table shows. Scores are 0–100. */
export interface RunResult {
  scores: Partial<Record<Category, number>>;
  lcpMs?: number;
  tbtMs?: number;
  cls?: number;
}

/** A row of the table: one page in one form factor and colour scheme. */
export interface Cell {
  page: string;
  formFactor: FormFactor;
  scheme: Scheme;
  /** Only these categories must be 100; the rest are shown for context. */
  gated: readonly Category[];
  runs: RunResult[];
}

export interface CellSummary {
  page: string;
  formFactor: FormFactor;
  scheme: Scheme;
  scores: Partial<Record<Category, number>>;
  lcpMs?: number;
  tbtMs?: number;
  cls?: number;
  failures: Category[];
}

/** The middle value; for an even count, the lower of the two middle values. */
export function median(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

function present(values: readonly (number | undefined)[]): number[] {
  return values.filter((value): value is number => value !== undefined);
}

/** Medians each score and metric separately across a cell's runs. */
export function summariseCell(cell: Cell): CellSummary {
  const scores: Partial<Record<Category, number>> = {};
  for (const category of CATEGORIES) {
    const value = median(present(cell.runs.map((run) => run.scores[category])));
    if (value !== undefined) scores[category] = value;
  }
  const failures = cell.gated.filter(
    (category) => scores[category] === undefined || scores[category] < 100,
  );
  return {
    page: cell.page,
    formFactor: cell.formFactor,
    scheme: cell.scheme,
    scores,
    lcpMs: median(present(cell.runs.map((run) => run.lcpMs))),
    tbtMs: median(present(cell.runs.map((run) => run.tbtMs))),
    cls: median(present(cell.runs.map((run) => run.cls))),
    failures,
  };
}

const SHORT: Record<Category, string> = {
  performance: "Perf",
  accessibility: "A11y",
  "best-practices": "BP",
  seo: "SEO",
};

function scoreText(summary: CellSummary, category: Category): string {
  const value = summary.scores[category];
  if (value === undefined) return "–";
  const flag = summary.failures.includes(category) ? "!" : "";
  return `${value}${flag}`;
}

function msText(value: number | undefined): string {
  if (value === undefined) return "–";
  return value >= 1000
    ? `${(value / 1000).toFixed(1)} s`
    : `${Math.round(value)} ms`;
}

/** A plain-text table; a score that must be 100 and isn't ends in "!". */
export function formatTable(summaries: readonly CellSummary[]): string {
  const header = [
    "Page",
    "Form",
    "Scheme",
    ...CATEGORIES.map((category) => SHORT[category]),
    "LCP",
    "TBT",
    "CLS",
  ];
  const rows = summaries.map((summary) => [
    summary.page,
    summary.formFactor,
    summary.scheme,
    ...CATEGORIES.map((category) => scoreText(summary, category)),
    msText(summary.lcpMs),
    msText(summary.tbtMs),
    summary.cls === undefined ? "–" : summary.cls.toFixed(3),
  ]);
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => row[column].length)),
  );
  const line = (cells: string[]) =>
    cells.map((cell, column) => cell.padEnd(widths[column])).join("  ");
  return [line(header), ...rows.map(line)].join("\n");
}
