"use client";
import { useMemo } from "react";
import Link from "next/link";
import type { ReportSource } from "@/lib/data/report-source";
import type { OccupationIndexEntry } from "@/lib/data/types";
import { formatDate } from "@/lib/migration";
import type { PointsResult, Profile } from "@/lib/migration";
import type { Evidence } from "@/lib/outlook/evidence";
import type { OccupationEvidence } from "@/lib/report-evidence";
import { buildStateOutlookView } from "@/lib/report/state-outlook-view";
import type { ReportOccupation } from "../data/report-occupation";
import { stateRuleData } from "../data/state-rule-data";
import { CohortEvidence } from "./cohort-evidence";
import { CompareSection } from "./compare-section";
import { PoolBars } from "./pool-bars";
import { RoundsTable } from "./rounds-table";
import section from "./section.module.css";
import { StateOutlookSection } from "./state-outlook-section";
import { StateTables } from "./state-tables";
import { TrendChart } from "./trend-chart";
import styles from "./evidence-section.module.css";

type Props = {
  evidence: Evidence;
  occupation: ReportOccupation;
  profile: Profile;
  asOf: string;
  points: PointsResult;
  onAnswer?: (patch: Partial<Profile>) => void;
  comparisonIndex: OccupationIndexEntry[];
  initialComparison?: OccupationEvidence;
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

function Sources({ source }: { source: ReportSource }) {
  return (
    <p className={styles.source}>
      Source:{" "}
      <a
        className="source-link"
        href={source.dashboardUrl}
        target="_blank"
        rel="noreferrer"
      >
        Home Affairs SkillSelect dashboard
      </a>{" "}
      (snapshot {formatDate(source.snapshotDate)}, checked{" "}
      {formatDate(source.checkedAt)}) and 189 invitation rounds (
      <a
        className="source-link"
        href={source.roundsUrl}
        target="_blank"
        rel="noreferrer"
      >
        current
      </a>{" "}
      and{" "}
      <a
        className="source-link"
        href={source.previousRoundsUrl}
        target="_blank"
        rel="noreferrer"
      >
        previous
      </a>
      ). Counts are EOIs, and one person can hold several. &quot;Under 20&quot;
      is published as a range, never as a number. State 491 excludes family
      sponsorship.{" "}
      <Link className="source-link" href="/methodology/">
        Methodology and limitations
      </Link>
      .
    </p>
  );
}

/** "See the evidence", folded on screen: everything behind the labels above. */
export function EvidenceSection(props: Props) {
  const { evidence, occupation, profile, asOf, points } = props;
  const core = occupation.status === "ready" ? occupation.core : null;
  const stateView = useMemo(
    () =>
      core
        ? buildStateOutlookView({
            core,
            profile,
            asOf,
            points,
            data: stateRuleData,
          })
        : null,
    [core, profile, asOf, points],
  );
  const trend = occupation.status === "ready" ? occupation.evidence.trend : [];
  const detailLoading =
    occupation.status === "ready" && occupation.detail.status === "loading";
  return (
    <section id="evidence" className={section.band}>
      <details className={styles.details}>
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
          {stateView && (
            <StateOutlookSection
              view={stateView}
              profile={profile}
              onAnswer={props.onAnswer}
            />
          )}
          <CompareSection
            occupation={occupation}
            occupationCode={profile.occupation}
            index={props.comparisonIndex}
            initialComparison={props.initialComparison}
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
          <Sources source={props.source} />
        </div>
      </details>
    </section>
  );
}
