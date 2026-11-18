import { motion } from "motion/react";
import { ArrowUpRight, CheckCircle2, Info } from "lucide-react";
import type { PointsResult } from "@/lib/migration";
import styles from "./points-audit.module.css";

function EligibilityNotice({ result }: { result: PointsResult }) {
  return (
    <div
      className={`notice ${styles.eligibility} ${result.eligible === false ? "warning" : ""}`}
    >
      {result.eligible === true ? (
        <CheckCircle2 size={17} />
      ) : (
        <Info size={17} />
      )}
      <p>
        <strong>
          {result.eligible === false
            ? "Some basic checks need attention."
            : result.eligible === null
              ? "Some evidence still needs checking."
              : "Age, English and assessment checks show no issue."}
        </strong>{" "}
        These checks cover only part of the visa requirements.{" "}
        {result.base < 65
          ? "The 189 estimate is below the current 65-point threshold."
          : "Meeting 65 points does not guarantee an invitation."}{" "}
        <a
          className="source-link"
          href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/expression-of-interest"
          target="_blank"
          rel="noreferrer"
        >
          Official requirements
        </a>
      </p>
    </div>
  );
}

export function PointsAudit({
  result,
  label,
}: {
  result: PointsResult;
  label: string;
}) {
  return (
    <section className="report-section" id="points">
      <span className="section-label">{label}</span>
      <h2>
        Every point, <em>accounted for.</em>
      </h2>
      <EligibilityNotice result={result} />
      <p>
        Your self-reported score is {result.base} federal points
        {result.missing.length ? " (partial: some answers are incomplete)" : ""}
        , separated into the categories behind it.
      </p>
      {result.categories.map((c) => (
        <div className="audit-row" key={c.key}>
          <span>{c.label}</span>
          <div className="audit-bar" aria-hidden="true">
            <motion.span
              initial={false}
              animate={{ width: `${(c.points / c.max) * 100}%` }}
            />
          </div>
          <span>
            {c.points}
            <span className="subtle"> / {c.max}</span>
          </span>
        </div>
      ))}
      <p className="data-caption">
        Employment points are combined and capped at 20. Highest qualification
        points count once.{" "}
        <a
          className="source-link"
          href="https://immi.homeaffairs.gov.au/supporting/Pages/Work/190-points-table.aspx"
          target="_blank"
          rel="noreferrer"
        >
          Official points table <ArrowUpRight size={11} />
        </a>
      </p>
    </section>
  );
}
