// Decides what the daily page watcher does: compares each cited page with the
// saved baseline and plans the issues to open or comment on (spec 6.11). Pure:
// the CLI fetches, calls `gh` and saves the state. The repo is public, so an
// issue holds only public page excerpts, fenced so page text can't break out.
import { FOUNDER, MAX_BODY, fenceFor } from "../automation/failure-issue";
import type { NormalisedPage } from "./normalise";
import type { Citation, WatchedSource } from "./sources";

export type WatchResult =
  { ok: true; page: NormalisedPage } | { ok: false; reason: string };
/** `hash` is "" for a page never read, which has no baseline yet. */
export type WatchEntry = {
  hash: string;
  text: string;
  firstSeen: string;
  failures: number;
};
export type WatchState = Record<string, WatchEntry>;
export type OpenWatchIssue = { number: number; title: string; body: string };
export type WatchAction =
  | { kind: "create"; title: string; body: string; label: typeof LABEL }
  | { kind: "comment"; number: number; body: string };
export type WatchInput = {
  sources: WatchedSource[];
  results: Record<string, WatchResult>;
  state: WatchState | null;
  openIssues: OpenWatchIssue[];
  today: string;
};
export type WatchPlan = {
  state: WatchState;
  actions: WatchAction[];
  summary: string;
};

export const LABEL = "source-watch";
/** Consecutive failed daily checks before a "Source unreachable" issue. */
export const UNREACHABLE_AFTER = 3;
const EXCERPT_LINES = 40;
const MAX_LINE = 300;
const MAX_CITATIONS = 12;
// The line-by-line comparison's table size; longer pages use a set difference.
const MAX_DIFF_CELLS = 4_000_000;

export const watchMarker = (url: string) => `<!-- watch-url: ${url} -->`;
export const hostOf = (url: string) => new URL(url).host;

/** Page text for an issue title or list item: one line, no @mentions, capped. */
function plain(text: string, max: number): string {
  const line = text
    .replace(/[\s\p{Cc}]+/gu, " ")
    .replace(/@/g, "＠")
    .trim();
  return line.length <= max ? line : `${line.slice(0, max - 1)}…`;
}

const clip = (line: string) =>
  line.length <= MAX_LINE ? line : `${line.slice(0, MAX_LINE)}…`;

function lcsOps(before: string[], after: string[]): string[] {
  const width = after.length + 1;
  // common[i * width + j]: the longest common run of before[i..] and after[j..].
  const common = new Uint32Array((before.length + 1) * width);
  for (let i = before.length - 1; i >= 0; i--)
    for (let j = after.length - 1; j >= 0; j--)
      common[i * width + j] =
        before[i] === after[j]
          ? common[(i + 1) * width + j + 1] + 1
          : Math.max(common[(i + 1) * width + j], common[i * width + j + 1]);
  const ops: string[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      i++;
      j++;
    } else if (
      j === after.length ||
      (i < before.length &&
        common[(i + 1) * width + j] >= common[i * width + j + 1])
    ) {
      ops.push(`- ${before[i++]}`);
    } else {
      ops.push(`+ ${after[j++]}`);
    }
  }
  return ops;
}

function setOps(before: string[], after: string[]): string[] {
  const kept = new Set(after);
  const had = new Set(before);
  return [
    ...before.filter((line) => !kept.has(line)).map((line) => `- ${line}`),
    ...after.filter((line) => !had.has(line)).map((line) => `+ ${line}`),
  ];
}

/** The changed lines ("- before", "+ after"), the first `max` of `total`. */
export function diffLines(
  before: string,
  after: string,
  max: number,
): { lines: string[]; total: number } {
  const a = before.split("\n");
  const b = after.split("\n");
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const middleA = a.slice(start, endA);
  const middleB = b.slice(start, endB);
  const ops =
    middleA.length * middleB.length <= MAX_DIFF_CELLS
      ? lcsOps(middleA, middleB)
      : setOps(middleA, middleB);
  return { lines: ops.slice(0, max).map(clip), total: ops.length };
}

