/**
 * The plain-English PR summary the founder reads before merging a data update
 * (spec 6.12), as Markdown. Pure: the CLI gathers the inputs. The repository
 * is public, so it holds published data and our drafts only.
 */
import type { Manifest, MonthKey } from "../data/types";
import { occupationPath } from "../occupation-page/slug";
import type { ImportReport } from "./import-report";
import type { SetManifest } from "./set-manifest";
import {
  dayText,
  formatNumber,
  longDayText,
  monthEnd,
  rangeText,
} from "./format";
import {
  moverLines,
  named,
  occupationLines,
  poolLines,
  roundLines,
  roundsInMonth,
  stateLines,
} from "./summary-sections";
import type { Interval } from "../data/types";
import type { RecapFacts } from "./types";

export const PAGE_READ_BUDGET = 250;
const WARN_SHARE = 0.9;
const COVERAGE_CODE = "261313";
const SAMPLE_CODES = [COVERAGE_CODE, "254499"];

/** The 189 all-status sum for Software Engineer, this month and last. */
export type Coverage = { current: Interval; previous: Interval | null };

export type SummaryInput = {
  kind: "data" | "round";
  month: MonthKey;
  round: string | null;
  facts: RecapFacts;
  manifest: Manifest;
  previousManifest: Manifest | null;
  report: ImportReport;
  buildWarnings: string[];
  /** Months whose recap is already on `main`. */
  publishedDataMonths: MonthKey[];
  /** `coverage` for the coverage-window check; null when 261313 has no core. */
  coverage: Coverage | null;
  sets: SetManifest[];
  branch: string;
  /** Where files on the branch are served, e.g. https://github.com/<owner>/<repo>/blob. */
  blobBase: string;
  /** The branch's preview origin, from `previewOrigin`; null leaves it out. */
  previewBase: string | null;
  today: string;
};

/** Cloudflare's branch alias: lower case, dashes, at most 28 characters. */
export function previewOrigin(project: string, branch: string): string {
  const alias = branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28)
    .replace(/-+$/, "");
  return `https://${alias}.${project}.pages.dev`;
}

const section = (heading: string, lines: string[]): string[] => [
  `### ${heading}`,
  "",
  ...lines,
  "",
];

function signed(n: number): string {
  return n === 0 ? "0" : `${n > 0 ? "+" : "−"}${formatNumber(Math.abs(n))}`;
}

function coverageLine(c: Coverage): string {
  const now = `Software Engineer (${COVERAGE_CODE}), 189, all statuses: ${rangeText(c.current)} this month`;
  if (!c.previous) return `${now}; no previous month to compare.`;
  const low = c.current.min - c.previous.max;
  const high = c.current.max - c.previous.min;
  return `${now}, ${rangeText(c.previous)} last month, a difference of ${signed(low)} to ${signed(high)}. The sum rose about 885 a month before the 11/2026 import; docs/DATA.md expects the rise to stop after it.`;
}

function revisionLines(input: SummaryInput): string[] {
  return input.report.revisions.map((r) => {
    const month = /data\/raw\/(\d{4}-\d{2})\//.exec(r.path)?.[1];
    const published = month && input.publishedDataMonths.includes(month);
    const effect = published
      ? `published recap affected: ${month}'s recap sections are frozen and do not change, so decide whether to leave it or correct it by hand`
      : "no published recap affected";
    return `- Revision of \`${r.path}\`: ${formatNumber(r.rowsBefore)} rows before, ${formatNumber(r.rowsAfter)} after; ${effect}.`;
  });
}

function decisionLines(input: SummaryInput): string[] {
  const { report, manifest, previousManifest } = input;
  const seen = new Set(previousManifest?.roundsUnmatched ?? []);
  const unmatched = manifest.roundsUnmatched.filter((n) => !seen.has(n));
  const budget = report.budget ?? PAGE_READ_BUDGET;
  const lines = [
    ...revisionLines(input),
    ...(unmatched.length
      ? [`- New round names with no dashboard match: ${unmatched.join("; ")}.`]
      : []),
    ...(report.pageReads > WARN_SHARE * budget
      ? [
          `- Page reads: ${report.pageReads} of ${budget}, above 90% of the budget.`,
        ]
      : []),
    ...input.buildWarnings.map((w) => `- Build warning: ${w.trim()}`),
    ...(input.kind === "data" && input.coverage
      ? [`- Coverage-window check: ${coverageLine(input.coverage)}`]
      : []),
  ];
  return lines.length ? lines : ["Nothing needs a decision."];
}

/** A Markdown table cell: pipes and brackets would break the table or image. */
const cell = (text: string) => text.replace(/[|[\]]/g, (c) => `\\${c}`);

function imageCell(input: SummaryInput, file: string, alt: string): string {
  return `![${cell(alt)}](${input.blobBase}/${input.branch}/${file}?raw=true)`;
}

