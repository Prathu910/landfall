// The page watcher's run summary (stdout and $GITHUB_STEP_SUMMARY). Public,
// like the logs: URLs, our own failure reasons and counts, no page text.
import { FOUNDER } from "../automation/failure-issue";
import { plain, type NotWatchedPage } from "./issue-text";
import type { Outcome, PageOutcome, WatchAction, WatchInput } from "./watch";

function section(heading: string, items: string[]): string[] {
  return items.length === 0
    ? []
    : ["", `### ${heading}`, "", ...items.map((item) => `- ${item}`)];
}

const days = (count: number) => (count === 1 ? "1 check" : `${count} checks`);

export function summaryOf(
  input: WatchInput,
  pages: PageOutcome[],
  unwatched: NotWatchedPage[],
  actions: WatchAction[],
): string {
  const of = (kind: Outcome["kind"]) =>
    pages.filter((page) => page.outcome.kind === kind);
  const unwatchedUrls = new Set(unwatched.map((page) => page.source.url));
  const others = (kind: Outcome["kind"]) =>
    of(kind).filter((page) => !unwatchedUrls.has(page.source.url));
  const empty = pages.filter(({ source }) => {
    const result = input.results[source.url];
    return result?.ok && result.page.text === "";
  });
  const count = (kind: WatchAction["kind"]) =>
    actions.filter((action) => action.kind === kind).length;
  return [
    `## Page watch, ${input.today}`,
    "",
    `${pages.length} cited pages: ${of("unchanged").length} unchanged, ${of("changed").length} changed, ${of("failed").length} unreadable, ${of("baseline").length} new baselines, ${of("skipped").length + of("disallowed").length} not requested.`,
    ...(input.state === null
      ? [
          "",
          "No saved baseline (the first run, or the cache was evicted): stored a baseline for every page and opened no change issues.",
        ]
      : []),
    ...section(
      "Changed",
      of("changed").map(({ source }) => source.url),
    ),
    ...section(
      "Unreadable",
      others("failed").map(({ source, outcome }) =>
        outcome.kind === "failed"
          ? `${source.url}: ${plain(outcome.reason, 200)} (${days(outcome.failures)} in a row)`
          : source.url,
      ),
    ),
    ...section(
      "Not watched: refuses automated reads",
      unwatched.map(
        ({ source, reason }) => `${source.url}: ${plain(reason, 200)}`,
      ),
    ),
    ...section(
      "Not requested this run",
      others("skipped").map(
        ({ source, outcome }) =>
          `${source.url}: ${plain(outcome.kind === "skipped" ? (outcome.reason ?? "") : "", 200)}`,
      ),
    ),
    ...section(
      "No readable text (check the normaliser)",
      empty.map(({ source }) => source.url),
    ),
    ...section(
      "Notes",
      input.notes.map((note) => plain(note, 300)),
    ),
    "",
    `Issues: ${count("create")} opened, ${count("comment")} commented on, ${count("edit")} edited; assigned to ${FOUNDER}.`,
  ].join("\n");
}
