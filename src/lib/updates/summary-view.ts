/**
 * The plain-English PR summary the founder reads before merging a data update
 * (spec 6.12), as Markdown. Pure: the CLI gathers the inputs. The repository
 * is public, so it holds published data and our drafts only.
 */
import { shiftMonth } from "../data/months";
import type { Manifest, MonthKey } from "../data/types";
import { formatLongMonth } from "../report/copy";
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
import type { DataSection, RecapFacts } from "./types";

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
  /** The national figures of each month whose data section is already on `main`. */
  published: Partial<Record<MonthKey, DataSection["national"]>>;
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

const VISAS = ["189", "190", "491"] as const;

/**
 * A revised month's national figures as its published recap shows them and
 * as this import has them: last month's, the month the importer re-reads.
 * Empty when either side is missing.
 */
function revisedFigureLines(input: SummaryInput, month: MonthKey): string[] {
  const before = input.published[month];
  const after =
    month === shiftMonth(input.month, -1) ? input.facts.data?.national : null;
  if (!before || !after) return [];
  const pair = (was: Interval, now: Interval | null) =>
    `${rangeText(was)} before, ${now ? rangeText(now) : "not published"} after`;
  return VISAS.map(
    (visa) =>
      `  - ${visa}: EOIs submitted ${pair(before[visa].submitted.current, after[visa].submitted.previous)}; invited ${pair(before[visa].invited.current, after[visa].invited.previous)}.`,
  );
}

function revisionLines(input: SummaryInput): string[] {
  return input.report.revisions.flatMap((r) => {
    const month = /data\/raw\/(\d{4}-\d{2})\//.exec(r.path)?.[1];
    const published = month !== undefined && month in input.published;
    const effect = published
      ? `published recap affected: ${month}'s recap sections are frozen and do not change, so decide whether to leave it or correct it by hand`
      : "no published recap affected";
    return [
      `- Revision of \`${r.path}\`: ${formatNumber(r.rowsBefore)} rows before, ${formatNumber(r.rowsAfter)} after; ${effect}.`,
      ...(published ? revisedFigureLines(input, month) : []),
    ];
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
  ];
  return lines.length ? lines : ["Nothing needs a decision."];
}

/** Checks to read, which need no decision on their own. */
function noteLines(input: SummaryInput): string[] {
  return input.kind === "data" && input.coverage
    ? [`- Coverage-window check: ${coverageLine(input.coverage)}`]
    : [];
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
    ...(noteLines(input).length ? section("Notes", noteLines(input)) : []),
    ...section(
      "Images",
      input.sets.flatMap((s) => setLines(s, input)),
    ),
    ...previewLines(input),
    publishLine(input),
    "",
  ].join("\n");
}

/** The branch a data month's own pull request uses (and the monthly job's hold check reads). */
export function monthBranch(month: MonthKey): string {
  return `data/skillselect-${month}`;
}

/**
 * Item 10. Closing a month's own pull request holds that month (controller
 * ruling, Plan 3 Task 6): the monthly job skips it while its branch exists.
 */
export function publishLine(input: SummaryInput): string {
  const publish =
    "**To publish:** merge this pull request. Cloudflare deploys it in a few minutes.";
  const branch = monthBranch(input.month);
  if (input.kind === "data" && input.branch === branch) {
    return `${publish} To hold this update, close it and keep its branch: the monthly job skips ${formatLongMonth(input.month)} while \`${branch}\` exists. Delete that branch and the job imports ${formatLongMonth(input.month)} again.`;
  }
  return `${publish} Closing it does not hold this update: the next scheduled run imports it again.`;
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
  rawBody: string,
  sectionBody: string,
  heading: string,
): string {
  const existingBody = toLf(rawBody);
  const block = `## ${heading}\n\n${sectionBody.trim()}\n`;
  const start = existingBody.indexOf(`## ${heading}\n`);
  if (start === -1) return `${existingBody.trimEnd()}\n\n${block}`;
  const next = existingBody.indexOf("\n## ", start + 1);
  const tail = next === -1 ? "" : `\n${existingBody.slice(next + 1)}`;
  return `${existingBody.slice(0, start)}${block}${tail}`;
}

/** GitHub's web editor saves PR bodies with CRLF line ends. */
function toLf(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** The parts a spotlight swap changes: from each heading to the next listed one (null: the section's end). */
const SWAP_PARTS: [string, string | null][] = [
  ["### Notable movers and spotlight", "### Needs your decision"],
  ["### Images", null],
];

/** Where `line` starts as a whole line of `text`, or -1. */
function lineStart(text: string, line: string): number {
  if (text.startsWith(`${line}\n`)) return 0;
  const at = text.indexOf(`\n${line}\n`);
  return at === -1 ? -1 : at + 1;
}

/** [start, end) of the month's data section: its "## Added …" section, else the body's top. */
function dataSectionRange(body: string, month: MonthKey): [number, number] {
  const suffix = `: SkillSelect data as at ${dayText(monthEnd(month))}`;
  const heading = body
    .split("\n")
    .find((line) => line.startsWith("## Added ") && line.endsWith(suffix));
  const sectionEnd = (from: number) => {
    const next = body.indexOf("\n## ", from);
    return next === -1 ? body.length : next + 1;
  };
  if (heading) {
    const start = lineStart(body, heading) + heading.length + 1;
    return [start, sectionEnd(start)];
  }
  if (body.startsWith(`SkillSelect data as at ${longDayText(monthEnd(month))}`))
    return [0, sectionEnd(0)];
  throw new Error(`The pull request body has no data section for ${month}`);
}

function replacePart(
  section: string,
  summary: string,
  from: string,
  to: string | null,
): string {
  const range = (text: string): [number, number] => {
    const start = lineStart(text, from);
    const end = to === null ? text.length : lineStart(text, to);
    if (start === -1 || end === -1 || end < start)
      throw new Error(`No "${from}" part to replace`);
    return [start, end];
  };
  const [oldStart, oldEnd] = range(section);
  const [newStart, newEnd] = range(summary);
  const old = section.slice(oldStart, oldEnd);
  const trailing = /\s*$/.exec(old)?.[0] ?? "";
  const part = summary.slice(newStart, newEnd).trimEnd() + trailing;
  return section.slice(0, oldStart) + part + section.slice(oldEnd);
}

/**
 * The body after a spotlight swap (spec 6.8): the month's movers and
 * spotlight, images (alt text and caption), preview and publish line come
 * from the regenerated `summary`; everything else, including what the import
 * reported under "Needs your decision", is kept.
 */
export function replaceSwapParts(
  rawBody: string,
  rawSummary: string,
  month: MonthKey,
): string {
  const body = toLf(rawBody);
  const summary = toLf(rawSummary);
  const [start, end] = dataSectionRange(body, month);
  let section = body.slice(start, end);
  for (const [from, to] of SWAP_PARTS)
    section = replacePart(section, summary, from, to);
  return body.slice(0, start) + section + body.slice(end);
}
