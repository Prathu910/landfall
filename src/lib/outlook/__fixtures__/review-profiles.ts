import {
  loadOccupationCore,
  loadOccupationDetail,
} from "../../data/load-server";
import type { Profile } from "../../migration";
import type { OutlookInput } from "../evaluate-profile";
import { AS_OF, scenarioInput } from "./scenario-input";
import { SCENARIOS } from "./scenarios";

/**
 * The final review's repro reader: 30, offshore, single, a bachelor degree,
 * Competent English and 5 years' overseas work (65 points before changes).
 */
export const PLANNER: Profile = {
  ...SCENARIOS.middle,
  name: "",
  dob: "1994-03-14",
  english: "competent",
  englishDate: "2026-01-04",
  assessmentDate: "2026-02-01",
  assessmentExpiry: "2029-02-01",
  overseasYears: 5,
};

/** Real-data input for any profile, with its occupation's core and detail. */
export function profileInput(profile: Profile): OutlookInput {
  return {
    ...scenarioInput("middle"),
    profile,
    asOf: AS_OF,
    core: loadOccupationCore(profile.occupation),
    detail: loadOccupationDetail(profile.occupation),
  };
}
