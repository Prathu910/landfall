import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import type { StateVisa } from "../data/types";
import { sampleProfile } from "../migration";
import type { Profile } from "../migration";
import { BANNED_COPY } from "../report/copy";
import { stateOutlook } from "./outlook";
import type { Outlook } from "./outlook";
import { isFederalList, isImportedList } from "./rules-guards";
import type { FederalList, ImportedList } from "./rules-types";

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

function readJson(file: string): unknown {
  return JSON.parse(
    readFileSync(
      path.resolve(process.cwd(), "src/data/state-rules", file),
      "utf8",
    ),
  );
}

const lists: Record<string, ImportedList> = {};
for (const id of ["wa", "sa", "qld", "nsw"]) {
  const json = readJson(`lists/${id}.json`);
  if (!isImportedList(json)) throw new Error(`list ${id} is invalid`);
  lists[id] = json;
}
const federalJson = readJson("federal-occupations.json");
if (!isFederalList(federalJson)) throw new Error("federal list is invalid");
const federal: FederalList = federalJson;

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
                for (const k of fails)
                  expect(READ_HOSTS).toContain(host(k.source));
              }
            }
            if (UNREAD_STATES.includes(s.state)) {
              expect(["unverified", "not-open"]).toContain(s.group);
            }
          }
          if (visa === "491") {
            expect(result.states.find((s) => s.state === "NSW")?.group).toBe(
              "not-open",
            );
          }
          expect(result.summary).not.toMatch(BANNED_COPY);
        });
      }
    }
  }
});
