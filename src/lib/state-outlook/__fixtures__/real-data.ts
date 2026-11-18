import { readFileSync } from "node:fs";
import path from "node:path";
import type { StateVisa } from "../../data/types";
import { sampleProfile } from "../../migration";
import type { Profile } from "../../migration";
import { isFederalList, isImportedList } from "../rules-guards";
import type { PointsEligibility } from "../context";
import type { FederalList, ImportedList } from "../rules-types";

/** The imported lists that the 2026–27 rules reference. */
const LIST_IDS = ["wa", "sa", "qld", "nsw"];

function readJson(file: string): unknown {
  return JSON.parse(
    readFileSync(
      path.resolve(process.cwd(), "src/data/state-rules", file),
      "utf8",
    ),
  );
}

/** The checked-in state lists, validated. */
export function realLists(): Record<string, ImportedList> {
  const lists: Record<string, ImportedList> = {};
  for (const id of LIST_IDS) {
    const json = readJson(`lists/${id}.json`);
    if (!isImportedList(json)) throw new Error(`list ${id} is invalid`);
    lists[id] = json;
  }
  return lists;
}

/** The checked-in federal occupation list, validated. */
export function realFederal(): FederalList {
  const json = readJson("federal-occupations.json");
  if (!isFederalList(json)) throw new Error("federal list is invalid");
  return json;
}

/** The cases' fixed points stand for a complete points check that passes. */
export const ELIGIBLE: PointsEligibility = {
  eligible: true,
  ineligibleReasons: [],
  missing: [],
  uncheckedDates: [],
};

/** Three real occupations and profiles used to sweep the real rules and data. */
export type Case = {
  label: string;
  profile: Profile;
  points: Record<StateVisa, number>[];
};

export const cases: Case[] = [
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
