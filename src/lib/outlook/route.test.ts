import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput } from "./evaluate-profile";
import { buildImprove } from "./improve";
import { buildRoute } from "./route";
import type { Route } from "./route";

const AS_OF = "2026-11-21";
const RULES = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};
const BANNED =
  /guarantee|definitely|will be invited|%|chances? of|likely to be invited|some invitations|a few/i;

function run(id: ScenarioId): Route {
  const profile = SCENARIOS[id];
  const input: OutlookInput = {
    profile,
    asOf: AS_OF,
    core: loadOccupationCore(profile.occupation),
    detail: null,
    rules: RULES,
  };
  const outlook = evaluateProfile(input);
  return buildRoute(input, outlook, buildImprove(input, outlook));
}

const titles = (route: Route) => route.steps.map((s) => s.title);

describe("buildRoute", () => {
  it("Aarav: very strong 189 ends in an invitation", () => {
    const route = run("strong");
    expect(titles(route)).toEqual([
      "Today",
      "Submit EOI",
      "Gather documents",
      "Invitation",
    ]);
    expect(route.steps[0]).toMatchObject({
      sub: "21 Nov 2026",
      points: 90,
      label: "very-strong",
    });
    expect(route.steps[1].sub).toBe("189 + NSW 190, now");
    expect(route.steps[3].sub).toBe("60 days to lodge");
    expect(route.deadlines).toEqual([
      {
        date: "2027-08-09",
        title: "Turns 33: −5",
        sub: "9 Aug 2027",
        afterStep: 2,
      },
      {
        date: "2028-02-02",
        title: "English test expires",
        sub: "2 Feb 2028",
        afterStep: 2,
      },
    ]);
  });

  it("Priya: competitive 189 shows the biggest improvement", () => {
    const route = run("middle");
    expect(titles(route)).toEqual([
      "Today",
      "Submit EOI",
      "Superior English",
      "Update your EOI",
    ]);
    expect(route.steps[0]).toMatchObject({ points: 70, label: "competitive" });
    expect(route.steps[2]).toMatchObject({ points: 80, label: "very-strong" });
    expect(route.deadlines[0]).toMatchObject({
      title: "Turns 33: −5",
      afterStep: 2,
    });
  });

  it("Rahul: 189 closed takes the state route", () => {
    const route = run("notinv");
    expect(titles(route)).toEqual([
      "Today",
      "Check state rules",
      "Submit EOI",
      "Keep 189 ticked",
    ]);
    expect(route.steps[0]).toMatchObject({ points: 85, label: "not-invited" });
    expect(route.steps[1].sub).toBe("Northern Territory and Tasmania");
    expect(route.steps[2].sub).toBe(
      "190 Northern Territory + 491 Northern Territory",
    );
    expect(route.deadlines[0].title).toBe("English test expires");
  });

  it("Arjun: below 65 submits for the state visa, then retakes English", () => {
    const route = run("below");
    expect(titles(route)).toEqual([
      "Today",
      "Submit EOI",
      "English retake",
      "Update your EOI",
    ]);
    expect(route.steps[1].sub).toBe("190 Tasmania + 491 South Australia");
    expect(route.steps[2]).toMatchObject({ points: 80, label: "very-strong" });
  });

  it("Kavya: a lodged EOI shows days waiting and the EOI expiry", () => {
    const route = run("lodged");
    expect(titles(route)).toEqual([
      "EOI submitted",
      "Today",
      "Superior English",
      "Invitation",
    ]);
    expect(route.steps[0]).toMatchObject({ sub: "12 Mar 2026", points: 70 });
    expect(route.steps[1].sub).toBe("254 days waiting");
    expect(route.steps[2].points).toBe(80);
    expect(route.deadlines).toEqual([
      expect.objectContaining({ title: "EOI expires", afterStep: 2 }),
    ]);
  });

  it("Dev: nothing suits keeps the EOI in and watches listing states", () => {
    const route = run("none");
    expect(titles(route)).toEqual([
      "Today",
      "Keep your EOI in",
      "Check other occupations",
      "Watch SA and WA",
    ]);
    expect(route.deadlines[0]).toMatchObject({
      title: "English test expires",
      afterStep: 2,
    });
  });

  it("Sana: no data checks the listing state, then waits", () => {
    const route = run("nodata");
    expect(titles(route)).toEqual([
      "Today",
      "Check WA's program",
      "Submit EOI",
      "Wait for a state",
    ]);
    expect(route.steps[0].label).toBe("no-data");
  });

  it("Meera: a long 189 wait keeps 189 and adds the state", () => {
    const route = run("long");
    expect(titles(route).slice(0, 2)).toEqual(["Today", "Submit EOI"]);
    expect(route.steps[1].sub).toContain("189");
  });

  it("uses no banned phrases in any scenario", () => {
    for (const id of Object.keys(SCENARIOS) as ScenarioId[]) {
      expect(JSON.stringify(run(id))).not.toMatch(BANNED);
    }
  });
});
