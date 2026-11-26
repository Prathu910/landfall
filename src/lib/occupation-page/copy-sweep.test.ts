import { describe, expect, it } from "vitest";
import { occupationIndex } from "../../components/data/occupation-index";
import { stateRuleData } from "../../components/data/state-rule-data";
import { loadOccupationCore, loadOccupationDetail } from "../data/load-server";
import type { OccupationCore } from "../data/types";
import { BANNED_COPY } from "../report/copy";
import { cohortNote, cohortRows, roundsNote } from "./charts";
import { occupationFaq } from "./faq";
import { pageDescription, pageTitle } from "./meta";
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
  return [
    ...occupationSummary(core, detail),
    ...statusChips(core, stateRuleData.federal).map((c) => c.label),
    ...occupationFaq(core, stateRows(code, core, stateRuleData)).flatMap(
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

describe("every occupation page's title and description", () => {
  const pages = occupationIndex
    .filter((e) => e.hasData)
    .map((e) => loadOccupationCore(e.code)!)
    .map((c) => ({
      core: c,
      description: pageDescription(
        c,
        occupationSummary(
          c,
          loadOccupationDetail(c.code),
          stateRuleData.federal,
        ),
      ),
    }));
  it("covers every occupation with data", () => {
    expect(pages.length).toBeGreaterThan(400);
  });
  it("has a title of at most 60 characters, all unique", () => {
    const long = pages.filter((p) => pageTitle(p.core).length > 60);
    expect(long.map((p) => pageTitle(p.core))).toEqual([]);
    const titles = new Set(pages.map((p) => pageTitle(p.core)));
    expect(titles.size).toBe(pages.length);
  });
  it("has a 120–160 character description of whole sentences", () => {
    const bad = pages.filter(
      (p) =>
        p.description.length < 120 ||
        p.description.length > 160 ||
        p.description.includes("…") ||
        !p.description.endsWith("."),
    );
    expect(bad.map((p) => `${p.core.code}: ${p.description}`)).toEqual([]);
  });
});
