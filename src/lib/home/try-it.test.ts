import { AT_SCORE_LABEL, EOI_CAVEAT } from "../report/scorecard";
import { describe, expect, it } from "vitest";
import { coreFixture } from "../data/__fixtures__/occupation";
import { poolPosition } from "../data/pool-position";
import { loadOccupationCore } from "../data/load-server";
import { toPoolOccupation } from "../data/legacy";
import type { OccupationCore } from "../data/types";
import { comparePool, formatInterval } from "../pool";
import { countInSentence, BANNED_COPY } from "../report/copy";
import { buildRounds } from "../report/panel-189";
import { CHIP_LABEL } from "../report/round-status";
import {
  TRY_IT_DEFAULT,
  TRY_IT_LOAD_FAILED,
  TRY_IT_NO_DATA,
  TRY_IT_OCCUPATION,
  TRY_IT_POINTS,
  TRY_IT_ROW_LABELS,
  buildTryIt,
} from "./try-it";

function withPool(
  byScore: Record<string, string>,
  rounds: OccupationCore["rounds189"] = coreFixture.rounds189,
): OccupationCore {
  return {
    ...coreFixture,
    pool: { "189": { total: "150", byScore } },
    rounds189: rounds,
  };
}

describe("try-it points", () => {
  it("runs 65 to 140 in steps of 5 and defaults to 85", () => {
    expect(TRY_IT_POINTS[0]).toBe(65);
    expect(TRY_IT_POINTS.at(-1)).toBe(140);
    expect(TRY_IT_POINTS).toHaveLength(16);
    expect(TRY_IT_POINTS).toContain(TRY_IT_DEFAULT);
    expect(TRY_IT_DEFAULT).toBe(75);
  });
});

describe("try-it wording", () => {
  it("keeps the load-failure message distinct from the no-data message", () => {
    expect(TRY_IT_LOAD_FAILED).not.toBe(TRY_IT_NO_DATA);
    expect(TRY_IT_LOAD_FAILED).toBe(
      "Couldn't load the published data for this occupation. Reload the page or choose another occupation.",
    );
    // There is no retry control, so the message must not offer one.
    expect(TRY_IT_LOAD_FAILED).not.toMatch(/try again/i);
  });

  it("has the three row labels", () => {
    expect(TRY_IT_ROW_LABELS.same).toBe(AT_SCORE_LABEL);
    expect(TRY_IT_ROW_LABELS).toEqual({
      higher: "EOIs with a higher score (189)",
      same: "At your score",
      latestRound: "Latest 189 round",
    });
  });

  it("composes the note and source in the view-model", () => {
    const view = buildTryIt(coreFixture, 85);
    if (view.kind !== "data") throw new Error("expected data");
    expect(view.note).toBe(
      `${EOI_CAVEAT} ${view.poolTotal} EOIs in the 189 pool.`,
    );
    expect(view.source).toBe(`SkillSelect, as at ${view.asAt}.`);
    expect(`${view.note} ${view.source}`).not.toMatch(BANNED_COPY);
  });
});

