import type { PointsResult } from "../migration";
import { calculatePoints } from "../migration";
import { eoiExpiry } from "./eoi-expiry";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput } from "./evaluate-profile";
import { dataMonth } from "./phrases";
import { stampFace } from "./stamp-face";
import type { FreeStamp } from "./stamp-face";
import type { OutlookViewInput } from "./view";

export type FreeResult =
  | {
      kind: "stamps";
      points: PointsResult;
      stamps: FreeStamp[];
      dataMonth: string;
    }
  | { kind: "loading"; points: PointsResult }
  | {
      kind: "points-only";
      points: PointsResult;
      reason: "no-occupation" | "unavailable" | "dropped" | "load-failed";
      note: string | null;
    };

const VISAS = ["189", "190", "491"] as const;

function stamps(entered: OutlookInput): FreeResult {
  const expiry = eoiExpiry(entered);
  // An expired EOI holds no place in the queue, so plan as for a new one.
  const input = expiry
    ? { ...entered, profile: { ...entered.profile, eoiDate: "" } }
    : entered;
  const o = evaluateProfile(input);
  return {
    kind: "stamps",
    // From the answers as entered, like the report.
    points: calculatePoints(entered.profile, entered.asOf),
    stamps: VISAS.map((visa) => stampFace(input, o, visa)),
    dataMonth: dataMonth(input),
  };
}

/**
 * What a reader sees before paying: their points and the three visa stamps,
 * built without wait estimates, route, improve, evidence or facts.
 */
export function buildFreeResult(input: OutlookViewInput): FreeResult {
  const { occupation, ...rest } = input;
  const points = calculatePoints(rest.profile, rest.asOf);
  if (rest.profile.occupation === "") {
    return { kind: "points-only", points, reason: "no-occupation", note: null };
  }
  if (occupation.status === "dropped") {
    return {
      kind: "points-only",
      points,
      reason: "dropped",
      note: occupation.note,
    };
  }
  if (occupation.status === "load-failed") {
    return { kind: "points-only", points, reason: "load-failed", note: null };
  }
  if (occupation.status === "loading") return { kind: "loading", points };
  // No published data: the points are all there is to show.
  if (occupation.status !== "ready") {
    return { kind: "points-only", points, reason: "unavailable", note: null };
  }
  return stamps({
    ...rest,
    core: occupation.core,
    detail: occupation.detail,
  });
}
