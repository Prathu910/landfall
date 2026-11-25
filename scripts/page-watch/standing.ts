// The standing "Sources the watcher cannot read" issue (controller ruling,
// Task 8 fix round): one issue for the pages the watcher can never read,
// instead of a new "Source unreachable" issue for them every few days.
import {
  LABEL,
  STANDING_TITLE,
  markersIn,
  standingBody,
  type NotWatchedPage,
} from "./issue-text";
import type { PageOutcome, WatchAction, WatchInput } from "./watch";

/**
 * Pages that refuse automated reads and were never read, or that robots.txt
 * disallows. A page left unrequested today stays listed if it was listed.
 */
export function notWatched(
  input: WatchInput,
  pages: PageOutcome[],
): NotWatchedPage[] {
  const listed = input.standingIssue
    ? markersIn(input.standingIssue.body, "cannot-read")
    : new Set<string>();
  return pages.flatMap(({ source, entry, outcome }) => {
    if (outcome.kind === "disallowed")
      return [{ source, reason: outcome.reason ?? "" }];
    if (
      outcome.kind === "failed" &&
      !outcome.hadBaseline &&
      outcome.failure === "refused"
    )
      return [{ source, reason: outcome.reason }];
    if (
      outcome.kind === "skipped" &&
      entry.hash === "" &&
      listed.has(source.url)
    )
      return [{ source, reason: "not requested this run; listed before" }];
    return [];
  });
}

/** Created once; edited only when its set of pages changes; never reopened or commented on. */
export function standingAction(
  input: WatchInput,
  pages: NotWatchedPage[],
): WatchAction[] {
  const issue = input.standingIssue;
  if (issue === null)
    return pages.length === 0
      ? []
      : [
          {
            kind: "create",
            title: STANDING_TITLE,
            body: standingBody(pages, input.today),
            label: LABEL,
          },
        ];
  if (issue.state !== "OPEN") return [];
  const listed = [...markersIn(issue.body, "cannot-read")].sort();
  const urls = pages.map((page) => page.source.url).sort();
  if (listed.join("\n") === urls.join("\n")) return [];
  return [
    {
      kind: "edit",
      number: issue.number,
      body: standingBody(pages, input.today),
    },
  ];
}