describe("buildTryIt", () => {
  const none = {
    kind: "none",
    message: "No published 189 data for this occupation",
  };

  it("reports no data", () => {
    expect(buildTryIt(null, 85)).toEqual(none);
    expect(buildTryIt({ ...coreFixture, pool: {} }, 85)).toEqual(none);
  });

  it("says 189 isn't available off the Home Affairs 189 list", () => {
    const offList = {
      kind: "none",
      message:
        "189 isn't available for this occupation: it isn't on the Home Affairs list for 189",
    };
    expect(buildTryIt(null, 85, false)).toEqual(offList);
    expect(buildTryIt({ ...coreFixture, pool: {} }, 85, false)).toEqual(
      offList,
    );
    expect(buildTryIt({ ...coreFixture, pool: {} }, 85, null)).toEqual(none);
  });

  it("keeps masked counts as intervals", () => {
    const view = buildTryIt(withPool({ "85": "100", "90": "<20" }), 85);
    if (view.kind !== "data") throw new Error("expected data");
    expect(view.higher).toBe(countInSentence({ min: 0, max: 19 }));
    expect(view.higher).toContain("may be zero");
    expect(view.same).toBe("100");
  });

  it("never renders a null cut-off as zero", () => {
    const view = buildTryIt(
      withPool({ "85": "100" }, [{ date: "2026-10-15", cutoff: null }]),
      85,
    );
    if (view.kind !== "data") throw new Error("expected data");
    expect(view.latestRound).toContain("Not listed");
    expect(view.latestRound).not.toMatch(/\b0\b/);
    expect(view.roundStatus).toBe(CHIP_LABEL.none);
  });

  it("uses the report's rounds wording for the newest round", () => {
    const view = buildTryIt(coreFixture, 85);
    if (view.kind !== "data") throw new Error("expected data");
    const tile = buildRounds(coreFixture, []).tiles[0];
    expect(view.latestRound).toBe(`${tile.value}, ${tile.label}`);
  });

  it("on real data matches the report's pool comparison", () => {
    const core = loadOccupationCore("261313");
    const pool = core && toPoolOccupation(core);
    if (!core || !pool) throw new Error("fixture occupation missing");
    const view = buildTryIt(core, 85);
    if (view.kind !== "data") throw new Error("expected data");
    const cmp = comparePool(pool, 85);
    expect(view.higher).toBe(countInSentence(cmp.higher));
    expect(view.same).toBe(countInSentence(cmp.same));
    if (cmp.higher.min === cmp.higher.max) {
      expect(view.higher).toBe(formatInterval(cmp.higher));
    }
    expect(Object.values(CHIP_LABEL)).toContain(view.roundStatus);
    expect(view.latestRound).not.toBe("");
    expect(view.asAt).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
  });

  it("opens on an occupation with recent 189 invitations at or below the default points", () => {
    // A data refresh that turns this negative should prompt a new default.
    const core = loadOccupationCore(TRY_IT_OCCUPATION);
    if (!core) throw new Error("default occupation missing");
    const view = buildTryIt(core, TRY_IT_DEFAULT);
    if (view.kind !== "data") throw new Error("expected data");
    expect(view.roundStatus).toBe(CHIP_LABEL.regular);
    const cutoff = core.rounds189[0]?.cutoff;
    expect(cutoff).not.toBeNull();
    expect(cutoff!).toBeLessThanOrEqual(TRY_IT_DEFAULT);
  });

  it("reads the published pool total exactly as the report does", () => {
    const core = loadOccupationCore("261313");
    if (!core) throw new Error("fixture occupation missing");
    const view = buildTryIt(core, 85);
    const position = poolPosition(core, null, "189", 85, null);
    if (view.kind !== "data" || !position.available) throw new Error("no data");
    expect(view.poolTotal).toBe(countInSentence(position.total));
    expect(view.higher).toBe(countInSentence(position.higher));
    expect(view.same).toBe(countInSentence(position.same));
  });

  it("uses the published total, not the sum of masked score rows", () => {
    const core: OccupationCore = {
      ...coreFixture,
      pool: { "189": { total: "40", byScore: { "85": "<20", "90": "<20" } } },
    };
    const view = buildTryIt(core, 85);
    if (view.kind !== "data") throw new Error("expected data");
    expect(view.poolTotal).toBe("40");
  });

  it("uses only allowed copy", () => {
    const views = [
      buildTryIt(coreFixture, 85),
      buildTryIt(withPool({ "85": "<20", "90": "<20" }), 85),
      buildTryIt(null, 85),
    ];
    for (const view of views) {
      for (const text of Object.values(view)) {
        expect(text).not.toMatch(BANNED_COPY);
        expect(text).not.toContain("%");
      }
    }
  });
});
