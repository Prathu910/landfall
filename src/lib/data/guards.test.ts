import { describe, expect, it } from "vitest";
import {
  isCountText,
  isManifest,
  isOccupationCore,
  isOccupationDetail,
} from "./guards";

function core(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    snapshotId: "2026-10",
    asAt: "2026-10",
    code: "261313",
    name: "Software Engineer",
    group: null,
    pool: { "189": { total: "<20", byScore: { "90": "12" } } },
    statusHistory: { "189": { "2026-09": {}, "2026-10": { SUBMITTED: "5" } } },
    invitedByScore: { "189": { "2026-10": { "90": "<20" } } },
    statePool: { "190": { NSW: { "80": "3" } } },
    stateInvited: { "190": { NSW: { "2026-10": { "80": "3" } } } },
    rounds189: [
      { date: "2026-10-15", cutoff: 95 },
      { date: "2026-09-15", cutoff: null },
    ],
  };
}

function detail(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    snapshotId: "2026-10",
    asAt: "2026-10",
    code: "261313",
    cohorts: {
      "189": { older: { SUBMITTED: "4" }, "2026-10": { INVITED: "<20" } },
    },
    cohortsByScore: { "189": { "90": { older: "3", "2026-09": "1" } } },
    invitedProfile: {
      "189": { english: { "2026-09": {}, "2026-10": { "20": "2" } } },
    },
    invitedProfileState: {
      "190": { NSW: { partnerSkills: { "5": "2" }, english: {} } },
    },
  };
}

function manifest(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    snapshotId: "2026-10",
    asAt: "2026-10",
    checkedAt: "2026-11-17",
    importVersion: "1",
    sources: { dashboard: "a", currentRounds: "b", previousRounds: "c" },
    roundsUnmatched: [],
    occupations: [
      {
        code: "261313",
        name: "X",
        hasData: true,
        group: null,
        totals: { "189": "5" },
      },
    ],
  };
}

describe("isCountText", () => {
  it("accepts digits and <20 only", () => {
    expect(isCountText("12")).toBe(true);
    expect(isCountText("<20")).toBe(true);
    expect(isCountText("12a")).toBe(false);
    expect(isCountText("")).toBe(false);
    expect(isCountText(12)).toBe(false);
  });
});

describe("isOccupationCore", () => {
  it("accepts a valid record", () => {
    expect(isOccupationCore(core())).toBe(true);
  });
  it.each([
    [
      "schemaVersion 1",
      (c: Record<string, unknown>) => ((c.schemaVersion = 1), c),
    ],
    [
      "bad count",
      (c: Record<string, unknown>) => (
        (c.pool = { "189": { total: "12a", byScore: {} } }),
        c
      ),
    ],
    [
      "bad month key",
      (c: Record<string, unknown>) => (
        (c.statusHistory = { "189": { "2026-13": {} } }),
        c
      ),
    ],
    [
      "string cutoff",
      (c: Record<string, unknown>) => (
        (c.rounds189 = [{ date: "2026-10-15", cutoff: "95" }]),
        c
      ),
    ],
    ["missing code", (c: Record<string, unknown>) => (delete c.code, c)],
    [
      "bad visa key",
      (c: Record<string, unknown>) => (
        (c.pool = { "482": { total: "1", byScore: {} } }),
        c
      ),
    ],
    [
      "bad state key",
      (c: Record<string, unknown>) => (
        (c.statePool = { "190": { XX: {} } }),
        c
      ),
    ],
    [
      "bad status key",
      (c: Record<string, unknown>) => (
        (c.statusHistory = { "189": { "2026-10": { NOPE: "1" } } }),
        c
      ),
    ],
    [
      "bad date",
      (c: Record<string, unknown>) => (
        (c.rounds189 = [{ date: "15/10/2026", cutoff: 1 }]),
        c
      ),
    ],
    [
      "older as month key in core",
      (c: Record<string, unknown>) => (
        (c.statusHistory = { "189": { older: {} } }),
        c
      ),
    ],
  ])("rejects %s", (_n, mutate) => {
    expect(isOccupationCore(mutate(core()))).toBe(false);
  });
  it("rejects non-objects", () => {
    expect(isOccupationCore(null)).toBe(false);
    expect(isOccupationCore("x")).toBe(false);
  });
});

describe("isOccupationDetail", () => {
  it("accepts a valid record including the older cohort", () => {
    expect(isOccupationDetail(detail())).toBe(true);
  });
  it("rejects a bad cohort key", () => {
    const d = detail();
    d.cohorts = { "189": { newer: {} } };
    expect(isOccupationDetail(d)).toBe(false);
  });
  it("rejects profile counts keyed by value before month (schema 1)", () => {
    const d = detail();
    d.invitedProfile = { "189": { english: { "20": { "2026-10": "2" } } } };
    expect(isOccupationDetail(d)).toBe(false);
  });
  it("rejects a schema 1 record", () => {
    const d = detail();
    d.schemaVersion = 1;
    expect(isOccupationDetail(d)).toBe(false);
  });
  it("rejects a bad profile attribute and bad count", () => {
    const d = detail();
    d.invitedProfile = { "189": { height: {} } };
    expect(isOccupationDetail(d)).toBe(false);
    const e = detail();
    e.cohortsByScore = { "189": { "90": { older: "x" } } };
    expect(isOccupationDetail(e)).toBe(false);
  });
});

describe("isManifest", () => {
  it("accepts a valid manifest", () => {
    expect(isManifest(manifest())).toBe(true);
  });
  it("rejects duplicate occupation codes", () => {
    const m = manifest();
    const occ = (m.occupations as unknown[])[0];
    m.occupations = [occ, occ];
    expect(isManifest(m)).toBe(false);
  });
  it("rejects a bad checkedAt", () => {
    const m = manifest();
    m.checkedAt = "yesterday";
    expect(isManifest(m)).toBe(false);
  });
  it("accepts an optional roundsCheckedAt date and rejects a bad one", () => {
    const m = manifest();
    m.roundsCheckedAt = "2026-11-20";
    expect(isManifest(m)).toBe(true);
    m.roundsCheckedAt = "20 Nov";
    expect(isManifest(m)).toBe(false);
  });
});
