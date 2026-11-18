import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import type { StateCode, StateVisa } from "../data/types";
import { sampleProfile, type Profile } from "../migration";
import {
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
const POINTS: Record<StateVisa, number> = { "190": 95, "491": 105 };
const data: StateRuleData = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};
// The /sample/ profile: ICT Business Analyst living in Victoria.
const aarav: Profile = {
  ...sampleProfile,
  onshore: true,
  state: "VIC",
  visaExpiry: "2027-09-30",
};
// A registered nurse living in Queensland who has answered nothing extra.
const nurse: Profile = { ...aarav, occupation: "254418", state: "QLD" };

function build(profile: Profile, ruleData = data): StateOutlookView {
  const core = loadOccupationCore(profile.occupation);
  if (!core) throw new Error(`no core for ${profile.occupation}`);
  return buildStateOutlookView({
    core,
    profile,
    asOf: AS_OF,
    points: POINTS,
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

  it("asks only the questions that would change a tile, worded for the user's state", () => {
    const fields = build(nurse).questions.map((q) => q.field);
    expect(fields).toEqual([
      "monthsLivingInState",
      "monthsWorkingInState",
      "yearsExperienceLast10",
      "studyState",
    ]);
    expect(build(nurse).questions[0].text).toContain("Queensland");
  });

  it("moves a tile out of Needs your answers once its question is answered", () => {
    const before = build(nurse);
    const after = build({ ...nurse, yearsExperienceLast10: 8 });
    expect(groupOf(before, "491", "WA")).toBe("needs-answers");
    expect(groupOf(after, "491", "WA")).not.toBe("needs-answers");
    expect(after.questions.map((q) => q.field)).not.toContain(
      "yearsExperienceLast10",
    );
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
});
