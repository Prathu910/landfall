import { describe, expect, it } from "vitest";
import type { RoundsFile } from "../data/rounds-file";
import type { Manifest } from "../data/types";
import {
  MONTH,
  cores,
  federal,
  manifest,
  rounds,
} from "./__fixtures__/data-2026-10";
import {
  buildDataSection,
  largePoolsNotListed,
  notable189,
} from "./facts-data";
import type { RecapFacts } from "./types";

const base = {
  month: MONTH,
  cores,
  manifest: manifest(),
  previousManifest: null,
  previousFacts: null,
  rounds,
  federal,
  today: "2026-11-24",
};

describe("notable189, 2026-10", () => {
  const notable = notable189(cores, rounds, MONTH)!;
  it("lists the ten listed occupations with the largest exact 189 pools", () => {
    expect(notable.round).toBe("2026-10-15");
    expect(notable.rows).toHaveLength(10);
    expect(notable.rows[0]).toMatchObject({
      code: "241111",
      cutoff: 90,
      pool: "13693",
    });
    const pools = notable.rows.map((r) => Number(r.pool));
    expect(pools).toEqual([...pools].sort((a, b) => b - a));
  });
  it("gives the previous round's cut-off, tie-break and invitations", () => {
    const nurses = notable.rows.find((r) => r.code === "254499");
    expect(nurses).toMatchObject({
      cutoff: 70,
      previousCutoff: 75,
      tieBreak: "2025-11-19",
      pool: "4280",
      invited: "2730",
    });
  });
  it("uses the latest round before the month when the month has none", () => {
    expect(notable189(cores, rounds, "2026-08")?.round).toBe("2026-06-04");
  });
  it("ignores rounds dated after the month (R5)", () => {
    const later: RoundsFile = {
      ...rounds,
      rounds: [{ ...rounds.rounds[0], date: "2026-11-12" }, ...rounds.rounds],
    };
    expect(notable189(cores, later, MONTH)?.round).toBe("2026-10-15");
  });
  it("is null with no round up to the month", () => {
    expect(notable189(cores, rounds, "2021-12")).toBeNull();
  });
});

describe("largePoolsNotListed, 2026-10", () => {
  const notListed = largePoolsNotListed(cores, rounds, federal, MONTH);
  it("lists large 189-list pools the latest round didn't list", () => {
    expect(notListed.map((o) => o.name)).toEqual([
      "Chef",
      "Software Engineer",
      "Civil Engineer",
      "ICT Business Analyst",
      "Mechanical Engineer",
      "Accountant (General)",
    ]);
    expect(notListed[1]).toMatchObject({
      pool: 9464,
      roundsNotListed: 4,
      lastListed: { date: "2024-11-07", cutoff: 95 },
    });
  });
  it("lists only occupations on the Home Affairs 189 list", () => {
    expect(notListed.every((o) => federal.entries[o.code]?.["189"])).toBe(true);
  });
});

describe("buildDataSection, 2026-10", () => {
  const data = buildDataSection(base);
  it("records sources, with no previous month on the first recap", () => {
    expect(data.generatedAt).toBe("2026-11-24");
    expect(data.sources).toEqual({
      snapshotId: "skillselect-2026-10-31",
      checkedAt: manifest().checkedAt,
      previous: null,
      federalListCheckedAt: federal.checkedAt,
    });
  });
  it("composes the national, state, mover and 189 facts", () => {
    expect(data.national["189"].submitted.current).toEqual({
      min: 166555,
      max: 167904,
    });
    expect(data.states["190"].VIC.floor).toBe(1018);
    expect(data.movers.fell[0].code).toBe("254499");
    expect(data.notable189?.rows[0].code).toBe("241111");
    expect(data.largePoolsNotListed[0].name).toBe("Chef");
    expect(data.spotlight).toMatchObject({ code: "254499", pickedBy: "auto" });
    expect(data.pool189ByScore.length).toBeGreaterThan(0);
    expect(Object.keys(data.invitedByScore)).toEqual(["189", "190", "491"]);
  });
  it("copies the newest stored nominations table", () => {
    expect(data.nominations).toEqual(rounds.rounds[0].nominations);
    expect(data.nominations?.byVisa["190"].VIC).toBeTruthy();
  });
  it("gives null added/removed without a previous manifest", () => {
    expect(data.occupationsAdded).toBeNull();
    expect(data.occupationsRemoved).toBeNull();
  });
});

describe("buildDataSection", () => {
  const previousManifest = (): Manifest => {
    const m = manifest();
    return {
      ...m,
      asAt: "2026-09",
      snapshotId: "skillselect-2026-09-30",
      checkedAt: "2026-10-16",
      occupations: [
        ...m.occupations.filter((o) => o.code !== "254499"),
        { ...m.occupations[0], code: "999999", name: "Gone Worker" },
      ],
    };
  };

  it("lists occupations added and removed against the previous manifest", () => {
    const data = buildDataSection({
      ...base,
      previousManifest: previousManifest(),
    });
    expect(data.occupationsAdded).toEqual([
      { code: "254499", name: "Registered Nurses nec" },
    ]);
    expect(data.occupationsRemoved).toEqual([
      { code: "999999", name: "Gone Worker" },
    ]);
    expect(data.sources.previous).toEqual({
      month: "2026-09",
      snapshotId: "skillselect-2026-09-30",
      checkedAt: "2026-10-16",
    });
  });

  it("takes the previous source from last month's facts without a previous manifest", () => {
    const first = buildDataSection(base);
    const previousFacts: RecapFacts = {
      schemaVersion: 1,
      month: "2026-09",
      firstGeneratedAt: "2026-10-16",
      updatedAt: "2026-10-16",
      rounds: {},
      data: {
        ...first,
        sources: {
          ...first.sources,
          snapshotId: "skillselect-2026-09-30",
          checkedAt: "2026-10-16",
        },
      },
    };
    const data = buildDataSection({ ...base, previousFacts });
    expect(data.sources.previous).toEqual({
      month: "2026-09",
      snapshotId: "skillselect-2026-09-30",
      checkedAt: "2026-10-16",
    });
    // Last month's spotlight is skipped.
    expect(data.spotlight.code).not.toBe("254499");
  });

  it("uses a founder spotlight", () => {
    const data = buildDataSection({ ...base, spotlight: "241111" });
    expect(data.spotlight).toMatchObject({
      code: "241111",
      pickedBy: "founder",
    });
  });

  it("drops occupations marked lastAsAt from every sum and pick (R6)", () => {
    const m = manifest();
    const marked: Manifest = {
      ...m,
      occupations: m.occupations.map((o) =>
        o.code === "254499"
          ? { ...o, lastAsAt: "2026-09", lastCheckedAt: "2026-10-16" }
          : o,
      ),
    };
    const data = buildDataSection({ ...base, manifest: marked });
    expect(data.spotlight.code).not.toBe("254499");
    expect(data.movers.fell.map((x) => x.code)).not.toContain("254499");
    expect(data.national["189"].submitted.current.min).toBe(166555 - 4280);
    expect(() =>
      buildDataSection({ ...base, manifest: marked, spotlight: "254499" }),
    ).toThrow();
  });

  it("refuses a month other than the manifest's", () => {
    expect(() => buildDataSection({ ...base, month: "2026-09" })).toThrow(
      /2026-10/,
    );
  });
});
