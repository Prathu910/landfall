import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { frozenCore } from "../data/__fixtures__/frozen-2026-10";
import { stateEvidence } from "../data/state-evidence";
import type {
  MonthKey,
  OccupationCore,
  ScoreCounts,
  StateCode,
  StateVisa,
} from "../data/types";
import { calculatePoints } from "../migration";
import type { Profile } from "../migration";
import {
  ELIGIBLE,
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { stateOutlook } from "../state-outlook/outlook";
import type { Group, Outlook, StateOutcome } from "../state-outlook/outlook";
import { SCENARIOS } from "./__fixtures__/scenarios";
import { evidenceLabel, visaLabel } from "./label-state";
import type { VisaLabel } from "./label-state";

const realCore = (code: string): OccupationCore => {
  const core = frozenCore(code);
  if (!core) throw new Error(`missing core ${code}`);
  return core;
};
const nurse = realCore("254499");

// The synthetic window: last 3 months are Aug–Oct 2026, last 6 are May–Oct.
const AS_AT = "2026-10";
const LAST_SIX = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

function synthetic(
  months: Record<MonthKey, ScoreCounts>,
  state: StateCode = "SA",
): OccupationCore {
  return {
    ...nurse,
    asAt: AS_AT,
    stateInvited: { "190": { [state]: months } },
  };
}

/** Every month of the 6-month window fetched with no rows, then `over`. */
function fetched(over: Record<MonthKey, ScoreCounts>) {
  const empty = Object.fromEntries([...LAST_SIX, AS_AT].map((m) => [m, {}]));
  return { ...empty, ...over };
}

function labelOf(months: Record<MonthKey, ScoreCounts>, points = 90) {
  return evidenceLabel(synthetic(months), "190", "SA", points);
}

describe("evidenceLabel ladder", () => {
  it("20 confirmed at or below with half at or below is strong", () => {
    const r = labelOf(
      fetched({
        "2026-08": { "85": "10" },
        "2026-09": { "90": "10" },
        "2026-10": { "95": "<20" },
      }),
    );
    expect(r.label).toBe("strong");
    expect(r.confirmedAtOrBelow).toBe(20);
    expect(r.monthsAtOrBelow6).toBe(2);
    expect(r.latest).toEqual({
      month: "2026-09",
      count: { min: 10, max: 10 },
    });
  });

  it("20 confirmed but under half at or below (cautious) is competitive", () => {
    const r = labelOf(
      fetched({
        "2026-08": { "85": "10" },
        "2026-09": { "90": "10" },
        // Total max 20 + 19 + 2 = 41 > 2 × 20.
        "2026-10": { "95": "<20", "100": "2" },
      }),
    );
    expect(r.label).toBe("competitive");
  });

  it("19 confirmed at or below is competitive", () => {
    const r = labelOf(fetched({ "2026-10": { "85": "19" } }));
    expect(r.label).toBe("competitive");
    expect(r.confirmedAtOrBelow).toBe(19);
  });

  it("masked at or below in 2 of the last 3 months is competitive", () => {
    const r = labelOf(
      fetched({ "2026-09": { "85": "<20" }, "2026-10": { "80": "<20" } }),
    );
    expect(r.label).toBe("competitive");
    expect(r.confirmedAtOrBelow).toBe(0);
    expect(r.latest).toEqual({ month: "2026-10", count: { min: 0, max: 19 } });
  });

  it("masked in 1 of the last 3 but 3 of the last 6 is long wait", () => {
    const r = labelOf(
      fetched({
        "2026-05": { "85": "<20" },
        "2026-06": { "85": "<20" },
        "2026-10": { "85": "<20" },
      }),
    );
    expect(r.label).toBe("long-wait");
    expect(r.monthsAtOrBelow6).toBe(3);
  });

  it("invitations only above the reader's points is long wait", () => {
    const r = labelOf(fetched({ "2026-09": { "100": "25" } }));
    expect(r.label).toBe("long-wait");
    expect(r.monthsAtOrBelow6).toBe(0);
    expect(r.latest).toBeNull();
  });

  it("nothing in the last 6 months is not invited", () => {
    // An invitation 7 months back is outside the window.
    const r = labelOf(fetched({ "2026-04": { "85": "50" } }));
    expect(r.label).toBe("not-invited");
    expect(r.confirmedAtOrBelow).toBe(0);
  });

  it("no fetched month in the last 6 is no data", () => {
    expect(labelOf({}).label).toBe("no-data");
    expect(labelOf({ "2026-04": { "85": "50" } }).label).toBe("no-data");
    const absent = { ...nurse, asAt: AS_AT, stateInvited: {} };
    expect(evidenceLabel(absent, "190", "SA", 90).label).toBe("no-data");
  });

  it("leaves unfetched months out rather than counting them as zero", () => {
    // Only Sep and Oct fetched; both masked at or below.
    const r = labelOf({
      "2026-09": { "85": "<20" },
      "2026-10": { "85": "<20" },
    });
    expect(r.label).toBe("competitive");
    expect(r.monthsAtOrBelow6).toBe(2);
  });

  it("ignores invitations to any state", () => {
    const core: OccupationCore = {
      ...nurse,
      asAt: AS_AT,
      stateInvited: {
        "190": { ANY: fetched({ "2026-10": { "85": "40" } }), SA: fetched({}) },
      },
    };
    const r = evidenceLabel(core, "190", "SA", 90);
    expect(r.label).toBe("not-invited");
    expect(r).toMatchObject({ state: "SA", visa: "190" });
  });
});

function outcome(
  core: OccupationCore,
  state: StateCode,
  group: Group,
): StateOutcome {
  return {
    state,
    visa: "190",
    group,
    deciding: null,
    streams: [],
    evidence: stateEvidence(core, "190", state, 90).state,
    reasonText: "",
  };
}

function outlookOf(core: OccupationCore, groups: [StateCode, Group][]) {
  const states = groups.map(([state, group]) => outcome(core, state, group));
  const result: Outlook = {
    visa: "190",
    states,
    anyState: stateEvidence(core, "190", "SA", 90).anyState,
    summary: "",
  };
  return visaLabel(result, core, 90);
}

function multiState(byState: Partial<Record<StateCode, ScoreCounts[]>>) {
  const months = ["2026-08", "2026-09", "2026-10"];
  const invited = Object.fromEntries(
    Object.entries(byState).map(([state, cells]) => [
      state,
      fetched(Object.fromEntries(cells.map((c, i) => [months[i], c]))),
    ]),
  );
  return { ...nurse, asAt: AS_AT, stateInvited: { "190": invited } };
}

describe("visaLabel", () => {
  const competitive = { "85": "5" };
  const masked = { "85": "<20" };

  it("maps the rules groups to labels and flags", () => {
    const core = multiState({
      SA: [{}, {}, competitive],
      WA: [{}, {}, competitive],
      TAS: [{}, {}, competitive],
      QLD: [{}, {}, competitive],
      NSW: [{}, {}, competitive],
    });
    const r = outlookOf(core, [
      ["SA", "strongest"],
      ["WA", "watching"],
      ["TAS", "unverified"],
      ["QLD", "needs-answers"],
      ["NSW", "not-open"],
    ]);
    const byState = Object.fromEntries(
      r.states.map((s) => [s.state, [s.label, s.flag]]),
    );
    expect(byState).toEqual({
      SA: ["competitive", null],
      WA: ["competitive", null],
      TAS: ["competitive", "rules-being-checked"],
      QLD: ["competitive", "needs-answers"],
      NSW: ["not-open", null],
    });
  });

  it("ranks by label before the flag", () => {
    // SA's only invitation is 5 months back: long wait, unflagged.
    const core: OccupationCore = {
      ...nurse,
      asAt: AS_AT,
      stateInvited: {
        "190": {
          TAS: fetched({ "2026-10": competitive }),
          SA: fetched({ "2026-05": masked }),
        },
      },
    };
    const r = outlookOf(core, [
      ["SA", "strongest"],
      ["TAS", "unverified"],
    ]);
    expect(r.best?.state).toBe("TAS");
    expect(r.label).toBe("competitive");
  });

  it("puts unflagged states before flagged ones at the same label", () => {
    const core = multiState({
      TAS: [competitive, competitive, { "85": "9" }],
      SA: [{}, {}, competitive],
    });
    const r = outlookOf(core, [
      ["TAS", "needs-answers"],
      ["SA", "watching"],
    ]);
    expect(r.best?.state).toBe("SA");
  });

  it("then prefers more confirmed invitations, then more months", () => {
    const more = multiState({
      NT: [{}, {}, { "85": "6" }],
      TAS: [{}, {}, competitive],
    });
    expect(
      outlookOf(more, [
        ["TAS", "unverified"],
        ["NT", "unverified"],
      ]).best?.state,
    ).toBe("NT");
    const months = multiState({
      NT: [{}, masked, masked],
      TAS: [masked, masked, masked],
    });
    expect(
      outlookOf(months, [
        ["NT", "unverified"],
        ["TAS", "unverified"],
      ]).best?.state,
    ).toBe("TAS");
  });

  it("breaks a full tie by state code", () => {
    const core = multiState({
      WA: [{}, {}, competitive],
      SA: [{}, {}, competitive],
    });
    const r = outlookOf(core, [
      ["WA", "strongest"],
      ["SA", "strongest"],
    ]);
    expect(r.best?.state).toBe("SA");
    expect(r.states.map((s) => s.state)).toEqual(["SA", "WA"]);
  });

  it("never picks a state that is not open, even over not invited", () => {
    const core = multiState({ SA: [{}, {}, competitive], WA: [] });
    const r = outlookOf(core, [
      ["SA", "not-open"],
      ["WA", "strongest"],
    ]);
    expect(r.best?.state).toBe("WA");
    expect(r.label).toBe("not-invited");
  });

  it("is not open when every state is not open", () => {
    const core = multiState({ SA: [{}, {}, competitive] });
    const r = outlookOf(core, [
      ["SA", "not-open"],
      ["WA", "not-open"],
    ]);
    expect(r).toMatchObject({ label: "not-open", best: null, points: 90 });
  });
});

// Rules were checked on 17 Nov 2026; the points use the scenario date.
const RULES_AS_OF = "2026-11-18";
const POINTS_AS_OF = "2026-11-21";
const lists = realLists();
const federal = realFederal();

function realVisa(profile: Profile, visa: StateVisa): VisaLabel {
  const core = realCore(profile.occupation);
  const result = calculatePoints(profile, POINTS_AS_OF);
  const points = visa === "190" ? result.subclass190 : result.subclass491;
  const outlook = stateOutlook({
    core,
    rules: stateRules,
    lists,
    federal,
    profile,
    points,
    eligibility: ELIGIBLE,
    visa,
    asOf: RULES_AS_OF,
  });
  return visaLabel(outlook, core, points);
}

function summary(r: VisaLabel) {
  return {
    points: r.points,
    label: r.label,
    best: r.best?.state ?? null,
    flag: r.best?.flag ?? null,
  };
}

describe("visaLabel on the real snapshot", () => {
  it("Meera 190 at 85: TAS competitive, rules being checked", () => {
    expect(summary(realVisa(SCENARIOS.long, "190"))).toEqual({
      points: 85,
      label: "competitive",
      best: "TAS",
      flag: "rules-being-checked",
    });
  });

  it("Rahul 190 at 90 and 491 at 100: NT competitive", () => {
    expect(summary(realVisa(SCENARIOS.notinv, "190"))).toMatchObject({
      points: 90,
      label: "competitive",
      best: "NT",
    });
    expect(summary(realVisa(SCENARIOS.notinv, "491"))).toMatchObject({
      points: 100,
      label: "competitive",
      best: "NT",
    });
  });

  it("Arjun 190 at 65: TAS competitive; 491 at 75: long wait", () => {
    expect(summary(realVisa(SCENARIOS.below, "190"))).toMatchObject({
      points: 65,
      label: "competitive",
      best: "TAS",
    });
    expect(summary(realVisa(SCENARIOS.below, "491"))).toMatchObject({
      points: 75,
      label: "long-wait",
    });
  });

  it("Dev 190 at 80 and 491 at 90: not invited", () => {
    expect(summary(realVisa(SCENARIOS.none, "190"))).toMatchObject({
      points: 80,
      label: "not-invited",
    });
    expect(summary(realVisa(SCENARIOS.none, "491"))).toMatchObject({
      points: 90,
      label: "not-invited",
    });
  });

  it("Aarav 190 at 95: strong", () => {
    const r = realVisa(SCENARIOS.strong, "190");
    expect(r).toMatchObject({ points: 95, label: "strong" });
  });
});
