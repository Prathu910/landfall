import type { ReportSource } from "../../lib/data/report-source";
import type {
  OccupationCore,
  OccupationIndexEntry,
} from "../../lib/data/types";
import type { Profile } from "../../lib/migration";
import { buildOutlookView } from "../../lib/outlook/view";
import type { OccupationState, OutlookView } from "../../lib/outlook/view";
import { buildReportPayload } from "../../lib/report-issue/build";
import type { ReportPayload } from "../../lib/report-issue/payload";
import type { StateRuleData } from "../../lib/report/state-outlook-view";
import { unavailableReason } from "../data/report-occupation";
import type { ReportOccupation } from "../data/report-occupation";
import type { DetailLoad } from "../data/use-occupation-core";

/** What /check/ shows before there is a report to render. */
export type PreReportView = Exclude<OutlookView, { kind: "report" }>;

export type CheckReport =
  | { kind: "payload"; payload: ReportPayload }
  | { kind: "pre-report"; view: PreReportView };

/** The outlook reads only the core and a ready detail file. */
export function occupationState(
  code: string,
  status: ReportOccupation["status"],
  core: OccupationCore | null,
  detail: DetailLoad | null,
  index: OccupationIndexEntry[],
): OccupationState {
  if (status === "loading") return { status: "loading" };
  if (status !== "ready" || !core) {
    // A fetch that failed must not read as "SkillSelect published nothing".
    const reason = unavailableReason(code, index);
    if (typeof reason === "object") {
      return { status: "dropped", note: reason.note };
    }
    return reason === "loadFailed"
      ? { status: "load-failed" }
      : { status: "unavailable" };
  }
  return {
    status: "ready",
    core,
    detail: detail?.status === "ready" ? detail.detail : null,
  };
}

/**
 * /check/'s report, built in the browser until plan 3 moves it to the server.
 * An occupation with a core builds the payload the server will issue; one with
 * no published data still gets the no-core report, which has no state outlook.
 */
export function buildCheckReport(input: {
  profile: Profile;
  asOf: string;
  occupation: OccupationState;
  rules: StateRuleData;
  source: ReportSource;
}): CheckReport {
  const { profile, asOf, occupation, rules, source } = input;
  if (profile.occupation !== "" && occupation.status === "ready") {
    const payload = buildReportPayload({
      profile,
      asOf,
      core: occupation.core,
      detail: occupation.detail,
      rules,
      source,
      meta: null,
    });
    return { kind: "payload", payload };
  }
  const view = buildOutlookView({ profile, asOf, rules, occupation });
  if (view.kind !== "report") return { kind: "pre-report", view };
  const payload: ReportPayload = {
    schema: 1,
    view,
    stateOutlook: null,
    profile,
    asOf,
    source,
    meta: null,
  };
  return { kind: "payload", payload };
}
