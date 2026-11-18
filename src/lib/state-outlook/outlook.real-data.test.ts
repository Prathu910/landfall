import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import type { StateVisa } from "../data/types";
import { sampleProfile } from "../migration";
import type { Profile } from "../migration";
import { BANNED_COPY } from "../report/copy";
import { realFederal, realLists } from "./__fixtures__/real-data";
import { stateOutlook } from "./outlook";
import type { Outlook, StateOutcome } from "./outlook";
import type { Verification } from "./rules-types";

// Fixed date: the rules were checked on 17 Nov 2026, so none is stale.
const AS_OF = "2026-11-18";
// Sites the research read directly ([D]); only their rules can decide a fail.
const READ_HOSTS = [
  "migration.wa.gov.au",
  "www.nsw.gov.au",
  "www.migration.qld.gov.au",
  "migration.sa.gov.au",
  "immi.homeaffairs.gov.au",
];
const UNREAD_STATES = ["ACT", "VIC", "TAS", "NT"];

const lists = realLists();
const federal = realFederal();

type Case = {
  label: string;
  profile: Profile;
  points: Record<StateVisa, number>[];
};

const cases: Case[] = [
  {
    label: "ICT Business Analyst living in VIC, no answers",
    profile: {
      ...sampleProfile,
      occupation: "261111",
      onshore: true,
      state: "VIC",
    },
    points: [
      { "190": 90, "491": 90 },
      { "190": 95, "491": 95 },
      { "190": 105, "491": 105 },
    ],
  },
  {
    label: "Registered Nurse (Medical) living in QLD, with answers",
    profile: {
      ...sampleProfile,
      occupation: "254418",
      onshore: true,
      state: "QLD",
      visaExpiry: "2027-06-30",
      monthsLivingInState: 14,
      monthsWorkingInState: 14,
      yearsExperienceLast3: 3,
      yearsExperienceLast5: 5,
      yearsExperienceLast10: 8,
      jobOfferState: "none",
      livesRegional: false,
      studyState: "none",
    },
    points: [{ "190": 95, "491": 105 }],
  },
  {
    label: "Software Engineer living offshore, with answers",
    profile: {
      ...sampleProfile,
      occupation: "261313",
      onshore: false,
      state: "",
      monthsLivingOffshore: 24,
      yearsExperienceLast3: 3,
      yearsExperienceLast5: 5,
      yearsExperienceLast10: 7,
    },
    points: [{ "190": 90, "491": 100 }],
  },
];

function run(c: Case, visa: StateVisa, points: number): Outlook {
  const core = loadOccupationCore(c.profile.occupation);
  if (!core) throw new Error(`no core for ${c.profile.occupation}`);
  return stateOutlook({
    core,
    rules: stateRules,
    lists,
    federal,
    profile: c.profile,
    points,
    visa,
    asOf: AS_OF,
  });
}

function table(result: Outlook): string {
  return result.states.map((s) => `${s.state}:${s.group}`).join(" ");
}

function host(url: string): string {
  return new URL(url).host;
}

/**
 * The verification of the rule behind check `index` of a stream: checks run
 * federal list, status, cohorts, occupation list, then each requirement.
 */
function verificationBehind(
  outcome: StateOutcome,
  streamId: string,
  index: number,
): Verification {
  const stream = stateRules.rules
    .find((r) => r.state === outcome.state && r.visa === outcome.visa)
    ?.streams.find((st) => st.id === streamId);
  if (!stream) throw new Error(`no stream ${streamId}`);
  // The federal list is the imported official list.
  if (index === 0) return "verified";
  const rules = [stream.status, stream.cohorts, stream.occupations];
  return (rules[index - 1] ?? stream.requirements[index - 4]).verification;
}

function outcomeIn(result: Outlook, state: string): StateOutcome {
  const found = result.states.find((s) => s.state === state);
  if (!found) throw new Error(`no outcome for ${state}`);
  return found;
}

const PASS_GROUPS = ["strongest", "watching"];

describe("stateOutlook over the real 2026–27 rules and lists", () => {
  for (const c of cases) {
    for (const points of c.points) {
      for (const visa of ["190", "491"] as const) {
        const result = run(c, visa, points[visa]);
        it(`${c.label}, ${points[visa]} points, ${visa}: ${table(result)}`, () => {
          expect(result.states.map((s) => s.state).sort()).toEqual([
            "ACT",
            "NSW",
            "NT",
            "QLD",
            "SA",
            "TAS",
            "VIC",
            "WA",
          ]);
          for (const s of result.states) {
            expect(s.reasonText).not.toMatch(BANNED_COPY);
            if (s.group === "not-open") {
              // Every stream fails on a verified rule from a site read directly.
              for (const st of s.streams) {
                const fails = st.checks.filter((k) => k.outcome === "fail");
                expect(fails.length).toBeGreaterThan(0);
              }
            }
            // A fail anywhere comes from a fresh, verified, directly read rule.
            for (const st of s.streams) {
              st.checks.forEach((k, i) => {
                if (k.outcome !== "fail") return;
                expect(k.stale).toBe(false);
                expect(verificationBehind(s, st.streamId, i)).toBe("verified");
                expect(READ_HOSTS).toContain(host(k.source));
              });
            }
            if (UNREAD_STATES.includes(s.state)) {
              expect(PASS_GROUPS).not.toContain(s.group);
            }
          }
          if (visa === "491") {
            expect(outcomeIn(result, "NSW").group).toBe("not-open");
          }
          expect(result.summary).not.toMatch(BANNED_COPY);
        });
      }
    }
  }
});

describe("stateOutlook pinned real-data outcomes", () => {
  const [ictBa, nurse] = cases;

  it("puts QLD in strongest for the QLD nurse on 190", () => {
    const qld = outcomeIn(run(nurse, "190", 95), "QLD");
    expect(qld.group).toBe("strongest");
    expect(qld.deciding?.streamId).toBe("qld-onshore");
  });

  it("closes SA to the VIC-resident ICT BA on 190 through the cohort check", () => {
    const sa = outcomeIn(run(ictBa, "190", 90), "SA");
    expect(sa.group).toBe("not-open");
    expect(sa.reasonText).toBe(
      "Not open to those living elsewhere in Australia",
    );
    for (const st of sa.streams) expect(st.checks[2].outcome).toBe("fail");
  });

  it("gives NSW 491 not-open for every profile", () => {
    for (const c of cases) {
      for (const points of c.points) {
        const nsw = outcomeIn(run(c, "491", points["491"]), "NSW");
        expect(nsw.group).toBe("not-open");
        expect(nsw.reasonText).toBe("Closed for 491 in 2026–27");
      }
    }
  });

  it("never puts ACT, VIC, TAS or NT in a pass group", () => {
    for (const c of cases) {
      for (const points of c.points) {
        for (const visa of ["190", "491"] as const) {
          const result = run(c, visa, points[visa]);
          for (const state of UNREAD_STATES) {
            expect(PASS_GROUPS).not.toContain(outcomeIn(result, state).group);
          }
        }
      }
    }
  });
});
