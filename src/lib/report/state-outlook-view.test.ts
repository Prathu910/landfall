import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import type { StateCode, StateVisa } from "../data/types";
import {
  calculatePoints,
  sampleProfile,
  type PointsResult,
  type Profile,
} from "../migration";
import { resetStateRelativeAnswers } from "../state-answers";
import {
  cases,
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import type { Group } from "../state-outlook/outlook";
import { BANNED_COPY } from "./copy";
import {
  buildStateOutlookView,
  type StateOutlookView,
  type StateRuleData,
} from "./state-outlook-view";

// Fixed date: the rules were checked on 17 Nov 2026, so none is stale.
const AS_OF = "2026-11-17";
// The sample's points check, with a skills assessment date so it is complete.
const POINTS: PointsResult = {
  ...calculatePoints({ ...sampleProfile, assessmentDate: "2026-02-20" }, AS_OF),
  subclass190: 95,
  subclass491: 105,
};
const data: StateRuleData = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};
// The sample's answers as an ICT Business Analyst living in Victoria.
const aarav: Profile = {
  ...sampleProfile,
  occupation: "261111",
  onshore: true,
  state: "VIC",
  visaExpiry: "2027-09-30",
};
// A registered nurse living in Queensland who has answered nothing extra.
const nurse: Profile = { ...aarav, occupation: "254418", state: "QLD" };

function build(
  profile: Profile,
  ruleData = data,
  points = POINTS,
): StateOutlookView {
  const core = loadOccupationCore(profile.occupation);
  if (!core) throw new Error(`no core for ${profile.occupation}`);
  return buildStateOutlookView({
    core,
    profile,
    asOf: AS_OF,
    points,
    data: ruleData,
  });
}

function groupOf(view: StateOutlookView, visa: StateVisa, state: StateCode) {
  const tile = view.tilesByVisa[visa].find((t) => t.state === state);
  if (!tile) throw new Error(`no ${state} tile for ${visa}`);
  return tile.group;
}

function groupsOf(view: StateOutlookView, visa: StateVisa): Group[] {
  return view.tilesByVisa[visa].map((t) => t.group);
}

