import { describe, expect, it } from "vitest";
import { occupationIndex } from "../../components/data/occupation-index";
import { stateRuleData } from "../../components/data/state-rule-data";
import { loadOccupationCore, loadOccupationDetail } from "../data/load-server";
import type { OccupationCore } from "../data/types";
import { BANNED_COPY } from "../report/copy";
import { cohortNote, cohortRows, roundsNote } from "./charts";
import { occupationFaq } from "./faq";
import { descriptionExtras, pageDescription, pageTitle } from "./meta";
import { stateRows } from "./states";
import { occupationSummary, statusChips } from "./summary";
import { occupationVerdict } from "./verdict";

/** "65 to 65 points" or "80–80": a single value printed as a range. */
const REPEATED_RANGE = /\b(\d+)(?: to |–)\1\b/;

function verdictStrings(core: OccupationCore): string[] {
  const verdict = occupationVerdict(core, stateRuleData.federal);
  if (verdict.kind !== "scores") return [verdict.name, verdict.text];
  return [verdict.note, ...verdict.cells.map((c) => `${c.points}: ${c.name}`)];
}

function pageStrings(code: string): string[] {
  const core = loadOccupationCore(code)!;
  const detail = loadOccupationDetail(code);
  const cohorts = cohortRows(detail, core.asAt);
  const rows = stateRows(code, core, stateRuleData);
  return [
    ...occupationSummary(core, detail, stateRuleData.federal, rows),
    ...statusChips(core, stateRuleData.federal).map((c) => c.label),
    ...occupationFaq(core, rows, { federal: stateRuleData.federal }).flatMap(
      (f) => [f.question, f.answer],
    ),
    roundsNote(core.rounds189),
    ...verdictStrings(core),
    ...(cohorts ? [cohortNote(core.name, cohorts)] : []),
  ];
}

describe("every occupation page's copy", () => {
  const codes = occupationIndex.filter((e) => e.hasData).map((e) => e.code);

  it("covers every occupation with data", () => {
    expect(codes.length).toBeGreaterThan(400);
    expect(codes.length).toBe(occupationIndex.filter((e) => e.hasData).length);
  });

  it("passes the copy rules and never prints a broken range", () => {
    const problems = codes.flatMap((code) =>
      pageStrings(code)
        .filter(
          (s) =>
            BANNED_COPY.test(s) ||
            REPEATED_RANGE.test(s) ||
            s.includes("not listed points"),
        )
        .map((s) => `${code}: ${s}`),
    );
    expect(problems).toEqual([]);
  });

  it("says 189 isn't available, never no data, off the federal 189 list", () => {
    const entries = stateRuleData.federal!.entries;
    const offList = codes.filter((code) => !entries[code]?.["189"]);
    expect(offList.length).toBeGreaterThan(0);
    const wrong = offList.filter((code) => {
      const verdict = occupationVerdict(
        loadOccupationCore(code)!,
        stateRuleData.federal,
      );
      return verdict.kind !== "unavailable";
    });
    expect(wrong).toEqual([]);
  });
});

/** "For 2026–27.", "For 2026–27, QLD." or "None of NSW.": a sentence cut at a comma. */
const FRAGMENT =
  /(?:^|\. )(?:For \d{4}–\d{2}(?:, [A-Z]{2,3})*|None of [A-Z]{2,3}(?:, [A-Z]{2,3})*)\./;

/** A summary sentence, or its prefix up to a "; " (a whole clause), closed with ".". */
function wholePieces(summary: string[], extras: string[]): Set<string> {
  const pieces = new Set(extras);
  for (const sentence of summary) {
    pieces.add(sentence);
    let at = sentence.indexOf("; ");
    while (at > 0) {
      pieces.add(`${sentence.slice(0, at)}.`);
      at = sentence.indexOf("; ", at + 1);
    }
  }
  return pieces;
}

/** True when `text` is `pieces` joined by single spaces, in any order. */
function isMadeOf(text: string, pieces: Set<string>): boolean {
  if (text === "") return true;
  return [...pieces].some(
    (piece) =>
      (text === piece || text.startsWith(`${piece} `)) &&
      isMadeOf(text.slice(piece.length + 1), pieces),
  );
}

describe("every occupation page's title and description", () => {
  const pages = occupationIndex
    .filter((e) => e.hasData)
    .map((e) => loadOccupationCore(e.code)!)
    .map((c) => {
      const summary = occupationSummary(
        c,
        loadOccupationDetail(c.code),
        stateRuleData.federal,
        stateRows(c.code, c, stateRuleData),
      );
      return { core: c, summary, description: pageDescription(c, summary) };
    });
  it("covers every occupation with data", () => {
    expect(pages.length).toBeGreaterThan(400);
  });
  it("has a title of at most 60 characters, all unique", () => {
    const long = pages.filter((p) => pageTitle(p.core).length > 60);
    expect(long.map((p) => pageTitle(p.core))).toEqual([]);
    const titles = new Set(pages.map((p) => pageTitle(p.core)));
    expect(titles.size).toBe(pages.length);
  });
  it("has a 120–160 character description, all unique", () => {
    const bad = pages.filter(
      (p) =>
        p.description.length < 120 ||
        p.description.length > 160 ||
        p.description.includes("…") ||
        !p.description.endsWith("."),
    );
    expect(bad.map((p) => `${p.core.code}: ${p.description}`)).toEqual([]);
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
  });
  it("never ends a description sentence in a fragment cut at a comma", () => {
    const bad = pages.filter((p) => FRAGMENT.test(p.description));
    expect(bad.map((p) => `${p.core.code}: ${p.description}`)).toEqual([]);
  });
  it("builds every description from the page's whole sentences and clauses", () => {
    const bad = pages.filter(
      (p) =>
        !isMadeOf(
          p.description,
          wholePieces(p.summary, descriptionExtras(p.core)),
        ),
    );
    expect(bad.map((p) => `${p.core.code}: ${p.description}`)).toEqual([]);
  });
  it("rejects the fragments the audit found", () => {
    for (const text of [
      "The 491 pool holds 203 EOIs. For 2026–27.",
      "The 491 pool holds 203 EOIs. For 2026–27, QLD.",
      "The 491 pool holds 203 EOIs. None of NSW.",
      "The pool holds 4 EOIs. None of NSW, QLD.",
    ]) {
      expect(FRAGMENT.test(text), text).toBe(true);
    }
    const pieces = wholePieces(
      [
        "For 2026–27, QLD, WA and SA list it for 190 and 491; NSW lists it for 190.",
      ],
      [],
    );
    expect(
      isMadeOf("For 2026–27, QLD, WA and SA list it for 190 and 491.", pieces),
    ).toBe(true);
    expect(isMadeOf("For 2026–27, QLD.", pieces)).toBe(false);
  });
});
