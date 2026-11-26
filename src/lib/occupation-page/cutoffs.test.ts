import { describe, expect, it } from "vitest";
import type { RoundsFile, StoredRound } from "../data/rounds-file";
import { BANNED_COPY } from "../report/copy";
import {
  CUTOFFS_PAGE,
  cutoffTable,
  cutoffsAnswer,
  cutoffsJsonLd,
  tieBreakFor,
} from "./cutoffs";

const round = (
  date: string,
  rows: StoredRound["rows"],
  invited: number | null = 1000,
): StoredRound => ({
  date,
  totals:
    invited === null
      ? null
      : [{ subclass: "189", label: "Skilled Independent", invited }],
  tieBreak: null,
  rows,
  nominations: null,
});

const NURSE = { name: "Registered Nurses nec", code: "254499" };
const CIVIL = { name: "Civil Engineer", code: "233211" };

const file: RoundsFile = {
  schemaVersion: 2,
  skipped: [],
  rounds: [
    round("2026-10-15", [
      { ...NURSE, cutoff: 70, tieBreak: "2026-09-01" },
      { ...NURSE, cutoff: 70, tieBreak: "2026-09-01" },
      { name: "Unmatched Role", code: null, cutoff: 90, tieBreak: null },
    ]),
    round("2026-06-04", [
      { ...NURSE, cutoff: 80, tieBreak: null },
      { ...CIVIL, cutoff: 85, tieBreak: null },
    ]),
    round("2025-11-13", [{ ...CIVIL, cutoff: 80, tieBreak: null }]),
    round("2025-08-21", []),
    round("2024-11-07", [
      { name: "Old Role", code: "111111", cutoff: 95, tieBreak: null },
    ]),
  ],
};

const pages = [
  { ...NURSE, path: "/occupations/registered-nurses-nec-254499/" },
  { ...CIVIL, path: "/occupations/civil-engineer-233211/" },
];

describe("cutoffTable", () => {
  const table = cutoffTable(file, pages);
  it("lists every occupation from the last four rounds, A to Z, once", () => {
    expect(table.rounds).toEqual([
      "2026-10-15",
      "2026-06-04",
      "2025-11-13",
      "2025-08-21",
    ]);
    expect(table.rows.map((r) => r.name)).toEqual([
      "Civil Engineer",
      "Registered Nurses nec",
      "Unmatched Role",
    ]);
  });
  it("keeps a round that didn't list an occupation as null, never zero", () => {
    const civil = table.rows[0];
    expect(civil.cutoffs).toEqual([null, 85, 80, null]);
    expect(civil.path).toBe("/occupations/civil-engineer-233211/");
  });
  it("takes the tie-break from the newest listed row and links only matched rows", () => {
    expect(table.rows[1]).toMatchObject({
      cutoffs: [70, 80, null, null],
      tieBreak: "2026-09-01",
    });
    expect(table.rows[2]).toMatchObject({ code: null, path: null });
  });
});

describe("tieBreakFor", () => {
  it("finds the occupation's row in the round, or null", () => {
    expect(tieBreakFor(file, "254499", "2026-10-15")).toBe("2026-09-01");
    expect(tieBreakFor(file, "254499", "2026-06-04")).toBeNull();
    expect(tieBreakFor(file, "233211", "2026-10-15")).toBeNull();
    expect(tieBreakFor(file, "254499", "2020-01-01")).toBeNull();
  });
});

describe("cutoffsAnswer", () => {
  it("dates the newest round and gives its EOIs, occupations and span", () => {
    expect(cutoffsAnswer(file, cutoffTable(file, pages))).toBe(
      "In the latest 189 round, on 15 Oct 2026, Home Affairs invited 1,000 EOIs across 2 occupations, with cut-offs from 70 to 90 points. This table lists each occupation’s cut-off in the last four rounds; “Not listed” means the round didn’t include it, not a cut-off of zero. Source: Home Affairs SkillSelect invitation rounds.",
    );
  });
  it("says only what was listed when the round has no totals table", () => {
    const noTotals = { ...file, rounds: [{ ...file.rounds[0], totals: null }] };
    expect(cutoffsAnswer(noTotals, cutoffTable(noTotals, pages))).toContain(
      "Home Affairs listed 2 occupations, with cut-offs from 70 to 90 points",
    );
  });
});

describe("the cut-offs hub page", () => {
  it("marks the table up as a Dataset in the occupations catalogue, with breadcrumbs", () => {
    const table = cutoffTable(file, pages);
    const [dataset, crumbs] = cutoffsJsonLd("Answer.", table, [
      "https://immi.homeaffairs.gov.au/rounds",
    ]) as Record<string, unknown>[];
    expect(dataset).toMatchObject({
      "@type": "Dataset",
      temporalCoverage: "2025-08-21/2026-10-15",
      dateModified: "2026-10-15",
      url: "https://migratelens.com/occupations/189-cut-offs/",
    });
    expect(crumbs["@type"]).toBe("BreadcrumbList");
  });
  it("fits its title and description and follows the copy rules", () => {
    expect((CUTOFFS_PAGE.title + " · MigrateLens").length).toBeLessThanOrEqual(
      60,
    );
    expect(CUTOFFS_PAGE.description.length).toBeGreaterThanOrEqual(120);
    expect(CUTOFFS_PAGE.description.length).toBeLessThanOrEqual(160);
    for (const text of [
      CUTOFFS_PAGE.description,
      cutoffsAnswer(file, cutoffTable(file, pages)),
    ]) {
      expect(text).not.toMatch(BANNED_COPY);
    }
  });
});
