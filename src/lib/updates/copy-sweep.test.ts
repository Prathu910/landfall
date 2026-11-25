import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import { pagesFor } from "./__fixtures__/occupation-pages";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import { isRecapFacts } from "./guards";
import { listRecapMonths, loadRecap } from "./load-server";
import { recapDescription, recapJsonLd, recapTitle } from "./meta";
import { buildRecapView } from "./recap-view";
import type { RecapFacts } from "./types";

/** "0–19": a range that starts at a hidden count's zero. */
const ZERO_RANGE = /(?<![\d,.])0–/;
/** "65 to 65 points" or "80–80": a single value printed as a range. */
const REPEATED_RANGE = /\b(\d[\d,]*)(?: to |–)\1\b/;
/** A masked or unpublished figure printed as zero. */
const ZERO_FIGURE = /\b(at least|about) 0\b/;

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

function recapStrings(facts: RecapFacts): string[] {
  const view = buildRecapView(facts, {
    recapMonths: listRecapMonths(),
    occupationPages: pagesFor(facts),
  });
  return [
    ...strings(view),
    recapTitle(facts),
    recapDescription(view),
    ...strings(recapJsonLd(facts, view, "/og.png")),
  ];
}

const FILES: [string, RecapFacts][] = [
  ...listRecapMonths().map((m): [string, RecapFacts] => [m, loadRecap(m)]),
  ["round-only fixture", roundOnly],
  ["data-only fixture", dataOnly],
  ["two-rounds fixture", twoRounds],
];

describe("every recap's copy", () => {
  it("covers every facts file in src/data/updates/", () => {
    expect(listRecapMonths().length).toBeGreaterThan(0);
  });

  it("checks valid facts files", () => {
    for (const [name, facts] of FILES)
      expect(isRecapFacts(facts), name).toBe(true);
  });

  it.each(FILES)("%s passes the copy and number rules", (_name, facts) => {
    const problems = recapStrings(facts).filter(
      (s) =>
        BANNED_COPY.test(s) ||
        /\bNaN\b|\bundefined\b|\bnull\b/.test(s) ||
        ZERO_RANGE.test(s) ||
        REPEATED_RANGE.test(s) ||
        ZERO_FIGURE.test(s),
    );
    expect(problems).toEqual([]);
  });

  it.each(FILES)(
    "%s links internal pages with a trailing slash",
    (_n, facts) => {
      const view = buildRecapView(facts, {
        recapMonths: listRecapMonths(),
        occupationPages: pagesFor(facts),
      });
      const hrefs = strings(view).filter((s) => s.startsWith("/"));
      for (const href of hrefs) expect(href, href).toMatch(/\/(#[\w-]+)?$/);
    },
  );
});
