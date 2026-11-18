import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import type { StateSide } from "../data/state-evidence";
import type { StateCode, StateVisa } from "../data/types";
import { BANNED_COPY } from "../report/copy";
import { cases, realFederal, realLists } from "./__fixtures__/real-data";
import { stateOutlook } from "./outlook";
import type { Group, Outlook, StateOutcome } from "./outlook";
import type { StateVisaRules } from "./rules-types";
import {
  buildAnyStateTile,
  buildStatePanel,
  buildTiles,
  type StatePanel,
} from "./view";

const AS_OF = "2026-11-18";
const lists = realLists();
const federal = realFederal();

function rulesFor(state: StateCode, visa: StateVisa): StateVisaRules {
  const found = stateRules.rules.find(
    (r) => r.state === state && r.visa === visa,
  );
  if (!found) throw new Error(`no rules for ${state} ${visa}`);
  return found;
}

function run(caseIndex: number, visa: StateVisa, points: number, asOf = AS_OF) {
  const c = cases[caseIndex];
  const core = loadOccupationCore(c.profile.occupation);
  if (!core) throw new Error("no core");
  return stateOutlook({
    core,
    rules: stateRules,
    lists,
    federal,
    profile: c.profile,
    points,
    visa,
    asOf,
  });
}

function outcomeOf(outlook: Outlook, state: StateCode): StateOutcome {
  const found = outlook.states.find((s) => s.state === state);
  if (!found) throw new Error(`no ${state}`);
  return found;
}

const EMPTY: StateSide = {
  competitorsAtOrAbove: { min: 0, max: 0 },
  invitedAtOrBelow: [],
  notPublished: [],
  peak: null,
  scoreRange: null,
};

function side(overrides: Partial<StateSide> = {}): StateSide {
  return { ...EMPTY, ...overrides };
}

function stub(group: Group, evidence: StateSide, reasonText = "A reason") {
  const outcome: StateOutcome = {
    state: "WA",
    visa: "190",
    group,
    deciding: null,
    streams: [],
    evidence,
    reasonText,
  };
  const outlook: Outlook = {
    visa: "190",
    states: [outcome],
    anyState: evidence,
    summary: "",
  };
  return outlook;
}

const GROUP_LABELS = [
  "Strongest evidence",
  "Worth watching",
  "Needs your answers",
  "Not yet verified",
  "Not open to you now",
];

describe("buildTiles fragments", () => {
  it("states the confirmed peak at or below the score", () => {
    const peak = { asAt: "2026-09", invitedAtLeast: { min: 14, max: 14 } };
    const [tile] = buildTiles(
      stub("strongest", side({ peak, invitedAtOrBelow: [peak] })),
      95,
    );
    expect(tile.label).toBe("Western Australia");
    expect(tile.group).toBe("strongest");
    expect(tile.fragment).toBe("at least 14 invited at ≤95 (as at Sep 2026)");
    expect(tile.href).toBe("#state-190-WA");
  });

  it("says an all-masked state may be zero (Review Focus 5)", () => {
    const masked = { asAt: "2026-09", invitedAtLeast: { min: 0, max: 19 } };
    const [tile] = buildTiles(
      stub("watching", side({ invitedAtOrBelow: [masked] })),
      95,
    );
    expect(tile.fragment).toBe("under 20 invited, so may be zero");
  });

  it("says nothing was recorded when every month is a confirmed zero", () => {
    const zero = { asAt: "2026-09", invitedAtLeast: { min: 0, max: 0 } };
    const [tile] = buildTiles(
      stub("watching", side({ invitedAtOrBelow: [zero] })),
      95,
    );
    expect(tile.fragment).toBe(
      "no invitations recorded at your score in 12 months",
    );
  });

  it("uses the short reason for the other groups", () => {
    for (const group of ["needs-answers", "unverified", "not-open"] as const) {
      const [tile] = buildTiles(stub(group, side(), "Short reason"), 95);
      expect(tile.fragment).toBe("Short reason");
    }
  });

  it("labels the any-state tile and keeps it out of the groups", () => {
    const peak = { asAt: "2026-10", invitedAtLeast: { min: 30, max: 30 } };
    const tile = buildAnyStateTile(side({ peak }), 95);
    expect(tile.label).toBe("Any state");
    expect(tile.fragment).toBe("at least 30 invited at ≤95 (as at Oct 2026)");
    expect(tile.note).toBe(
      "EOIs not tied to one state; not counted in any state's group",
    );
    const masked = { asAt: "2026-10", invitedAtLeast: { min: 0, max: 19 } };
    expect(
      buildAnyStateTile(side({ invitedAtOrBelow: [masked] }), 95).fragment,
    ).toBe("under 20 invited, so may be zero");
  });
});

