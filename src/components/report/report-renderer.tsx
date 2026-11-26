"use client";
import { Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import type { Profile } from "@/lib/migration";
import type { OccupationIndexEntry } from "@/lib/data/types";
import type { ReportPayload } from "@/lib/report-issue/payload";
import type { OccupationEvidence } from "@/lib/report-evidence";
import { calculationSummary } from "@/lib/submissions/summary";
import type { ReportOccupation } from "../data/report-occupation";
import { readEnabled } from "../submissions/config";
import { ReportFeedback } from "../feedback/report-feedback";
import { ChartsSection } from "./charts-section";
import { EvidenceSection } from "./evidence-section";
import { ImproveSection } from "./improve-section";
import { MethodNote } from "./method-note";
import { OutlookHero } from "./outlook-hero";
import { PointsPage } from "./points-page";
import { PrintReport } from "./print-report";
import { ReportFooter } from "./report-footer";
import { RouteSection } from "./route-section";
import { SampleCta } from "./sample-cta";
import { SectionChips } from "./section-chips";
import section from "./section.module.css";
import type { OurReadResult } from "./use-our-read";
import { useOurRead } from "./use-our-read";
import { VisaRow } from "./visa-row";
import styles from "./report.module.css";

export type ReportMode = "sample" | "issued";

/** The toolbar's line above the report. */
export function toolbarNote(mode: ReportMode): string {
  return mode === "sample"
    ? "Fictional profile. Real published data."
    : "Your personal report, built from your answers.";
}

export type ReportViewProps = {
  payload: ReportPayload;
  occupation: ReportOccupation;
  mode: ReportMode;
  /** Must keep a stable identity: the comparison loader's effect depends on it. */
  comparisonIndex: OccupationIndexEntry[];
  /** Server-rendered evidence for the default comparison occupation. */
  initialComparison?: OccupationEvidence;
  /** Offer only these comparisons, preloaded, and never fetch (the frozen /sample/). */
  fixedComparisons?: OccupationEvidence[];
  onEdit?: () => void;
  /** Merges a "Sharpen my state outlook" answer into the profile; absent on the sample. */
  onAnswer?: (patch: Partial<Profile>) => void;
  /**
   * False omits the extras read from the live occupation files (the
   * comparison and the trend): /report/ sets it when they are from another
   * month than the report (ruling R9). Default true.
   */
  liveExtras?: boolean;
  /** Replaces the mode's toolbar line. */
  toolbarNote?: string;
  /** From the calculation receipt; memory only. Absent on the sample. */
  readToken?: string | null;
};

export function ReportToolbar({
  note,
  onEdit,
}: {
  note: string;
  onEdit?: () => void;
}) {
  return (
    <div className={`${styles.toolbar} no-print`}>
      <span className={styles.note}>{note}</span>
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

function ReportBody(props: ReportViewProps & { read: OurReadResult }) {
  const { payload, read, mode } = props;
  const { view, profile, asOf, source } = payload;
  const summary =
    mode === "sample"
      ? null
      : calculationSummary(profile, view.points, asOf, source.snapshotDate);
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
        stateOutlook={payload.stateOutlook}
        occupation={props.occupation}
        profile={profile}
        points={view.points}
        onAnswer={props.onAnswer}
        comparisonIndex={props.comparisonIndex}
        initialComparison={props.initialComparison}
        fixedComparisons={props.fixedComparisons}
        liveExtras={props.liveExtras ?? true}
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

/**
 * The verdict-first report (spec 5), with its A4 print layout. It only shows a
 * built payload; nothing here builds or evaluates a report.
 */
export function ReportView(props: ReportViewProps) {
  const { payload, mode } = props;
  const { view } = payload;
  const read = useOurRead(
    view.facts,
    view.templateRead,
    props.readToken ?? null,
    readEnabled,
  );
  return (
    <>
      <ReportToolbar
        note={props.toolbarNote ?? toolbarNote(mode)}
        onEdit={props.onEdit}
      />
      {/* The print layout replaces the screen report on paper. */}
      <article className={`${styles.page} ${styles.screenOnly}`}>
        <ReportBody {...props} read={read} />
      </article>
      {mode === "sample" && <SampleCta />}
      <PrintReport
        view={view}
        profile={payload.profile}
        asOf={payload.asOf}
        source={payload.source}
        read={read}
      />
    </>
  );
}
