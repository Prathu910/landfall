// The text of the page watcher's issues. The repo is public, so an issue holds
// only public page excerpts: page text appears only inside a fence longer than
// any backtick run in it (where GitHub links no @mentions), and titles and
// reasons are flattened to one line with @ disarmed.
import { MAX_BODY, fenceFor } from "../automation/failure-issue";
import { diffLines } from "./diff-lines";
import type { NormalisedPage } from "./normalise";
import type { Citation, WatchedSource } from "./sources";

export const LABEL = "source-watch";
export const STANDING_TITLE = "Sources the watcher cannot read";
const EXCERPT_LINES = 40;
const MAX_CITATIONS = 12;
const STANDING_CITATIONS = 3;

type MarkerKind = "watch-url" | "cannot-read";
const marker = (kind: MarkerKind, url: string) => `<!-- ${kind}: ${url} -->`;
export const watchMarker = (url: string) => marker("watch-url", url);
export const cannotReadMarker = (url: string) => marker("cannot-read", url);

/** URLs marked in a body, on their own lines outside any fenced excerpt. */
export function markersIn(body: string, kind: MarkerKind): Set<string> {
  const urls = new Set<string>();
  let fence: string | null = null;
  for (const line of body.split("\n")) {
    const run = /^(`{3,})/.exec(line)?.[1];
    if (fence === null && run) fence = run;
    else if (
      fence !== null &&
      run &&
      run.length >= fence.length &&
      line.trim() === run
    )
      fence = null;
    else if (fence === null) {
      const found = new RegExp(`^<!-- ${kind}: (\\S+) -->$`).exec(line.trim());
      if (found) urls.add(found[1]);
    }
  }
  return urls;
}

/** Page text for an issue title or list item: one line, no @mentions, capped. */
export function plain(text: string, max: number): string {
  const line = text
    .replace(/[\s\p{Cc}]+/gu, " ")
    .replace(/@/g, "＠")
    .trim();
  return line.length <= max ? line : `${line.slice(0, max - 1)}…`;
}

function citationLines(
  citedBy: Citation[],
  indent: string,
  max: number,
): string[] {
  const lines = citedBy
    .slice(0, max)
    .map(
      ({ file, item, checkedAt }) =>
        `${indent}- \`${file}\`: ${item} (${checkedAt ? `checked ${checkedAt}` : "no checked date"})`,
    );
  const more = citedBy.length - max;
  return more > 0 ? [...lines, `${indent}- and ${more} more`] : lines;
}

function capped(body: string): string {
  return body.length <= MAX_BODY
    ? body
    : `${body.slice(0, MAX_BODY - 20)}\n\n(truncated)`;
}

/** `head`, then `excerpt` in a `diff` fence, shortened (never the fence) to fit MAX_BODY. */
export function withExcerpt(head: string, excerpt: string): string {
  const room = MAX_BODY - head.length - 2 * fenceFor(excerpt).length - 40;
  const fitted =
    excerpt.length <= room
      ? excerpt
      : `${excerpt.slice(0, Math.max(0, room))}\n(truncated)`;
  const fence = fenceFor(fitted);
  return [head, `${fence}diff`, fitted, fence].join("\n");
}

export function changeBody(
  source: WatchedSource,
  previousText: string,
  previousSeen: string,
  page: NormalisedPage,
  today: string,
): string {
  const diff = diffLines(previousText, page.text, EXCERPT_LINES);
  const head = [
    watchMarker(source.url),
    "The page watcher saw new text on an official page this site cites. It never edits the site: if a rule or fee changed, update it and its `checkedAt` in a reviewed change, then close this issue.",
    "",
    `- Page: ${source.url}`,
    `- Change first seen: ${today} (the previous text was first seen ${previousSeen})`,
    "- Cited by:",
    ...citationLines(source.citedBy, "  ", MAX_CITATIONS),
    "",
    `Changed lines (showing ${diff.lines.length} of ${diff.total}; \`-\` before, \`+\` after):`,
    "",
  ].join("\n");
  return withExcerpt(head, diff.lines.join("\n"));
}

export type UnreachablePage = {
  source: WatchedSource;
  reason: string;
  lastReadSeen: string;
};

export function unreachableBody(
  pages: UnreachablePage[],
  days: number,
): string {
  return capped(
    [
      ...pages.map(({ source }) => watchMarker(source.url)),
      `These official pages used to be readable, but the page watcher could not read them on ${days} daily checks in a row. It never works around a block: open each page in a browser, and if it moved or closed, update the source and its \`checkedAt\` in a reviewed change, then close this issue.`,
      "",
      ...pages.flatMap(({ source, reason, lastReadSeen }) => [
        `- ${source.url}: ${plain(reason, 200)} (its last text was first seen ${lastReadSeen})`,
        ...citationLines(source.citedBy, "  ", MAX_CITATIONS),
      ]),
    ].join("\n"),
  );
}

export type NotWatchedPage = { source: WatchedSource; reason: string };

/** The standing issue's body: rewritten only when its set of pages changes. */
export function standingBody(pages: NotWatchedPage[], today: string): string {
  const list =
    pages.length === 0
      ? ["None right now: every cited page can be read."]
      : pages.flatMap(({ source, reason }) => [
          cannotReadMarker(source.url),
          `- ${source.url}: ${plain(reason, 200)}`,
          ...citationLines(source.citedBy, "  ", STANDING_CITATIONS),
        ]);
  return capped(
    [
      "The page watcher cannot watch these official pages: each refused automated reads (an HTTP 4xx answer or a sign-in page) and has never been read, or robots.txt disallows it. It never works around a block, so a change to them is not caught: check them by hand when you review the rules and fees they back.",
      "",
      `This list is rewritten when it changes (last change ${today}); it gets no daily comments.`,
      "",
      ...list,
    ].join("\n"),
  );
}
