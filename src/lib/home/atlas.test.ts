import { describe, expect, it } from "vitest";
import { coreFixture } from "../data/__fixtures__/occupation";
import type { OccupationCore } from "../data/types";
import { buildHomeAtlas } from "./atlas";

const provenance = {
  snapshotId: coreFixture.snapshotId,
  asAt: coreFixture.asAt,
  checkedAt: "2026-11-17",
  sources: {
    dashboard: "https://example.test/skillselect",
    currentRounds: "https://example.test/rounds",
    previousRounds: "https://example.test/previous-rounds",
  },
};

const core: OccupationCore = {
  ...coreFixture,
  stateInvited: {
    "190": {
      NSW: {
        "2026-05": {},
        "2026-07": { "80": "40", "90": "100" },
        "2026-08": {},
        "2026-09": { "80": "<20", "85": "<20" },
        "2026-10": { "80": "<20" },
      },
    },
    "491": { NSW: { "2026-10": { "90": "25", "95": "100" } } },
  },
};

describe("homepage atlas evidence", () => {
  it("applies nomination once and excludes scores above the resulting total", () => {
    const nominated = buildHomeAtlas(core, 75, "190", "NSW", provenance);
    const regional = buildHomeAtlas(core, 75, "491", "NSW", provenance);
    const national = buildHomeAtlas(core, 75, "189", "NSW", provenance);
    expect([
      national.totalPoints,
      nominated.totalPoints,
      regional.totalPoints,
    ]).toEqual([75, 80, 90]);
    expect(nominated.nominationPoints).toBe(5);
    expect(regional.nominationPoints).toBe(15);
    if (regional.kind !== "state") throw new Error("expected state");
    expect(regional.latest?.count).toEqual({ min: 25, max: 25 });
    expect(regional.caveat).toContain("provisional");
  });

  it("fills the six calendar months while keeping missing distinct from zero", () => {
    const view = buildHomeAtlas(core, 75, "190", "NSW", provenance);
    if (view.kind !== "state") throw new Error("expected state");
    expect(view.months.map((month) => month.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(view.months[0]).toMatchObject({
      count: { min: 0, max: 0 },
      text: "0",
      masked: false,
    });
    expect(view.months[1]).toMatchObject({
      count: null,
      text: "Not published",
      masked: false,
    });
    expect(view.months[2].count).toEqual({ min: 40, max: 40 });
  });

  it("preserves masked ranges and does not call a masked count confirmed", () => {
    const view = buildHomeAtlas(core, 80, "190", "NSW", provenance);
    if (view.kind !== "state") throw new Error("expected state");
    expect(view.months[4]).toMatchObject({
      count: { min: 0, max: 38 },
      text: "under 39",
      masked: true,
    });
    expect(view.latest).toMatchObject({
      month: "2026-10",
      count: { min: 0, max: 19 },
      text: "under 20",
    });
    expect(view.latestConfirmed).toMatchObject({
      month: "2026-07",
      count: { min: 40, max: 40 },
    });
    expect(view.caveat).toContain("Historical evidence, not eligibility");
  });

  it("says an under count may be zero only when a month shows one", () => {
    const masked = buildHomeAtlas(core, 80, "190", "NSW", provenance);
    const exact = buildHomeAtlas(core, 75, "491", "NSW", provenance);
    if (masked.kind !== "state" || exact.kind !== "state") {
      throw new Error("expected state");
    }
    expect(masked.explanation).toMatch(/An “under” count may be zero\.$/);
    expect(exact.explanation).not.toMatch(/may be zero/);
  });

  it("reports an unfetched state as no data without inventing a zero count", () => {
    const view = buildHomeAtlas(core, 75, "190", "WA", provenance);
    if (view.kind !== "state") throw new Error("expected state");
    expect(view.label).toBe("no-data");
    expect(view.months.every((month) => month.count === null)).toBe(true);
    expect(view.latest).toBeNull();
    expect(view.latestConfirmed).toBeNull();
    expect(view.explanation).toContain("No monthly state evidence");
  });

  it("keeps 189 national regardless of selected state and preserves masked pool counts", () => {
    const nsw = buildHomeAtlas(core, 85, "189", "NSW", provenance);
    const wa = buildHomeAtlas(core, 85, "189", "WA", provenance);
    expect(nsw).toEqual(wa);
    if (nsw.kind !== "national") throw new Error("expected national");
    expect(nsw.higher).toEqual({ min: 50, max: 69 });
    expect(nsw.same).toEqual({ min: 100, max: 100 });
    expect(nsw.higherText).toBe("50–69");
    expect(nsw.latestRound).toContain("95");
    expect(nsw.provenance).toEqual(provenance);
    expect(nsw.explanation).not.toMatch(/Confirm your English/);
    expect(nsw.caveat).toContain("national pathway");
  });

  it("keeps missing national pools and null cutoffs separate from zero", () => {
    const empty = {
      ...core,
      pool: {},
      rounds189: [{ date: "2026-10-15", cutoff: null }],
    };
    const view = buildHomeAtlas(empty, 85, "189", "NSW", provenance);
    if (view.kind !== "national") throw new Error("expected national");
    expect(view.higher).toBeNull();
    expect(view.same).toBeNull();
    expect(view.higherText).toBe("Not published");
    expect(view.latestRound).toContain("Not listed");
    expect(view.latestRound).not.toContain("0 points");
  });
});
