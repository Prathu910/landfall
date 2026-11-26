import { describe, expect, it } from "vitest";
import { frozenCore } from "../data/__fixtures__/frozen-2026-10";
import { directoryAnswer, largest189Pools } from "./directory";

const nurse = frozenCore("254499")!;
const software = frozenCore("261313")!;

describe("largest189Pools", () => {
  const entries = [
    { core: nurse, path: "/n/" },
    { core: software, path: "/s/" },
    {
      core: {
        ...nurse,
        code: "999999",
        name: "Masked",
        pool: { "189": { total: "<20" as const, byScore: {} } },
      },
      path: "/m/",
    },
  ];
  it("ranks exact 189 pools, largest first, and never ranks a masked total", () => {
    const pools = largest189Pools(entries);
    expect(pools.map((p) => p.code)).toEqual(["261313", "254499"]);
    expect(pools[0].pool).toBe(9464);
  });
  it("gives the latest cut-off in the last four rounds, or null when not listed in them", () => {
    const [software189, nurse189] = largest189Pools(entries);
    expect(software189.latest).toBeNull();
    expect(nurse189.latest).toEqual({ date: "2026-10-15", cutoff: 70 });
  });
});

describe("directoryAnswer", () => {
  it("states the snapshot, the occupations with data and the latest round", () => {
    expect(
      directoryAnswer({
        total: 493,
        withData: 479,
        asAt: "2026-10-31",
        round: { date: "2026-10-15", occupations: 159 },
      }),
    ).toBe(
      "493 occupations are in the 31 Oct 2026 SkillSelect snapshot, 479 with published data; the latest 189 round, on 15 Oct 2026, listed 159 occupations.",
    );
    expect(
      directoryAnswer({
        total: 2,
        withData: 1,
        asAt: "2026-10-31",
        round: null,
      }),
    ).toBe(
      "2 occupations are in the 31 Oct 2026 SkillSelect snapshot, 1 with published data.",
    );
  });
});
