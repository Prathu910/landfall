import type {
  OccupationCore,
  OccupationDetail,
  StateCode,
  StateVisa,
} from "../data/types";
import { calculatePoints } from "../migration";
import type { PointsResult, Profile } from "../migration";
import type { StateRuleData } from "../report/state-outlook-view";
import { STATE_CODES } from "../state-outlook/context";
import { stateOutlook } from "../state-outlook/outlook";
import { label189 } from "./label-189";
import type { Label189 } from "./label-189";
import { visaLabel } from "./label-state";
import type { VisaLabel } from "./label-state";
import { chooseStamp } from "./stamp";
import type { Stamp } from "./stamp";

export type OutlookInput = {
  profile: Profile;
  asOf: string;
  core: OccupationCore | null;
  detail: OccupationDetail | null;
  rules: StateRuleData;
};

export type ProfileOutlook = {
  points: PointsResult;
  v189: Label189;
  v190: VisaLabel | null;
  v491: VisaLabel | null;
  stamp: Stamp;
  listMembership: {
    /** Null when the federal list can't be read (label-189.ts listed189). */
    federal189: boolean | null;
    federal190: boolean;
    federal491: boolean;
    states: StateCode[];
  };
};

/** Read from the rules data by code, so it works when no core was fetched. */
function listMembership(
  code: string,
  rules: StateRuleData,
): ProfileOutlook["listMembership"] {
  const federal = rules.federal?.entries[code];
  const states = STATE_CODES.filter(
    (state) => rules.lists[state.toLowerCase()]?.entries[code] !== undefined,
  );
  return {
    federal189: rules.federal ? federal?.["189"] === true : null,
    federal190: federal?.["190"] ?? false,
    federal491: federal?.["491"] ?? false,
    states,
  };
}

function labelVisa(
  input: OutlookInput,
  core: OccupationCore,
  points: PointsResult,
  visa: StateVisa,
): VisaLabel {
  const visaPoints = visa === "190" ? points.subclass190 : points.subclass491;
  const outlook = stateOutlook({
    core,
    rules: input.rules.rules,
    lists: input.rules.lists,
    federal: input.rules.federal,
    profile: input.profile,
    points: visaPoints,
    eligibility: points,
    visa,
    asOf: input.asOf,
  });
  return visaLabel(outlook, core, visaPoints);
}

export function evaluateProfile(input: OutlookInput): ProfileOutlook {
  const { profile, asOf, core, rules } = input;
  const points = calculatePoints(profile, asOf);
  const membership = listMembership(profile.occupation, rules);
  const v189 = label189({
    points: points.base,
    eligible: points.eligible,
    core,
    reasons: points.ineligibleReasons,
    listed189: membership.federal189,
  });
  const v190 = core ? labelVisa(input, core, points, "190") : null;
  const v491 = core ? labelVisa(input, core, points, "491") : null;
  const stamp = chooseStamp(v189, v190, v491, {
    base: points.base,
    s190: points.subclass190,
    s491: points.subclass491,
  });
  return {
    points,
    v189,
    v190,
    v491,
    stamp,
    listMembership: membership,
  };
}
