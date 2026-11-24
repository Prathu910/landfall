"use client";
import { useState } from "react";
import { Select } from "@mantine/core";
import { formatDate } from "@/lib/migration";
import { comparePool, formatInterval } from "@/lib/pool";
import { publishedOccupationCode } from "@/lib/data/occupation-url";
import type { OccupationIndexEntry } from "@/lib/data/types";
import type { OccupationEvidence } from "@/lib/report-evidence";
import {
  toReportOccupation,
  unavailableReason,
  type ReportOccupation,
} from "../data/report-occupation";
import { useOccupationCore } from "../data/use-occupation-core";
import styles from "./compare-section.module.css";

const DEFAULT_COMPARISON = "261313";

/** What a card needs: a report occupation, or a preloaded comparison. */
type CardData =
  | { status: "loading" }
  | { status: "ready"; evidence: OccupationEvidence }
  | { status: "unavailable" };

/**
 * A preloaded comparison needs no fetch; any other is loaded on demand. With
 * `fixed` the comparison is always one of them and nothing is ever fetched.
 */
function useComparison(
  code: string,
  index: OccupationIndexEntry[],
  initial: OccupationEvidence | undefined,
  fixed: OccupationEvidence[] | undefined,
): CardData {
  const preloaded =
    fixed?.find((e) => e.code === code) ??
    (initial?.code === code ? initial : null);
  const load = useOccupationCore(
    preloaded || fixed ? null : publishedOccupationCode(code, index),
    index,
  );
  if (preloaded) return { status: "ready", evidence: preloaded };
  return toReportOccupation(load, { status: "idle" });
}

function CompareCard({
  label,
  name,
  occupation,
  loadFailed,
  score,
  snapshotDate,
}: {
  label: string;
  name: string;
  occupation: CardData;
  /** The occupation is published but its file did not load. */
  loadFailed: boolean;
  score: number;
  snapshotDate: string;
}) {
  const pathway =
    occupation.status === "ready"
      ? occupation.evidence.pathways.find((p) => p.visa === "189")
      : undefined;
  return (
    <div className="compare-card">
      <span>{label}</span>
      <h3>{name}</h3>
      {pathway ? (
        <>
          <strong>{formatInterval(comparePool(pathway, score).higher)}</strong>
          <small>
            189 EOIs above {score} points · {formatDate(snapshotDate)}
          </small>
        </>
      ) : occupation.status === "loading" ? (
        <p className={styles.loading} role="status">
          Loading published data…
        </p>
      ) : (
        <p className="data-caption">
          {occupation.status === "unavailable" && loadFailed
            ? "Published data could not be loaded. Try again later."
            : "No imported pool available."}
        </p>
      )}
    </div>
  );
}

export function CompareSection({
  occupation,
  occupationCode,
  index,
  initialComparison,
  fixedComparisons,
  score,
  snapshotDate,
  label,
}: {
  occupation: ReportOccupation;
  occupationCode: string;
  index: OccupationIndexEntry[];
  initialComparison?: OccupationEvidence;
  /** The only occupations the picker offers; none is fetched (the frozen /sample/). */
  fixedComparisons?: OccupationEvidence[];
  score: number;
  snapshotDate: string;
  label: string;
}) {
  const [comparison, setComparison] = useState(
    fixedComparisons &&
      !fixedComparisons.some((e) => e.code === DEFAULT_COMPARISON)
      ? fixedComparisons[0].code
      : DEFAULT_COMPARISON,
  );
  const compared = useComparison(
    comparison,
    index,
    initialComparison,
    fixedComparisons,
  );
  const options = fixedComparisons ?? index;
  const nameOf = (code: string) => options.find((o) => o.code === code)?.name;
  return (
    <section className="report-section" id="compare">
      <span className="section-label">{label}</span>
      <h2>Compare another occupation at your score</h2>
      <p>
        Compare another occupation in this import at your current federal score.
        This is descriptive context; your assessment and occupation eligibility
        are separate requirements.
      </p>
      <Select
        label="Compare an occupation"
        searchable
        value={comparison}
        onChange={(v) => v && setComparison(v)}
        data={options.map((o) => ({
          value: o.code,
          label: `${o.name} · ${o.code}`,
        }))}
      />
      <div className="compare-grid">
        <CompareCard
          label="YOUR NOMINATED OCCUPATION"
          name={nameOf(occupationCode) ?? "Your occupation"}
          occupation={occupation}
          loadFailed={unavailableReason(occupationCode, index) === "loadFailed"}
          score={score}
          snapshotDate={snapshotDate}
        />
        <CompareCard
          label="COMPARISON OCCUPATION"
          name={nameOf(comparison) ?? "Comparison"}
          occupation={compared}
          loadFailed={unavailableReason(comparison, index) === "loadFailed"}
          score={score}
          snapshotDate={snapshotDate}
        />
      </div>
    </section>
  );
}
