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
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput } from "./evaluate-profile";
import { buildImprove } from "./improve";
import { queueView } from "./queue-view";

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

describe("queueView edge cases", () => {
  it("shows masked lodged groups as under 20, never 'about'", () => {
    const s = setup("lodged");
    const detail = structuredClone(s.detail);
    if (!detail) throw new Error("no detail");
    detail.cohortsByScore["189"] = {
      [String(s.points)]: { "2026-03": "<20", "2026-05": "<20" },
    };
    const view = queueView(s.core, detail, s.points, s.profile.eoiDate, false);
    const labels = view?.groups.map((g) => g.label) ?? [];
    expect(labels[2]).toBe("Your month: under 20");
    expect(labels[3]).toBe(`At ${s.points}, later: under 20`);
    expect(JSON.stringify(view)).not.toMatch(/about (under|0|<)/);
  });

  it("reads summed masked earlier months as under, never 0–", () => {
    const s = setup("lodged");
    const detail = structuredClone(s.detail);
    if (!detail) throw new Error("no detail");
    detail.cohortsByScore["189"] = {
      [String(s.points)]: { "2025-12": "<20", "2026-01": "<20" },
    };
    const view = queueView(s.core, detail, s.points, s.profile.eoiDate, false);
    const earlier = view?.groups.find((g) => g.key === "earlier");
    expect(earlier?.label).toBe(`At ${s.points}, earlier: under 39`);
    expect(JSON.stringify(view)).not.toContain("0–");
  });

  it("keeps the not-moving wording when you are first in line", () => {
    const s = setup("strong");
    const view = queueView(s.core, s.detail, s.points, "", true);
    expect(view?.groups.some((g) => g.key === "you")).toBe(true);
    expect(view?.aria).toContain("isn't being invited");
  });
});
