import type { ReportSource } from "../data/report-source";
import type { ReportOutlookView } from "../outlook/view";
import type { Profile } from "../migration";
import type { StateOutlookView } from "../report/state-outlook-view";

export type ReportMeta = {
  reportNo: string;
  version: number;
  /** ISO timestamps. */
  issuedAt: string;
  correctableUntil: string;
  revisionsLeft: number;
};

/** Everything a page needs to show a report: serialisable, built once. */
export type ReportPayload = {
  schema: 1;
  view: ReportOutlookView;
  stateOutlook: StateOutlookView | null;
  profile: Profile;
  asOf: string;
  source: ReportSource;
  /** Null on /sample/. */
  meta: ReportMeta | null;
};