describe("buildStateOutlookView", () => {
  it("builds eight tiles and eight matching panels for each visa", () => {
    const view = build(aarav);
    for (const visa of ["190", "491"] as const) {
      const tiles = view.tilesByVisa[visa];
      const panels = view.panelsByVisa[visa];
      expect(tiles).toHaveLength(8);
      expect(panels.map((p) => `#${p.id}`)).toEqual(tiles.map((t) => t.href));
    }
  });

  it("opens on 190, with a dated subtitle about evidence", () => {
    const view = build(aarav);
    expect(view.defaultVisa).toBe("190");
    expect(view.subtitle).toBe(
      "How each state's 2026–27 nomination rules read against your answers, beside the invitations each state published at or below your points (SkillSelect, as at Oct 2026). The groups describe published evidence, not your chances.",
    );
  });

  it("keeps the browser-unverified states unverified and NSW 491 closed for the sample", () => {
    const view = build(aarav);
    for (const visa of ["190", "491"] as const) {
      for (const state of ["VIC", "ACT", "TAS", "NT"] as const) {
        expect(groupOf(view, visa, state)).toBe("unverified");
      }
    }
    expect(groupOf(view, "491", "NSW")).toBe("not-open");
  });

  it("gives each visa its outlook's summary and an any-state tile", () => {
    const view = build(aarav);
    for (const visa of ["190", "491"] as const) {
      expect(view.summaryByVisa[visa]).toMatch(/evidence/);
      expect(view.anyStateByVisa[visa].label).toBe("Any state");
    }
  });

  it("asks the questions that would change a tile, plus answered ones, worded for the user's state", () => {
    const fields = build(nurse).questions.map((q) => q.field);
    expect(fields).toEqual([
      "monthsLivingInState",
      "monthsWorkingInState",
      "yearsExperienceLast10",
      // Answered in the main check, and used by a state's rules.
      "visaExpiry",
    ]);
    expect(build(nurse).questions[0].text).toContain("Queensland");
  });

  it("moves a tile out of Needs your answers once its question is answered", () => {
    const before = build(nurse);
    const after = build({ ...nurse, yearsExperienceLast10: 8 });
    expect(groupOf(before, "491", "WA")).toBe("needs-answers");
    expect(groupOf(after, "491", "WA")).not.toBe("needs-answers");
  });

  it("puts no state in a pass group for a points check that fails on age (ruling P27)", () => {
    // A real WA 491 pass at 75 points before the baseline check existed.
    const older: Profile = {
      ...aarav,
      occupation: "331212",
      state: "NSW",
      dob: "1979-06-01",
      assessmentDate: "2026-02-20",
    };
    const points = calculatePoints(older, AS_OF);
    expect(points.eligible).toBe(false);
    const view = build(older, data, points);
    for (const visa of ["190", "491"] as const) {
      expect(groupsOf(view, visa)).not.toContain("strongest");
      expect(groupsOf(view, visa)).not.toContain("watching");
    }
    const wa = view.tilesByVisa["491"].find((t) => t.state === "WA");
    expect(wa).toMatchObject({
      group: "not-open",
      fragment: "Your points check shows age 45 or over",
    });
  });

  it("asks for a missing English test date in place, and restores the outlook once it is given (ruling P32)", () => {
    const nurse: Profile = {
      ...cases[1].profile,
      assessmentDate: "2026-02-20",
      englishDate: "",
    };
    const unknown = calculatePoints(nurse, AS_OF);
    expect(unknown.eligible).toBeNull();
    const before = build(nurse, data, unknown);
    expect(groupOf(before, "190", "QLD")).toBe("needs-answers");
    const question = before.questions.find((q) => q.field === "englishDate");
    expect(question).toMatchObject({
      kind: "date",
      affectsText: "Affects: every state and territory",
    });
    const line = before.panelsByVisa["190"]
      .find((p) => p.id === "state-190-QLD")
      ?.canApply.find((l) => l.text === "Add your English test date");
    expect(line).toMatchObject({
      mark: "?",
      checkedNote: "From your points check",
    });
    const answered = { ...nurse, englishDate: "2025-02-02" };
    const after = build(answered, data, calculatePoints(answered, AS_OF));
    expect(groupOf(after, "190", "QLD")).toBe("strongest");
  });

  it("makes every tile Not yet verified when the federal list is unavailable", () => {
    const view = build(aarav, { ...data, federal: null });
    for (const visa of ["190", "491"] as const) {
      expect(new Set(groupsOf(view, visa))).toEqual(new Set(["unverified"]));
    }
  });

  it("still builds a panel for a state with no recorded rules", () => {
    const withoutVic = {
      ...data,
      rules: {
        ...stateRules,
        rules: stateRules.rules.filter((r) => r.state !== "VIC"),
      },
    };
    const view = build(aarav, withoutVic);
    const panel = view.panelsByVisa["190"].find(
      (p) => p.id === "state-190-VIC",
    );
    expect(panel?.canApply).toEqual([
      {
        key: "no-rules",
        text: "Rules not recorded for 190",
        mark: "?",
        checkedNote: "Not yet verified on the official page",
      },
    ]);
    expect(panel?.footer).toBe(
      "Not advice to apply. Rules change; check the official page.",
    );
  });

  it("uses no banned copy in any visible text", () => {
    // Official page addresses are not copy ("…-for-onshore-applicants").
    const withoutUrls = (key: string, value: unknown) =>
      key === "source" || key === "href" ? undefined : value;
    for (const profile of [aarav, nurse]) {
      const text = JSON.stringify(build(profile), withoutUrls);
      expect(text).not.toMatch(BANNED_COPY);
    }
  });

  it("never reads months lived in one state as months in another after a state change", () => {
    const inQld: Profile = {
      ...nurse,
      monthsLivingInState: 14,
      monthsWorkingInState: 14,
    };
    expect(groupOf(build(inQld), "190", "QLD")).toBe("strongest");
    const moved = resetStateRelativeAnswers(inQld, { ...inQld, state: "NSW" });
    const view = build(moved);
    expect(groupOf(view, "190", "NSW")).not.toBe("strongest");
    expect(groupOf(view, "190", "NSW")).not.toBe("watching");
  });

  it("keeps a saved answer that settles its rule among the questions, so it can be changed", () => {
    const fields = (profile: Profile) =>
      build(profile).questions.map((q) => q.field);
    const answered = fields({ ...nurse, yearsExperienceLast10: 8 });
    expect(answered).toContain("yearsExperienceLast10");
    const settled = fields({
      ...nurse,
      monthsLivingInState: 14,
      monthsWorkingInState: 14,
    });
    expect(settled).toContain("monthsLivingInState");
    expect(settled).toContain("monthsWorkingInState");
  });

  it("words an answered work question with the state's definition of related work", () => {
    const question = build({
      ...nurse,
      monthsLivingInState: 14,
      monthsWorkingInState: 14,
    }).questions.find((q) => q.field === "monthsWorkingInState");
    expect(question?.text).toContain(
      "one Queensland treats as related (same first 3 ANZSCO digits)",
    );
  });

  it("does not ask an unanswered question whose answer could not change a tile", () => {
    // Where Aarav studied can't change a tile: the WA and SA graduate
    // study rules are held as secondary (ruling P28). The visa expiry is an
    // answer already given.
    expect(build(aarav).questions.map((q) => q.field)).toEqual(["visaExpiry"]);
  });
});
