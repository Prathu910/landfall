import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { frozenCore, frozenIndex } from "../data/__fixtures__/frozen-2026-10";
import type { RoundsFile } from "../data/rounds-file";
import type { OccupationCore } from "../data/types";
import type { FederalList } from "../state-outlook/rules-types";
import { guaranteedChange, pickSpotlight } from "./spotlight";

const rounds = JSON.parse(
  readFileSync(
    path.resolve(__dirname, "__fixtures__/rounds-2026-10.json"),
    "utf8",
  ),
) as RoundsFile;
const federal = JSON.parse(
  readFileSync(
    path.resolve(
      process.cwd(),
      "src/data/state-rules/federal-occupations.json",
    ),
    "utf8",
  ),
) as FederalList;
const cores = frozenIndex()
  .map((entry) => frozenCore(entry.code))
  .filter((core): core is OccupationCore => core !== null);
const base = {
  cores,
  month: "2026-10",
  previousCode: null,
  override: null,
  rounds,
  federal,
};

describe("guaranteedChange", () => {
  it("is the smaller absolute end of the change interval", () => {
    expect(
      guaranteedChange({ min: 4280, max: 4280 }, { min: 7500, max: 7500 }),
    ).toBe(3220);
    expect(
      guaranteedChange({ min: 2730, max: 2730 }, { min: 0, max: 19 }),
    ).toBe(2711);
  });
  it("is 0 when the interval holds 0", () => {
    expect(guaranteedChange({ min: 0, max: 19 }, { min: 0, max: 19 })).toBe(0);
    expect(guaranteedChange({ min: 5, max: 5 }, { min: 5, max: 5 })).toBe(0);
  });
});

describe("pickSpotlight, 2026-10", () => {
  const s = pickSpotlight(base);
  it("picks the biggest guaranteed change among the 20 most popular", () => {
    expect(s).toMatchObject({
      code: "254499",
      pickedBy: "auto",
      qualifiedBy: { series: "SUBMITTED-189", guaranteed: 3220 },
    });
    expect(s.qualifiedBy?.change).toEqual({ min: -3220, max: -3220 });
  });
  it("fills the card from the published counts", () => {
    expect(s.card.pool189).toEqual({ current: "4280", previous: "7500" });
    expect(s.card.invited189).toEqual({ current: "2730", previous: "<20" });
    expect(s.card.top190).toEqual([
      { state: "VIC", floor: 337 },
      { state: "NSW", floor: 327 },
      { state: "QLD", floor: 260 },
      { state: "WA", floor: 253 },
    ]);
    expect(s.card.tieBreak).toBe("2025-11-19");
    expect(s.card.latest189).toEqual({
      kind: "listed",
      date: "2026-10-15",
      cutoff: 70,
    });
    expect(s.card.rounds.map((r) => r.date)).toEqual(
      rounds.rounds.map((r) => r.date),
    );
  });
  it("skips last month's spotlight", () => {
    expect(pickSpotlight({ ...base, previousCode: "254499" }).code).toBe(
      "241111",
    );
  });
  it("uses a founder override and rejects an unknown code", () => {
    const f = pickSpotlight({ ...base, override: "241111" });
    expect(f).toMatchObject({ code: "241111", pickedBy: "founder" });
    expect(() => pickSpotlight({ ...base, override: "000000" })).toThrow(
      /not in 2026-10/,
    );
  });
  it("keeps the last six rounds only", () => {
    const many: RoundsFile = {
      ...rounds,
      rounds: Array.from({ length: 8 }, (_, i) => ({
        ...rounds.rounds[0],
        date: `2026-0${8 - i}-10`,
      })),
    };
    const r = pickSpotlight({ ...base, month: "2026-10", rounds: many });
    expect(r.card.rounds).toHaveLength(6);
    expect(r.card.rounds[0].date).toBe("2026-08-10");
  });
  it("ignores rounds dated after the month", () => {
    const later: RoundsFile = {
      ...rounds,
      rounds: [
        { ...rounds.rounds[0], date: "2026-11-12", rows: [] },
        ...rounds.rounds,
      ],
    };
    expect(pickSpotlight({ ...base, rounds: later }).card.rounds[0].date).toBe(
      "2026-10-15",
    );
  });
  it("ignores cores that dropped out of the data", () => {
    const dropped = { ...frozenCore("254499")!, asAt: "2026-09" };
    const rest = cores.filter((c) => c.code !== "254499");
    expect(pickSpotlight({ ...base, cores: [...rest, dropped] }).code).toBe(
      "241111",
    );
    expect(() =>
      pickSpotlight({ ...base, cores: [...rest, dropped], override: "254499" }),
    ).toThrow();
  });
  it("skips a series whose previous month was not fetched", () => {
    const stripped = cores.map((core) => ({
      ...core,
      statusHistory: Object.fromEntries(
        Object.entries(core.statusHistory).map(([visa, months]) => [
          visa,
          Object.fromEntries(
            Object.entries(months ?? {}).filter(([m]) => m !== "2026-09"),
          ),
        ]),
      ),
    }));
    const r = pickSpotlight({ ...base, cores: stripped });
    expect(r.qualifiedBy).toBeNull();
  });
  it("falls back to the most popular occupation, little changed, when nothing moved", () => {
    const flat = cores.map((core) => ({
      ...core,
      statusHistory: Object.fromEntries(
        Object.entries(core.statusHistory).map(([visa, months]) => [
          visa,
          { ...months, "2026-09": months?.["2026-10"] ?? {} },
        ]),
      ),
    }));
    const r = pickSpotlight({ ...base, cores: flat });
    expect(r.qualifiedBy).toBeNull();
    expect(r.pickedBy).toBe("auto");
    expect(r.code).toBe(
      [...cores]
        .map((c) => ({
          code: c.code,
          floor: (["189", "190", "491"] as const).reduce(
            (n, v) => n + Number(c.pool[v]?.total.replace("<20", "0") ?? 0),
            0,
          ),
        }))
        .sort((a, b) => b.floor - a.floor || (a.code < b.code ? -1 : 1))[0]
        .code,
    );
  });
});
