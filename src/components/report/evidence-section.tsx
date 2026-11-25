"use client";
import { useRef } from "react";
import type { ReportSource } from "@/lib/data/report-source";
import type { OccupationIndexEntry } from "@/lib/data/types";
import type { PointsResult, Profile } from "@/lib/migration";
import type { Evidence } from "@/lib/outlook/evidence";
import type { OccupationEvidence } from "@/lib/report-evidence";
import type { StateOutlookView } from "@/lib/report/state-outlook-view";
import type { ReportOccupation } from "../data/report-occupation";
import { CohortEvidence } from "./cohort-evidence";
import { CompareSection } from "./compare-section";
import { PoolBars } from "./pool-bars";
import { ReportSources } from "./report-sources";
import { RoundsTable } from "./rounds-table";
import section from "./section.module.css";
import { StateOutlookSection } from "./state-outlook-section";
import { StateTables } from "./state-tables";
import { TrendChart } from "./trend-chart";
import { useOpenOnHash } from "./use-open-on-hash";
import styles from "./evidence-section.module.css";

type Props = {
  evidence: Evidence;
  /** Built with the report; null when the occupation has no published data. */
  stateOutlook: StateOutlookView | null;
  occupation: ReportOccupation;
  profile: Profile;
  points: PointsResult;
  onAnswer?: (patch: Partial<Profile>) => void;
  comparisonIndex: OccupationIndexEntry[];
  initialComparison?: OccupationEvidence;
  fixedComparisons?: OccupationEvidence[];
  source: ReportSource;
};

function Rounds189({ evidence }: { evidence: Evidence }) {
  return (
    <div>
      <h3 className={section.h3}>Every 189 round since 2022</h3>
      <p className={section.sub}>Cut-offs for your occupation, newest first.</p>
      {evidence.rounds ? (
        <RoundsTable you={evidence.rounds.you} rows={evidence.rounds.rows} />
      ) : (
        <p className={section.empty}>{evidence.roundsEmpty}</p>
      )}
    </div>
  );
}

function Pool189({ evidence }: { evidence: Evidence }) {
  return (
    <div>
      <h3 className={section.h3}>The 189 pool by points</h3>
      {evidence.pool ? (
        <>
          <p className={section.sub}>{evidence.pool.note}</p>
          <PoolBars bars={evidence.pool.bars} aria={evidence.pool.aria} />
        </>
      ) : (
        <p className={section.empty}>{evidence.poolEmpty}</p>
      )}
    </div>
  );
}

/** "See the evidence", folded on screen: everything behind the labels above. */
export function EvidenceSection(props: Props) {
  const { evidence, stateOutlook, occupation, profile, points } = props;
  const trend = occupation.status === "ready" ? occupation.evidence.trend : [];
  const detailLoading =
    occupation.status === "ready" && occupation.detail.status === "loading";
  const band = useRef<HTMLElement>(null);
  const fold = useRef<HTMLDetailsElement>(null);
  // A link to #evidence, #sharpen or #state-outlook opens the fold.
  useOpenOnHash(band, fold);
  return (
    <section id="evidence" ref={band} className={section.band}>
      <details ref={fold} className={styles.details}>
        <summary className={styles.summary}>
          See the evidence
          <span className={styles.hint}>
            every round, the pools, EOIs like yours, every state
          </span>
        </summary>
        <div className={styles.grid}>
          <div className={section.two}>
            <Rounds189 evidence={evidence} />
            <div className={styles.stack}>
              <Pool189 evidence={evidence} />
              {evidence.cohort && (
                <CohortEvidence
                  cohort={evidence.cohort}
                  detailLoading={detailLoading}
                />
              )}
            </div>
          </div>
          {evidence.states.length ? (
            <StateTables tables={evidence.states} />
          ) : (
            <p className={section.empty}>{evidence.statesEmpty}</p>
          )}
          {stateOutlook && (
            <StateOutlookSection
              view={stateOutlook}
              profile={profile}
              onAnswer={props.onAnswer}
            />
          )}
          <CompareSection
            occupation={occupation}
            occupationCode={profile.occupation}
            index={props.comparisonIndex}
            initialComparison={props.initialComparison}
            fixedComparisons={props.fixedComparisons}
            score={points.base}
            snapshotDate={props.source.snapshotDate}
            label="OCCUPATION CONTEXT"
          />
          {trend.length > 0 && (
            <div className={styles.trend}>
              <h3 className={section.h3}>
                Twelve months of published 189 totals
              </h3>
              <TrendChart rows={trend} />
              <p className={styles.trendNote}>
                These are published monthly totals. The published data appears
                to include EOIs submitted from about late 2024 onward, so
                earlier months may undercount the pool; treat month-to-month
                rises with caution.
              </p>
            </div>
          )}
          <ReportSources source={props.source} />
        </div>
      </details>
    </section>
  );
}
