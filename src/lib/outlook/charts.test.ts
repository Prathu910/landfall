import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore, loadOccupationDetail } from "../data/load-server";
import type { Profile } from "../migration";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { cutoffColumns, queueView } from "./charts";
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
  const core = loadOccupationCore(profile.occupation);
  const detail = loadOccupationDetail(profile.occupation);
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

function queue(id: ScenarioId) {
  const s = setup(id);
  return queueView(s.core, s.detail, s.points, s.profile.eoiDate, s.closed);
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

describe("queueView", () => {
  it("shows Priya's pool at 40 EOIs a square", () => {
    const view = queue("middle");
    expect(view?.kind).toBe("pool");
    expect(view?.unit).toBe(40);
    expect(view?.title).toBe("Who's in the queue");
    expect(view?.groups.map((g) => g.squares)).toEqual([3, 46, 58]);
    expect(view?.groups.map((g) => g.label)).toEqual([
      "Ahead: 107–126",
      "Tied with you: 1,841",
      "Behind: about 2,320",
    ]);
    expect(view?.groups.map((g) => g.emphasis)).toEqual([false, true, false]);
    expect(view?.aria).toBe(
      "107 to 126 ahead, 1,841 tied, about 2,320 behind.",
    );
  });

  it("puts Aarav first in line", () => {
    const view = queue("strong");
    expect(view?.groups.map((g) => [g.key, g.squares])).toEqual([
      ["ahead", 0],
      ["tied", 0],
      ["you", 1],
      ["behind", 107],
    ]);
    expect(view?.groups[3].label).toBe("Behind: 4,280");
  });

  it("uses 100 EOIs a square for Meera", () => {
    expect(queue("long")?.unit).toBe(100);
  });

  it("calls Rahul's queue one that isn't moving", () => {
    const view = queue("notinv");
    expect(view?.title).toBe("A queue that isn't moving");
    expect(view?.aria).toContain("isn't being invited");
  });

  it("splits Kavya's lodged place into four groups", () => {
    const view = queue("lodged");
    expect(view?.kind).toBe("lodged");
    expect(view?.title).toMatch(/^Your place at \d+$/);
    expect(view?.groups.map((g) => g.key)).toEqual([
      "higher",
      "earlier",
      "month",
      "later",
    ]);
    expect(view?.groups[2].emphasis).toBe(true);
    expect(view?.groups[1].label).toMatch(/^At \d+, earlier: about /);
    expect(JSON.stringify(view)).not.toMatch(BANNED);
  });

  it("returns null without a core or a 189 pool", () => {
    const s = setup("middle");
    expect(queueView(null, null, s.points, "", false)).toBeNull();
    expect(queue("nodata")).toBeNull();
  });
});