function citationLines(citedBy: Citation[], indent: string): string[] {
  const lines = citedBy
    .slice(0, MAX_CITATIONS)
    .map(
      ({ file, item, checkedAt }) =>
        `${indent}- \`${file}\`: ${item} (${checkedAt ? `checked ${checkedAt}` : "no checked date"})`,
    );
  const more = citedBy.length - MAX_CITATIONS;
  return more > 0 ? [...lines, `${indent}- and ${more} more`] : lines;
}

function capped(body: string): string {
  return body.length <= MAX_BODY
    ? body
    : `${body.slice(0, MAX_BODY - 20)}\n\n(truncated)`;
}

function changeBody(
  source: WatchedSource,
  previous: WatchEntry,
  page: NormalisedPage,
  today: string,
): string {
  const diff = diffLines(previous.text, page.text, EXCERPT_LINES);
  const excerpt = diff.lines.join("\n");
  const fence = fenceFor(excerpt);
  return capped(
    [
      watchMarker(source.url),
      "The page watcher saw new text on an official page this site cites. It never edits the site: if a rule or fee changed, update it and its `checkedAt` in a reviewed change, then close this issue.",
      "",
      `- Page: ${source.url}`,
      `- Change first seen: ${today} (the previous text was first seen ${previous.firstSeen})`,
      "- Cited by:",
      ...citationLines(source.citedBy, "  "),
      "",
      `Changed lines (showing ${diff.lines.length} of ${diff.total}; \`-\` before, \`+\` after):`,
      "",
      `${fence}diff`,
      excerpt,
      fence,
    ].join("\n"),
  );
}

function unreachableBody(
  failing: { source: WatchedSource; reason: string }[],
): string {
  return capped(
    [
      ...failing.map(({ source }) => watchMarker(source.url)),
      `The page watcher could not read these official pages on ${UNREACHABLE_AFTER} daily checks in a row. It never works around a block: open each page in a browser, and if it moved or closed, update the source and its \`checkedAt\` in a reviewed change, then close this issue.`,
      "",
      ...failing.flatMap(({ source, reason }) => [
        `- ${source.url}: ${plain(reason, 200)}`,
        ...citationLines(source.citedBy, "  "),
      ]),
    ].join("\n"),
  );
}

const issueFor = (issues: OpenWatchIssue[], url: string) =>
  issues.find((issue) => issue.body.includes(watchMarker(url)));

function changeAction(
  input: WatchInput,
  source: WatchedSource,
  previous: WatchEntry,
  page: NormalisedPage,
): WatchAction {
  const body = changeBody(source, previous, page, input.today);
  const open = issueFor(input.openIssues, source.url);
  if (open)
    return {
      kind: "comment",
      number: open.number,
      body: `Changed again (seen ${input.today}).\n\n${body}`,
    };
  const name = plain(page.title, 100) || hostOf(source.url);
  return {
    kind: "create",
    title: `Source changed: ${name}`,
    body,
    label: LABEL,
  };
}

/** One issue per host for its newly unreachable pages; pages with an open issue get a comment there. */
function unreachableActions(
  input: WatchInput,
  failing: { source: WatchedSource; reason: string }[],
): WatchAction[] {
  const actions: WatchAction[] = [];
  const newByHost = new Map<string, typeof failing>();
  const byIssue = new Map<number, typeof failing>();
  for (const entry of failing) {
    const open = issueFor(input.openIssues, entry.source.url);
    if (open)
      byIssue.set(open.number, [...(byIssue.get(open.number) ?? []), entry]);
    else {
      const host = hostOf(entry.source.url);
      newByHost.set(host, [...(newByHost.get(host) ?? []), entry]);
    }
  }
  for (const [number, entries] of byIssue)
    actions.push({
      kind: "comment",
      number,
      body: `Unreachable (seen ${input.today}).\n\n${unreachableBody(entries)}`,
    });
  for (const [host, entries] of newByHost)
    actions.push({
      kind: "create",
      title: `Source unreachable: ${host}`,
      body: unreachableBody(entries),
      label: LABEL,
    });
  return actions;
}

