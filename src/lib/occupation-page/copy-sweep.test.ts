import { describe, expect, it } from "vitest";
import { occupationIndex } from "../../components/data/occupation-index";
import { stateRuleData } from "../../components/data/state-rule-data";
import { loadOccupationCore, loadOccupationDetail } from "../data/load-server";
import { BANNED_COPY } from "../report/copy";
import { cohortNote, cohortRows, roundsNote } from "./charts";
import { occupationFaq } from "./faq";
import { stateRows } from "./states";
import { occupationSummary, statusChips } from "./summary";

/** "65 to 65 points" or "80–80": a single value printed as a range. */
const REPEATED_RANGE = /\b(\d+)(?: to |–)\1\b/;

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
    ...(cohorts ? [cohortNote(core.name, cohorts)] : []),
  ];
}

describe("every occupation page's copy", () => {
  const codes = occupationIndex.filter((e) => e.hasData).map((e) => e.code);

  it("covers every occupation with data", () => {
    expect(codes.length).toBe(479);
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
});
