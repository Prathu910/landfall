"use client";
import { useMemo } from "react";
import { Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import type { Profile } from "@/lib/migration";
import type { ReportSource } from "@/lib/data/report-source";
import type { OccupationCore, OccupationIndexEntry } from "@/lib/data/types";
import { buildOutlookView } from "@/lib/outlook/view";
import type { OccupationState, OutlookView } from "@/lib/outlook/view";
import type { OccupationEvidence } from "@/lib/report-evidence";
import { calculationSummary } from "@/lib/submissions/summary";
import { occupationIndex } from "./data/occupation-index";
import { unavailableReason } from "./data/report-occupation";
import type { ReportOccupation } from "./data/report-occupation";
import type { OurReadResult } from "./report/use-our-read";
import type { DetailLoad } from "./data/use-occupation-core";
import { stateRuleData } from "./data/state-rule-data";
import { readEnabled } from "./submissions/config";
import { ReportFeedback } from "./feedback/report-feedback";
import { ChartsSection } from "./report/charts-section";
import { EvidenceSection } from "./report/evidence-section";
import { ImproveSection } from "./report/improve-section";
import { LoadingData } from "./report/loading-data";
import { MethodNote } from "./report/method-note";
import { OutlookHero } from "./report/outlook-hero";
import { PointsPage } from "./report/points-page";
import { PrintReport } from "./report/print-report";
import { ReportFooter } from "./report/report-footer";
import { RouteSection } from "./report/route-section";
import { SampleCta } from "./report/sample-cta";
import { SectionChips } from "./report/section-chips";
import section from "./report/section.module.css";
import { useOurRead } from "./report/use-our-read";
import { VisaRow } from "./report/visa-row";
import styles from "./report/report.module.css";

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

/** The outlook reads only the core and a ready detail file. */
function occupationState(
  code: string,
  status: ReportOccupation["status"],
  core: OccupationCore | null,
  detail: DetailLoad | null,
): OccupationState {
  if (status === "loading") return { status: "loading" };
  if (status !== "ready" || !core) {
    // A fetch that failed must not read as "SkillSelect published nothing".
    const failed = unavailableReason(code, occupationIndex) === "loadFailed";
    return failed ? { status: "load-failed" } : { status: "unavailable" };
  }
  return {
    status: "ready",
    core,
    detail: detail?.status === "ready" ? detail.detail : null,
  };
}

function useOutlookView(
  profile: Profile,
  asOf: string,
  occupation: ReportOccupation,
): OutlookView {
  const ready = occupation.status === "ready" ? occupation : null;
  const core = ready?.core ?? null;
  const detail = ready?.detail ?? null;
  const { status } = occupation;
  // Sharpen answers change the profile, which rebuilds the whole view (spec 7).
  return useMemo(
    () =>
      buildOutlookView({
        profile,
        asOf,
        rules: stateRuleData,
        occupation: occupationState(profile.occupation, status, core, detail),
      }),
    [profile, asOf, status, core, detail],
  );
}

function Toolbar({ sample, onEdit }: Pick<Props, "sample" | "onEdit">) {
  return (
    <div className={`${styles.toolbar} no-print`}>
      <span className={styles.note}>
        {sample
          ? "Fictional profile. Real published data."
          : "Your personal report, built from your answers."}
      </span>
      {onEdit && (
        <Button
          variant="default"
          size="sm"
          leftSection={<Pencil size={13} />}
          onClick={onEdit}
        >
          Edit answers
        </Button>
      )}
    </div>
  );
}

function ReportBody(props: Props & { view: OutlookView; read: OurReadResult }) {
  const { view, read, profile, asOf, sample, source } = props;
  if (view.kind === "loading") {
    return (
      <section id="outlook" className={section.band}>
        <LoadingData />
      </section>
    );
  }
  const summary = sample
    ? null
    : calculationSummary(profile, view.points, asOf, source.snapshotDate);
  if (view.kind === "points-only") {
    return (
      <>
        <section id="outlook" className={section.band}>
          <h1 className={styles.h1}>You have {view.points.base} points.</h1>
          <p className={styles.line}>{view.line}</p>
        </section>
        <PointsPage page={view.pointsPage} warnings={view.points.warnings} />
        <div className={`${section.band} no-print`}>
          <ReportFeedback summary={summary} />
        </div>
        <ReportFooter text={view.footer} />
      </>
    );
  }
  return (
    <>
      <SectionChips />
      <OutlookHero view={view} read={read} />
      <VisaRow visas={view.visas} />
      <ChartsSection view={view} />
      <RouteSection route={view.route} />
      <ImproveSection improve={view.improve} labels={view.improveLabels} />
      <EvidenceSection
        evidence={view.evidence}
        occupation={props.occupation}
        profile={profile}
        asOf={asOf}
        points={view.points}
        onAnswer={props.onAnswer}
        comparisonIndex={props.comparisonIndex}
        initialComparison={props.initialComparison}
        source={source}
      />
      <PointsPage page={view.pointsPage} warnings={view.points.warnings} />
      <MethodNote lines={view.methodLines} />
      <div className={`${section.band} no-print`}>
        <ReportFeedback summary={summary} />
      </div>
      <ReportFooter text={view.footer} />
    </>
  );
}

/** The verdict-first report, shared by /check/ and /sample/ (spec 5), with its A4 print layout. */
export function Report(props: Props) {
  const view = useOutlookView(props.profile, props.asOf, props.occupation);
  const reportView = view.kind === "report" ? view : null;
  const read = useOurRead(
    reportView?.facts ?? null,
    reportView?.templateRead ?? "",
    props.readToken ?? null,
    readEnabled,
  );
  // Once the print layout exists it replaces the screen report on paper.
  const hasPrintLayout = view.kind !== "loading";
  return (
    <>
      <Toolbar sample={props.sample} onEdit={props.onEdit} />
      <article
        className={`${styles.page} ${hasPrintLayout ? styles.screenOnly : ""}`}
      >
        <ReportBody {...props} view={view} read={read} />
      </article>
      {props.sample && <SampleCta />}
      <PrintReport
        view={view}
        profile={props.profile}
        asOf={props.asOf}
        source={props.source}
        read={read}
      />
    </>
  );
}
