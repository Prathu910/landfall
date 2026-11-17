"use client";
import Link from "next/link";
import { NumberInput, SegmentedControl } from "@mantine/core";
import { Info } from "lucide-react";
import { formatDate } from "@/lib/migration";
import { comparePool, formatInterval, normalizePoolScore } from "@/lib/pool";
import { netPoolChange, type VisaPathway } from "@/lib/report-evidence";
import type { ReportOccupation } from "../data/report-occupation";
import { PoolChart } from "../pool-chart";
import { AnimatedNumber } from "../reveal";
import { LoadingData } from "./loading-data";
import { TrendChart } from "./trend-chart";

type ReadyOccupation = Extract<ReportOccupation, { status: "ready" }>;
type PoolControls = {
  visa: VisaPathway;
  score: number;
  snapshotDate: string;
  onVisaChange: (visa: VisaPathway) => void;
  onScoreChange: (score: number) => void;
};

const VISA_LABEL: Record<VisaPathway, string> = {
  "189": "Skilled Independent",
  "190": "State/territory nominated",
  "491": "State/territory nominated regional",
};

function EmptyPool({ children }: { children: string }) {
  return (
    <div className="report-empty">
      <Info size={18} />
      <p>{children}</p>
    </div>
  );
}

function PublishedPool({
  occupation,
  visa,
  score,
  snapshotDate,
  onVisaChange,
  onScoreChange,
}: PoolControls & {
  occupation: ReadyOccupation & { pool: NonNullable<ReadyOccupation["pool"]> };
}) {
  const { evidence } = occupation;
  const pathway = evidence.pathways.find((p) => p.visa === visa);
  const pool = pathway ? comparePool(pathway, score) : null;
  const trendChange = evidence.trend.length
    ? netPoolChange(evidence.trend[0].total, evidence.trend.at(-1)!.total)
    : null;
  return (
    <>
      <p>
        Compare your score with the same dated snapshot. The 190 and 491 views
        describe national nomination EOI pools; they are not state selection
        rankings.
      </p>
      <div className="pool-controls">
        <SegmentedControl
          aria-label="Visa pool"
          value={visa}
          onChange={(v) => onVisaChange(v as VisaPathway)}
          data={[
            { value: "189", label: "189 Independent" },
            { value: "190", label: "190 Nominated" },
            { value: "491", label: "491 State regional" },
          ]}
        />
        <NumberInput
          label="Comparison score"
          aria-label="Pool comparison score"
          min={0}
          max={150}
          step={5}
          allowDecimal={false}
          clampBehavior="strict"
          value={score}
          onChange={(v) => onScoreChange(normalizePoolScore(Number(v)))}
        />
      </div>
      <p className="report-notes">
        {visa} · {VISA_LABEL[visa]} · Submitted EOIs ·{" "}
        {formatDate(snapshotDate)}
      </p>
      {pathway && pool ? (
        <div className="report-data-layout">
          <div aria-live="polite">
            <span className="pool-metric-label">EOIs WITH HIGHER POINTS</span>
            <span className="report-number">
              <AnimatedNumber value={formatInterval(pool.higher)} />
            </span>
            <p className="data-caption">
              At <strong>{score} points</strong>, another{" "}
              <strong>{formatInterval(pool.same)}</strong> share that score.
              <br />
              Published occupation total:{" "}
              <strong>{formatInterval(pathway.total)}</strong> EOIs.
            </p>
          </div>
          <PoolChart
            occupation={{ name: occupation.pool.name, points: pathway.points }}
            score={score}
          />
        </div>
      ) : (
        <EmptyPool>
          {`No ${visa} submitted EOIs are published for this occupation in this snapshot. No pool comparison has been invented.`}
        </EmptyPool>
      )}
      <div className="notice">
        <Info size={15} />
        <p>
          This is a pool comparison, not your exact queue position.
          Date-of-effect ordering is unavailable. Counts below 20 stay masked;
          EOIs are not unique people.{" "}
          {visa === "491"
            ? "This view includes state/territory nomination, excluding family sponsorship."
            : ""}{" "}
          <Link className="source-link" href="/methodology/#pool">
            How to read the pool
          </Link>
        </p>
      </div>
      <div className="trend-heading">
        <h3>Twelve months, in perspective.</h3>
        <span className="pill">189 occupation totals</span>
      </div>
      <TrendChart rows={evidence.trend} />
      {trendChange && (
        <p className="data-caption">
          Net change from {formatDate(evidence.trend[0].date)} to{" "}
          {formatDate(evidence.trend.at(-1)!.date)}:{" "}
          <strong>{formatInterval(trendChange)} EOIs</strong>. These are
          published monthly totals. A net change does not reveal new entries,
          invitations, withdrawals or score movement separately.
        </p>
      )}
    </>
  );
}

export function PoolSection({
  occupation,
  ...controls
}: PoolControls & { occupation: ReportOccupation }) {
  return (
    <section className="report-section" id="pool">
      <span className="section-label">03 / THE PUBLISHED OCCUPATION POOL</span>
      <h2>
        See the numbers.
        <br />
        <em>Keep the context.</em>
      </h2>
      {occupation.status === "loading" ? (
        <LoadingData />
      ) : occupation.status === "ready" && occupation.pool ? (
        <PublishedPool
          occupation={{ ...occupation, pool: occupation.pool }}
          {...controls}
        />
      ) : occupation.status === "ready" ? (
        <EmptyPool>
          This occupation has no published 189 submitted EOIs in the imported
          snapshot. Your points are available; no pool comparison has been
          invented.
        </EmptyPool>
      ) : (
        <EmptyPool>
          This occupation is not in the imported snapshot. Your points are
          available; no pool comparison has been invented.
        </EmptyPool>
      )}
    </section>
  );
}