type Outcome =
  | { kind: "baseline" | "unchanged" }
  | { kind: "changed"; previous: WatchEntry; page: NormalisedPage }
  | { kind: "failed"; reason: string; failures: number };

function nextEntry(
  previous: WatchEntry | undefined,
  result: WatchResult,
  today: string,
): { entry: WatchEntry; outcome: Outcome } {
  if (!result.ok) {
    const failures = (previous?.failures ?? 0) + 1;
    const entry = {
      ...(previous ?? { hash: "", text: "", firstSeen: "" }),
      failures,
    };
    return {
      entry,
      outcome: { kind: "failed", reason: result.reason, failures },
    };
  }
  const { page } = result;
  if (previous && previous.hash === page.hash)
    return {
      entry: { ...previous, failures: 0 },
      outcome: { kind: "unchanged" },
    };
  const entry = {
    hash: page.hash,
    text: page.text,
    firstSeen: today,
    failures: 0,
  };
  if (!previous || previous.hash === "")
    return { entry, outcome: { kind: "baseline" } };
  return { entry, outcome: { kind: "changed", previous, page } };
}

function summaryOf(
  input: WatchInput,
  outcomes: { url: string; outcome: Outcome }[],
  actions: WatchAction[],
): string {
  const of = (kind: Outcome["kind"]) =>
    outcomes.filter((o) => o.outcome.kind === kind);
  const empty = input.sources.filter((s) => {
    const result = input.results[s.url];
    return result?.ok && result.page.text === "";
  });
  const created = actions.filter((a) => a.kind === "create").length;
  return [
    `## Page watch, ${input.today}`,
    "",
    `${outcomes.length} cited pages checked: ${of("unchanged").length} unchanged, ${of("changed").length} changed, ${of("failed").length} unreadable, ${of("baseline").length} new baselines.`,
    ...(input.state === null
      ? [
          "",
          "No saved baseline (the first run, or the cache was evicted): stored a baseline for every page and opened no issues.",
        ]
      : []),
    ...section(
      "Changed",
      of("changed").map((o) => o.url),
    ),
    ...section(
      "Unreadable",
      of("failed").map(({ url, outcome }) =>
        outcome.kind === "failed"
          ? `${url}: ${plain(outcome.reason, 200)} (${outcome.failures === 1 ? "1 check" : `${outcome.failures} checks`} in a row)`
          : url,
      ),
    ),
    ...section(
      "No readable text (check the normaliser)",
      empty.map((s) => s.url),
    ),
    "",
    `Issues: ${created} opened, ${actions.length - created} commented on, assigned to ${FOUNDER}.`,
  ].join("\n");
}

function section(heading: string, items: string[]): string[] {
  return items.length === 0
    ? []
    : ["", `### ${heading}`, "", ...items.map((item) => `- ${item}`)];
}

export function planWatch(input: WatchInput): WatchPlan {
  const state: WatchState = {};
  const outcomes: { url: string; outcome: Outcome }[] = [];
  const actions: WatchAction[] = [];
  const unreachable: { source: WatchedSource; reason: string }[] = [];
  for (const source of input.sources) {
    const result = input.results[source.url] ?? {
      ok: false,
      reason: "not fetched",
    };
    const { entry, outcome } = nextEntry(
      input.state?.[source.url],
      result,
      input.today,
    );
    state[source.url] = entry;
    outcomes.push({ url: source.url, outcome });
    if (outcome.kind === "changed")
      actions.push(changeAction(input, source, outcome.previous, outcome.page));
    if (outcome.kind === "failed" && outcome.failures === UNREACHABLE_AFTER)
      unreachable.push({ source, reason: outcome.reason });
  }
  actions.push(...unreachableActions(input, unreachable));
  return { state, actions, summary: summaryOf(input, outcomes, actions) };
}
