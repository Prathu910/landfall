import type { OccupationCore, OccupationDetail } from "../data/types";
import type { ReportSource } from "../data/report-source";
import type { Profile } from "../migration";
import { buildOutlookView } from "../outlook/view";
import { buildStateOutlookView } from "../report/state-outlook-view";
import type { StateRuleData } from "../report/state-outlook-view";
import type { ReportMeta, ReportPayload } from "./payload";

export class ReportBuildError extends Error {
  constructor(public reason: "no-core" | "invalid-profile") {
    super(`Cannot build the report: ${reason}`);
    this.name = "ReportBuildError";
  }
}

export function buildReportPayload(input: {
  profile: Profile;
  asOf: string;
  core: OccupationCore | null;
  detail: OccupationDetail | null;
  rules: StateRuleData;
  source: ReportSource;
  meta: ReportMeta | null;
}): ReportPayload {
  const { profile, asOf, core, detail, rules, source, meta } = input;
  if (!core) throw new ReportBuildError("no-core");
  const view = buildOutlookView({
    profile,
    asOf,
    rules,
    occupation: { status: "ready", core, detail },
  });
  if (view.kind !== "report") throw new ReportBuildError("no-core");
  const stateOutlook = buildStateOutlookView({
    core,
    profile,
    asOf,
    points: view.points,
    data: rules,
  });
  return { schema: 1, view, stateOutlook, profile, asOf, source, meta };
}