function setLines(set: SetManifest, input: SummaryInput): string[] {
  const title =
    set.kind === "round"
      ? `Round set, ${longDayText(set.round ?? set.month)}`
      : `Month set, ${longDayText(monthEnd(set.month))}`;
  const stems = [...new Set(set.images.map((i) => `${i.card}/${i.format}`))];
  const rows = stems.flatMap((stem) => {
    const pick = (theme: string) =>
      set.images.find(
        (i) => `${i.card}/${i.format}` === stem && i.theme === theme,
      );
    const [light, dark] = [pick("light"), pick("dark")];
    return [
      `| ${stem} | ${light ? imageCell(input, light.file, light.alt) : ""} | ${dark ? imageCell(input, dark.file, dark.alt) : ""} |`,
    ];
  });
  return [
    `**${title}**`,
    "",
    "| Card | Light | Dark |",
    "| --- | --- | --- |",
    ...rows,
    "",
    "Draft caption:",
    "",
    "```text",
    set.caption,
    "```",
    "",
  ];
}

function previewLines(input: SummaryInput): string[] {
  const base = input.previewBase;
  if (!base) return [];
  const manifest = input.manifest.occupations;
  const spotlight = input.facts.data?.spotlight.code;
  const codes = [...new Set([spotlight, ...SAMPLE_CODES].filter(Boolean))];
  const samples = codes
    .map((code) => manifest.find((o) => o.code === code && o.hasData))
    .filter((o) => o !== undefined)
    .slice(0, 3)
    .map((o) => `- [${named(o)}](${base}${occupationPath(o)})`);
  return section("Preview", [
    `- [Recap page](${base}/updates/${input.month}/)`,
    ...samples,
  ]);
}

function firstLine(input: SummaryInput): string {
  const checks =
    "Validation passed; `npm run check` and `npm run build` passed.";
  const { manifest } = input;
  if (input.kind === "round" && input.round) {
    const checked =
      input.facts.rounds[input.round]?.sources.checkedAt ?? manifest.checkedAt;
    return `189 round of ${longDayText(input.round)}, checked ${longDayText(checked)}. ${checks}`;
  }
  return `SkillSelect data as at ${longDayText(monthEnd(input.month))} (snapshot ${manifest.snapshotId}), checked ${longDayText(manifest.checkedAt)}. ${checks}`;
}

/** The PR body (or one appended section's body): items 1 to 10 of spec 6.12. */
export function buildSummary(input: SummaryInput): string {
  const { facts, kind } = input;
  const roundDate = input.round;
  const data = facts.data;
  const round = roundDate ? facts.rounds[roundDate] : undefined;
  if (kind === "data" && !data)
    throw new Error(`${input.month} has no data section`);
  if (kind === "round" && !round)
    throw new Error(`No round section for ${roundDate}`);

  const factSections =
    kind === "data" && data
      ? [
          ...section("Pool changes", poolLines(data, input.month)),
          ...section("189 rounds this month", roundsInMonth(facts)),
          ...section("190 and 491 by state", stateLines(data)),
          ...section("Occupations added or removed", occupationLines(data)),
          ...section(
            "Notable movers and spotlight",
            moverLines(data, input.month),
          ),
        ]
      : round && roundDate
        ? section("189 round", roundLines(roundDate, round))
        : [];
  return [
    firstLine(input),
    "",
    ...factSections,
    ...section("Needs your decision", decisionLines(input)),
    ...section(
      "Images",
      input.sets.flatMap((s) => setLines(s, input)),
    ),
    ...previewLines(input),
    "**To publish:** merge this pull request. Cloudflare deploys it in a few minutes. To skip this month, close it.",
    "",
  ].join("\n");
}

/** "Added 12 Dec: 189 round of 10 Dec 2026", or the data-month form. */
export function sectionHeading(input: SummaryInput): string {
  const added = dayText(input.today).replace(/ \d{4}$/, "");
  const what =
    input.kind === "round" && input.round
      ? `189 round of ${dayText(input.round)}`
      : `SkillSelect data as at ${dayText(monthEnd(input.month))}`;
  return `Added ${added}: ${what}`;
}

/**
 * The body with `section` added under its own dated heading. A section with
 * the same heading (a re-run on the same day) is replaced, not repeated.
 */
export function appendSection(
  existingBody: string,
  sectionBody: string,
  heading: string,
): string {
  const block = `## ${heading}\n\n${sectionBody.trim()}\n`;
  const start = existingBody.indexOf(`## ${heading}\n`);
  if (start === -1) return `${existingBody.trimEnd()}\n\n${block}`;
  const next = existingBody.indexOf("\n## ", start + 1);
  const tail = next === -1 ? "" : `\n${existingBody.slice(next + 1)}`;
  return `${existingBody.slice(0, start)}${block}${tail}`;
}
