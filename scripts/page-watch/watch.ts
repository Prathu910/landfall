// Decides what the daily page watcher does: compares each cited page with the
// saved baseline and plans the issues to open, comment on or edit (spec
// 6.11). Pure: the CLI fetches, calls `gh` and saves the state.
import {
  LABEL,
  changeBody,
  markersIn,
  plain,
  unreachableBody,
  type UnreachablePage,
} from "./issue-text";
import type { NormalisedPage } from "./normalise";
import type { WatchedSource } from "./sources";
import { notWatched, standingAction } from "./standing";
import { summaryOf } from "./summary";

/** refused: an HTTP 4xx or a sign-in page; error: a 5xx or a network error. */
export type FailureKind = "refused" | "timeout" | "error";
/** Pages the watcher did not request: the run's time budget, or already read today. */
export type WatchResult =
  | { ok: true; page: NormalisedPage }
  | { ok: false; kind: FailureKind | "skipped" | "disallowed"; reason: string };
/**
 * `hash` is "" for a page never read (no baseline yet). `failures` counts
 * failed days in a row: `checkedOn` (the last day it was requested) keeps a
 * second run on one day from counting again.
 */
export type WatchEntry = {
  hash: string;
  text: string;
  firstSeen: string;
  failures: number;
  checkedOn: string;
};
export type WatchState = Record<string, WatchEntry>;
export type OpenWatchIssue = { number: number; title: string; body: string };
export type StandingIssue = { number: number; body: string; state: string };
export type WatchAction =
  | { kind: "create"; title: string; body: string; label: typeof LABEL }
  | { kind: "comment" | "edit"; number: number; body: string };
export type WatchInput = {
  sources: WatchedSource[];
  results: Record<string, WatchResult>;
  state: WatchState | null;
  openIssues: OpenWatchIssue[];
  /** The one "Sources the watcher cannot read" issue, open or closed. */
  standingIssue: StandingIssue | null;
  today: string;
  /** Run notes for the summary (a host robots.txt stopped, time budget reached). */
  notes: string[];
};
export type WatchPlan = {
  state: WatchState;
  actions: WatchAction[];
  summary: string;
};

export type Outcome =
  | {
      kind: "baseline" | "unchanged" | "skipped" | "disallowed";
      reason?: string;
    }
  | { kind: "changed"; previous: WatchEntry; page: NormalisedPage }
  | {
      kind: "failed";
      failure: FailureKind;
      reason: string;
      failures: number;
      newDay: boolean;
      hadBaseline: boolean;
    };
export type PageOutcome = {
  source: WatchedSource;
  entry: WatchEntry;
  outcome: Outcome;
};

/** Consecutive failed days before a "Source unreachable" issue. */
export const UNREACHABLE_AFTER = 3;

export const hostOf = (url: string) => new URL(url).host;
const BLANK: WatchEntry = {
  hash: "",
  text: "",
  firstSeen: "",
  failures: 0,
  checkedOn: "",
};

function failedEntry(
  previous: WatchEntry | undefined,
  failure: FailureKind,
  reason: string,
  today: string,
): { entry: WatchEntry; outcome: Outcome } {
  const newDay = previous?.checkedOn !== today;
  const failures = (previous?.failures ?? 0) + (newDay ? 1 : 0);
  const entry = { ...(previous ?? BLANK), failures, checkedOn: today };
  const hadBaseline = previous !== undefined && previous.hash !== "";
  return {
    entry,
    outcome: { kind: "failed", failure, reason, failures, newDay, hadBaseline },
  };
}

function nextEntry(
  previous: WatchEntry | undefined,
  result: WatchResult,
  today: string,
): { entry: WatchEntry; outcome: Outcome } {
  if (!result.ok) {
    const { kind, reason } = result;
    if (kind === "skipped" || kind === "disallowed")
      return { entry: previous ?? BLANK, outcome: { kind, reason } };
    return failedEntry(previous, kind, reason, today);
  }
  const { page } = result;
  if (previous && previous.hash === page.hash)
    return {
      entry: { ...previous, failures: 0, checkedOn: today },
      outcome: { kind: "unchanged" },
    };
  const entry = {
    hash: page.hash,
    text: page.text,
    firstSeen: today,
    failures: 0,
    checkedOn: today,
  };
  if (!previous || previous.hash === "")
    return { entry, outcome: { kind: "baseline" } };
  return { entry, outcome: { kind: "changed", previous, page } };
}

const issueFor = (issues: OpenWatchIssue[], url: string) =>
  issues.find((issue) => markersIn(issue.body, "watch-url").has(url));

function changeAction(
  input: WatchInput,
  source: WatchedSource,
  previous: WatchEntry,
  page: NormalisedPage,
): WatchAction {
  const body = changeBody(
    source,
    previous.text,
    previous.firstSeen,
    page,
    input.today,
  );
  const open = issueFor(input.openIssues, source.url);
  if (open) {
    const lead = open.title.startsWith("Source unreachable")
      ? `Readable again, with changed text (seen ${input.today}).`
      : `Changed again (seen ${input.today}).`;
    return { kind: "comment", number: open.number, body: `${lead}\n\n${body}` };
  }
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
  pages: UnreachablePage[],
): WatchAction[] {
  const actions: WatchAction[] = [];
  const newByHost = new Map<string, UnreachablePage[]>();
  const byIssue = new Map<number, UnreachablePage[]>();
  for (const page of pages) {
    const open = issueFor(input.openIssues, page.source.url);
    if (open)
      byIssue.set(open.number, [...(byIssue.get(open.number) ?? []), page]);
    else {
      const host = hostOf(page.source.url);
      newByHost.set(host, [...(newByHost.get(host) ?? []), page]);
    }
  }
  for (const [number, entries] of byIssue)
    actions.push({
      kind: "comment",
      number,
      body: `Unreachable (seen ${input.today}).\n\n${unreachableBody(entries, UNREACHABLE_AFTER)}`,
    });
  for (const [host, entries] of newByHost)
    actions.push({
      kind: "create",
      title: `Source unreachable: ${host}`,
      body: unreachableBody(entries, UNREACHABLE_AFTER),
      label: LABEL,
    });
  return actions;
}

export function planWatch(input: WatchInput): WatchPlan {
  const state: WatchState = {};
  const pages: PageOutcome[] = [];
  const actions: WatchAction[] = [];
  const unreachable: UnreachablePage[] = [];
  for (const source of input.sources) {
    const result = input.results[source.url] ?? {
      ok: false,
      kind: "skipped",
      reason: "not requested",
    };
    const { entry, outcome } = nextEntry(
      input.state?.[source.url],
      result,
      input.today,
    );
    state[source.url] = entry;
    pages.push({ source, entry, outcome });
    if (outcome.kind === "changed")
      actions.push(changeAction(input, source, outcome.previous, outcome.page));
    if (
      outcome.kind === "failed" &&
      outcome.newDay &&
      outcome.hadBaseline &&
      outcome.failures === UNREACHABLE_AFTER
    )
      unreachable.push({
        source,
        reason: outcome.reason,
        lastReadSeen: entry.firstSeen,
      });
  }
  const unwatched = notWatched(input, pages);
  actions.push(
    ...unreachableActions(input, unreachable),
    ...standingAction(input, unwatched),
  );
  return {
    state,
    actions,
    summary: summaryOf(input, pages, unwatched, actions),
  };
}