describe("buildStatePanel", () => {
  it("builds a strongest panel with data sentences and the footer", () => {
    const outlook = run(1, "190", 95);
    const qld = outcomeOf(outlook, "QLD");
    const panel = buildStatePanel(qld, rulesFor("QLD", "190"), 95, AS_OF);
    expect(panel.id).toBe("state-190-QLD");
    expect(panel.heading).toBe("Queensland · 190");
    expect(panel.groupLabel).toBe("Strongest evidence");
    expect(panel.streamName).not.toBeNull();
    expect(panel.canApply.some((l) => l.mark === "✓")).toBe(true);
    expect(panel.canApply[0].checkedNote).toMatch(/^checked \d+ Nov 2026$/);
    expect(panel.pointsThere[0]).toBe("95 federal points with nomination");
    expect(panel.data.length).toBeGreaterThan(1);
    expect(panel.data.some((d) => d.includes("points or more"))).toBe(true);
    expect(panel.data.every((d) => /as at [A-Z][a-z]{2} \d{4}/.test(d))).toBe(
      true,
    );
    expect(panel.footer).toBe(
      "Not advice to apply. Rules change; check the official page.",
    );
    expect(panel.resultsLink).toBeNull();
  });

  it("links a state's published results page when the rules name one", () => {
    const rules = rulesFor("WA", "190");
    const outcome = outcomeOf(run(0, "190", 90), "WA");
    expect(buildStatePanel(outcome, rules, 90, AS_OF).resultsLink).toEqual({
      href: rules.resultsUrl,
      text: "Western Australia published results (past results, not a prediction)",
    });
  });

  it("names the Victorian own score system without calling it points", () => {
    const vic = outcomeOf(run(0, "190", 90), "VIC");
    const panel = buildStatePanel(vic, rulesFor("VIC", "190"), 90, AS_OF);
    expect(panel.pointsThere).toEqual([
      "90 federal points with nomination",
      "Victoria ranks with its own Victorian Points Test (VPT) (not calculated here).",
    ]);
  });

  it("marks secondary rules as not yet verified", () => {
    const vic = outcomeOf(run(0, "190", 90), "VIC");
    const panel = buildStatePanel(vic, rulesFor("VIC", "190"), 90, AS_OF);
    expect(panel.groupLabel).toBe("Not yet verified");
    expect(
      panel.canApply.some(
        (l) => l.checkedNote === "Not yet verified on the official page",
      ),
    ).toBe(true);
  });

  it("leads a secondary closure with a prominent line and its source", () => {
    const vic = outcomeOf(run(0, "491", 90), "VIC");
    const rules = rulesFor("VIC", "491");
    const panel = buildStatePanel(vic, rules, 90, AS_OF);
    expect(panel.groupLabel).toBe("Not yet verified");
    expect(panel.canApply[0]).toEqual({
      text: "Reported closed for 491 in 2026–27, not yet verified on the official page",
      mark: "?",
      source: rules.streams[0].status.source,
      checkedNote: "Not yet verified on the official page",
    });
  });

  it("flags a restriction as required but not checked, even when strongest", () => {
    const restricted = stateRules.rules.filter((r) =>
      r.streams.some((s) => s.restriction !== undefined),
    );
    expect(restricted.length).toBeGreaterThan(0);
    let found = false;
    for (const rules of restricted) {
      for (let i = 0; i < cases.length; i++) {
        const c = cases[i];
        for (const points of c.points) {
          const outlook = run(i, rules.visa, points[rules.visa]);
          const outcome = outcomeOf(outlook, rules.state);
          const stream = rules.streams.find(
            (s) => s.id === outcome.deciding?.streamId,
          );
          if (stream?.restriction === undefined) continue;
          const panel = buildStatePanel(
            outcome,
            rules,
            points[rules.visa],
            AS_OF,
          );
          const line = panel.canApply.find((l) =>
            l.text.startsWith("Also required:"),
          );
          expect(line?.text).toBe(
            `Also required: ${stream.restriction.value.replace(/\.$/, "")} — not checked here`,
          );
          expect(line?.mark).toBe("?");
          expect(line?.source).toBe(stream.restriction.source);
          found = true;
        }
      }
    }
    expect(found).toBe(true);
  });

  it("words a stale rule's checked note with its date", () => {
    // Rules checked 17 Nov 2026 are more than 60 days old by March 2027.
    const outlook = run(1, "190", 95, "2027-03-01");
    const qld = outcomeOf(outlook, "QLD");
    const panel = buildStatePanel(
      qld,
      rulesFor("QLD", "190"),
      95,
      "2027-03-01",
    );
    expect(panel.groupLabel).toBe("Not yet verified");
    expect(
      panel.canApply.some(
        (l) => l.checkedNote === "Last checked 17 Nov 2026; may have changed",
      ),
    ).toBe(true);
  });

  it("describes a state with no recorded rules", () => {
    const outcome = stub("unverified", side(), "Rules not recorded for 190")
      .states[0];
    const panel = buildStatePanel(
      outcome,
      { ...rulesFor("WA", "190"), streams: [] },
      95,
      AS_OF,
    );
    expect(panel.canApply).toHaveLength(1);
    expect(panel.canApply[0].mark).toBe("?");
    expect(panel.streamName).toBeNull();
  });

  it("writes masked and monthly evidence sentences, newest three, never summed", () => {
    const months = ["2026-06", "2026-07", "2026-08", "2026-09"].map((asAt) => ({
      asAt,
      invitedAtLeast: { min: 0, max: 19 },
    }));
    const evidence = side({
      competitorsAtOrAbove: { min: 0, max: 19 },
      invitedAtOrBelow: months,
      scoreRange: { min: 85, max: 95 },
    });
    const outcome = stub("watching", evidence).states[0];
    const panel = buildStatePanel(outcome, rulesFor("WA", "190"), 90, AS_OF);
    expect(panel.data[0]).toBe(
      "Under 20 (so may be zero) EOIs for visa 190 nominating Western Australia have 90 points or more (as at Sep 2026)",
    );
    const monthly = panel.data.filter((d) => d.includes("invited at"));
    expect(monthly).toHaveLength(3);
    expect(monthly[0]).toContain("Sep 2026");
    expect(monthly[0]).toContain("Under 20 invited");
    expect(panel.data.some((d) => d.includes("from 85 to 95"))).toBe(true);
  });
});

