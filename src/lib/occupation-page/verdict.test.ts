import { describe, expect, it } from "vitest";
import { coreFixture } from "../data/__fixtures__/occupation";
import type { OccupationCore } from "../data/types";
import type { FederalList } from "../state-outlook/rules-types";
import { occupationVerdict as verdictWith } from "./verdict";

const rounds = (cutoffs: (number | null)[]) =>
  cutoffs.map((cutoff, i) => ({
    date: `2026-${String(10 - i).padStart(2, "0")}-15`,
    cutoff,
  }));

// Last three listed cut-offs 80, 75 and 70; under 20 EOIs above 80.
const regular: OccupationCore = {
  ...coreFixture,
  code: "254499",
  name: "Registered Nurses nec",
  pool: {
    "189": {
      total: "820",
      byScore: { "70": "500", "75": "200", "80": "100", "85": "<20" },
    },
  },
  rounds189: rounds([80, 75, 70, 70]),
};

type Entry = FederalList["entries"][string];

function federalWith(code: string, entry: Entry): FederalList {
  return {
    source: "https://immi.example.gov.au/list",
    checkedAt: "2026-11-23",
    entries: { [code]: entry },
  };
}

const ON_189: Entry = { "189": true, "190": true, "491": true };

/** The verdict for an occupation the federal list has for 189. */
function occupationVerdict(core: OccupationCore) {
  return verdictWith(core, federalWith(core.code, ON_189));
}

describe("occupationVerdict", () => {
  it("shows the 189 label where it changes, from 65 up", () => {
    const verdict = occupationVerdict(regular);
    if (verdict.kind !== "scores") throw new Error(verdict.kind);
    expect(verdict.cells).toEqual([
      { points: "65", label: "long-wait", name: "Long wait" },
      { points: "70–75", label: "competitive", name: "Competitive" },
      { points: "80", label: "strong", name: "Strong" },
      { points: "85+", label: "very-strong", name: "Very strong" },
    ]);
  });

  it("says what the labels assume and links the check with the occupation", () => {
    const verdict = occupationVerdict(regular);
    if (verdict.kind !== "scores") throw new Error(verdict.kind);
    expect(verdict.note).toBe(
      "Assumes you meet the points-test basics (age, English and skills assessment). Based on the last 3 listed 189 rounds (cut-offs 80, 75 and 70). Not a guarantee.",
    );
    expect(verdict.checkHref).toBe("/check/?occupation=254499");
  });

  it("extends the scores past high cut-offs so the top label shows", () => {
    const high = { ...regular, rounds189: rounds([100, 95, 95]) };
    const verdict = occupationVerdict({
      ...high,
      pool: { "189": { total: "40", byScore: { "95": "20", "100": "<20" } } },
    });
    if (verdict.kind !== "scores") throw new Error(verdict.kind);
    expect(verdict.cells.map((c) => `${c.points} ${c.name}`)).toEqual([
      "65–90 Long wait",
      "95 Competitive",
      "100 Strong",
      "105+ Very strong",
    ]);
  });

  it("keeps a top range that isn't very strong closed at its last score", () => {
    // Over 20 EOIs score above every point level shown.
    const crowded = {
      ...regular,
      pool: { "189": { total: "900", byScore: { "70": "400", "95": "500" } } },
    };
    const verdict = occupationVerdict(crowded);
    if (verdict.kind !== "scores") throw new Error(verdict.kind);
    expect(verdict.cells.at(-1)).toEqual({
      points: "80–90",
      label: "strong",
      name: "Strong",
    });
  });

  it("gives one line when 189 hasn't listed the occupation in 4 rounds", () => {
    const verdict = occupationVerdict({
      ...regular,
      rounds189: rounds([null, null, null, null, 85]),
    });
    expect(verdict).toEqual({
      kind: "closed",
      label: "not-invited",
      name: "Not currently invited",
      text: "189 hasn't listed this occupation in the last 4 rounds, so a higher score doesn't change this.",
      checkHref: "/check/?occupation=254499",
    });
  });

  it("says when there is no 189 data, and when every count is too few", () => {
    const none = occupationVerdict({ ...regular, pool: {}, rounds189: [] });
    expect(none).toMatchObject({
      kind: "closed",
      label: "no-data",
      name: "Not enough data",
      text: "No published 189 pool or invitation round lists this occupation, so there is no 189 outlook to show at any score.",
    });
    const masked = occupationVerdict({
      ...regular,
      pool: { "189": { total: "<20", byScore: { "70": "<20" } } },
      rounds189: [],
    });
    expect(masked).toMatchObject({
      kind: "closed",
      label: "no-data",
      name: "Too few to count",
      text: "Every published 189 count for this occupation is under 20 (so may be zero): too few to read at any score.",
    });
  });

  it("falls back to the published data when the federal list is missing", () => {
    const verdict = verdictWith({ ...regular, pool: {}, rounds189: [] }, null);
    expect(verdict).toMatchObject({ kind: "closed", label: "no-data" });
  });
});

describe("occupationVerdict for an occupation not on the 189 list", () => {
  const unlisted = { ...regular, pool: {}, rounds189: [] };
  const LIST_LINE =
    " The Home Affairs skilled occupation list doesn't include it for 189, so a higher score doesn't change this.";

  it("says 189 isn't available and that 190 and 491 may be", () => {
    const federal = federalWith(unlisted.code, {
      "189": false,
      "190": true,
      "491": true,
    });
    expect(verdictWith(unlisted, federal)).toEqual({
      kind: "unavailable",
      name: "Not available",
      text:
        "189 isn't available for this occupation; 190 and 491 may be, with state or territory nomination." +
        LIST_LINE,
      checkHref: "/check/?occupation=254499",
    });
  });

  it("names only the visas the federal list has", () => {
    const only491 = federalWith(unlisted.code, {
      "189": false,
      "190": false,
      "491": true,
    });
    expect(verdictWith(unlisted, only491)).toMatchObject({
      text:
        "189 isn't available for this occupation; 491 may be, with state or territory nomination." +
        LIST_LINE,
    });
    const none = federalWith(unlisted.code, {
      "189": false,
      "190": false,
      "491": false,
    });
    expect(verdictWith(unlisted, none)).toMatchObject({
      text:
        "189 isn't available for this occupation, and nor are 190 and 491." +
        LIST_LINE,
    });
  });

  it("treats a code missing from the federal list as not on it", () => {
    const other = federalWith("261313", ON_189);
    expect(verdictWith(unlisted, other)).toMatchObject({
      kind: "unavailable",
      text:
        "189 isn't available for this occupation, and nor are 190 and 491." +
        LIST_LINE,
    });
  });

  it("puts the federal list ahead of older 189 data", () => {
    const federal = federalWith(regular.code, {
      "189": false,
      "190": true,
      "491": true,
    });
    expect(verdictWith(regular, federal).kind).toBe("unavailable");
  });
});
