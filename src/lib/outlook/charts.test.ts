import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { frozenCore, frozenDetail } from "../data/__fixtures__/frozen-2026-10";
import type { Profile } from "../migration";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { cutoffColumns } from "./charts";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput } from "./evaluate-profile";
import { buildImprove } from "./improve";

const AS_OF = "2026-11-21";
const RULES = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};
const BANNED =
  /guarantee|definitely|will be invited|%|chances? of|likely to be invited|some invitations|a few|<20/i;

function setup(id: ScenarioId) {
  const profile: Profile = SCENARIOS[id];
  const core = frozenCore(profile.occupation);
  const detail = frozenDetail(profile.occupation);
  const input: OutlookInput = {
    profile,
    asOf: AS_OF,
    core,
    detail,
    rules: RULES,
  };
  const outlook = evaluateProfile(input);
  const points = outlook.points.base;
  const improve = buildImprove(input, outlook);
  const closed = outlook.v189.label === "not-invited";
  return { core, detail, profile, points, improve, closed };
}

describe("cutoffColumns", () => {
  it("lists Priya's last six cut-offs oldest first with a target", () => {
    const s = setup("middle");
    const view = cutoffColumns(s.core, s.points, s.improve);
    expect(view?.columns).toEqual([
      { month: "Sep 24", cutoff: 75 },
      { month: "Nov 24", cutoff: 70 },
      { month: "Aug 25", cutoff: 80 },
      { month: "Nov 25", cutoff: 75 },
      { month: "Jun 26", cutoff: 75 },
      { month: "Oct 26", cutoff: 70 },
    ]);
    expect(view?.you).toBe(70);
    expect(view?.target).toEqual({
      points: 80,
      label: "With Superior English, 80",
    });
    expect(view?.pass).toBeNull();
    expect(view?.aria).toContain("Oct 26 70");
    expect(view?.aria).not.toMatch(BANNED);
  });

  it("keeps not-listed rounds as null for Rahul and sets no target", () => {
    const s = setup("notinv");
    const view = cutoffColumns(s.core, s.points, s.improve);
    expect(view?.columns.slice(-4).map((c) => c.cutoff)).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect(view?.aria).toContain("not listed");
  });

  it("adds the pass mark below 65 points", () => {
    const s = setup("below");
    expect(cutoffColumns(s.core, s.points, s.improve)?.pass).toBe(65);
  });

  it("has no target when no move is best", () => {
    const s = setup("strong");
    expect(cutoffColumns(s.core, s.points, s.improve)?.target).toBeNull();
  });

  it("returns null without a core or without any listed round", () => {
    const s = setup("middle");
    expect(cutoffColumns(null, s.points, s.improve)).toBeNull();
    const none = setup("nodata");
    expect(cutoffColumns(none.core, none.points, none.improve)).toBeNull();
  });
});