describe("tiles and panels over the real profiles", () => {
  for (let i = 0; i < cases.length; i++) {
    for (const visa of ["190", "491"] as const) {
      const c = cases[i];
      for (const points of c.points) {
        it(`${c.label}, ${points[visa]} points, ${visa}: no banned copy, every tile has a panel`, () => {
          const outlook = run(i, visa, points[visa]);
          const tiles = buildTiles(outlook, points[visa]);
          expect(tiles.map((t) => t.state)).toEqual(
            outlook.states.map((s) => s.state),
          );
          const strings: string[] = [
            buildAnyStateTile(outlook.anyState, points[visa]).fragment,
          ];
          for (const tile of tiles) {
            expect(GROUP_LABELS).toContain(
              buildStatePanel(
                outcomeOf(outlook, tile.state),
                rulesFor(tile.state, visa),
                points[visa],
                AS_OF,
              ).groupLabel,
            );
            strings.push(tile.label, tile.fragment);
          }
          for (const outcome of outlook.states) {
            const panel: StatePanel = buildStatePanel(
              outcome,
              rulesFor(outcome.state, visa),
              points[visa],
              AS_OF,
            );
            expect(tiles.find((t) => t.state === outcome.state)?.href).toBe(
              `#${panel.id}`,
            );
            strings.push(
              panel.heading,
              panel.groupLabel,
              panel.footer,
              ...panel.data,
              ...panel.pointsThere,
              ...panel.canApply.flatMap((l) => [l.text, l.checkedNote]),
              ...(panel.resultsLink ? [panel.resultsLink.text] : []),
            );
          }
          for (const text of strings) {
            expect(text).not.toMatch(BANNED_COPY);
            expect(text).not.toMatch(/'s \d{4}/);
          }
        });
      }
    }
  }
});
