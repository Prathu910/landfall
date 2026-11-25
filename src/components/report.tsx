"use client";
import { useMemo } from "react";
import type { Profile } from "@/lib/migration";
import type { ReportSource } from "@/lib/data/report-source";
import type { OccupationIndexEntry } from "@/lib/data/types";
import type { OccupationEvidence } from "@/lib/report-evidence";
import { calculationSummary } from "@/lib/submissions/summary";
import { occupationIndex } from "./data/occupation-index";
import type { ReportOccupation } from "./data/report-occupation";
import { stateRuleData } from "./data/state-rule-data";
import { ReportFeedback } from "./feedback/report-feedback";
import { LoadingData } from "./report/loading-data";
import { PointsPage } from "./report/points-page";
import { PrintReport } from "./report/print-report";
import { ReportFooter } from "./report/report-footer";
import { buildCheckReport, occupationState } from "./report/report-payload";
import type { CheckReport, PreReportView } from "./report/report-payload";
import {
  ReportToolbar,
  ReportView,
  toolbarNote,
} from "./report/report-renderer";
import { SampleCta } from "./report/sample-cta";
import section from "./report/section.module.css";
import type { OurReadResult } from "./report/use-our-read";
import styles from "./report/report.module.css";

export { ReportView } from "./report/report-renderer";

type Props = {
  profile: Profile;
  asOf: string;
  sample?: boolean;
  onEdit?: () => void;
  /** Merges a "Sharpen my state outlook" answer into the profile; absent on the sample. */
  onAnswer?: (patch: Partial<Profile>) => void;
  occupation: ReportOccupation;
  /** Must keep a stable identity: the comparison loader's effect depends on it. */
  comparisonIndex: OccupationIndexEntry[];
  /** Server-rendered evidence for the default comparison occupation. */
  initialComparison?: OccupationEvidence;
  source: ReportSource;
  /** From the calculation receipt; memory only. Absent on the sample. */
  readToken?: string | null;
};

// Points-only pages print no Our read.
const NO_READ: OurReadResult = { text: "", source: "template", pending: false };

function useCheckReport(props: Props): CheckReport {
  const { profile, asOf, occupation, source } = props;
  const ready = occupation.status === "ready" ? occupation : null;
  const core = ready?.core ?? null;
  const detail = ready?.detail ?? null;
  const { status } = occupation;
  // Sharpen answers change the profile, which rebuilds the whole report (spec 7).
  return useMemo(
    () =>
      buildCheckReport({
        profile,
        asOf,
        rules: stateRuleData,
        source,
        occupation: occupationState(
          profile.occupation,
          status,
          core,
          detail,
          occupationIndex,
        ),
      }),
    [profile, asOf, source, status, core, detail],
  );
}

/** Loading, or points only: what /check/ shows when there is no report yet. */
function PreReport(props: Props & { view: PreReportView }) {
  const { view, profile, asOf, sample, source } = props;
  const summary =
    view.kind === "loading" || sample
      ? null
      : calculationSummary(profile, view.points, asOf, source.snapshotDate);
  return (
    <>
      <ReportToolbar
        note={toolbarNote(sample ? "sample" : "issued")}
        onEdit={props.onEdit}
      />
      {view.kind === "loading" ? (
        <article className={styles.page}>
          <section id="outlook" className={section.band}>
            <LoadingData />
          </section>
        </article>
      ) : (
        <article className={`${styles.page} ${styles.screenOnly}`}>
          <section id="outlook" className={section.band}>
            <h1 className={styles.h1}>You have {view.points.base} points.</h1>
            <p className={styles.line}>{view.line}</p>
          </section>
          <PointsPage page={view.pointsPage} warnings={view.points.warnings} />
          <div className={`${section.band} no-print`}>
            <ReportFeedback summary={summary} />
          </div>
          <ReportFooter text={view.footer} />
        </article>
      )}
      {sample && <SampleCta />}
      <PrintReport
        view={view}
        profile={profile}
        asOf={asOf}
        source={source}
        read={NO_READ}
      />
    </>
  );
}

/**
 * /check/'s report: built here in the browser, then shown by `ReportView`.
 * Plan 3 removes this wrapper, when /check/ reads an issued payload instead.
 */
export function Report(props: Props) {
  const built = useCheckReport(props);
  if (built.kind === "pre-report") {
    return <PreReport {...props} view={built.view} />;
  }
  return (
    <ReportView
      payload={built.payload}
      occupation={props.occupation}
      mode={props.sample ? "sample" : "issued"}
      comparisonIndex={props.comparisonIndex}
      initialComparison={props.initialComparison}
      onEdit={props.onEdit}
      onAnswer={props.onAnswer}
      readToken={props.readToken}
    />
  );
}
