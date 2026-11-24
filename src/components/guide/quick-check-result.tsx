"use client";
import Link from "next/link";
import { Check, Circle, Clock, X } from "lucide-react";
import { occupationIndex } from "@/components/data/occupation-index";
import { fullReportHref } from "@/components/home/try-it-href";
import type { Visa } from "@/lib/data/types";
import type {
  BasicCheck,
  CheckStatus,
  QuickResult,
} from "@/lib/guide/quick-check";
import { occupationPath } from "@/lib/occupation-page/slug";
import { joinWords } from "@/lib/state-outlook/context";
import { ConversionBlock } from "./conversion-block";
import styles from "./quick-check.module.css";

const VISAS: Visa[] = ["189", "190", "491"];
const STATUS_TEXT: Record<CheckStatus, string> = {
  met: "Met",
  "not-yet": "Not yet",
  "not-met": "Not met",
  unknown: "Not answered",
};

function StatusIcon({ status }: { status: CheckStatus }) {
  const Icon =
    status === "met"
      ? Check
      : status === "not-met"
        ? X
        : status === "not-yet"
          ? Clock
          : Circle;
  return <Icon size={16} aria-hidden />;
}

function CheckItem({ check }: { check: BasicCheck }) {
  return (
    <li className={styles.check} data-status={check.status}>
      <StatusIcon status={check.status} />
      <span>
        <strong>{check.label}</strong>
        <span className="sr-only">: {STATUS_TEXT[check.status]}.</span>{" "}
        <span className={styles.checkDetail}>{check.detail}</span>
      </span>
    </li>
  );
}

/** The per-visa checks as a small grid: rows are checks, columns are visas. */
function VisaChecks({ checks }: { checks: BasicCheck[] }) {
  const rows = [
    { id: "occupation", label: "On the Home Affairs list" },
    { id: "points", label: "65 points (190 and 491 with nomination)" },
  ];
  return (
    <table className={styles.visaChecks}>
      <caption className="sr-only">Checks for each visa</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="sr-only">Check</span>
          </th>
          {VISAS.map((visa) => (
            <th key={visa} scope="col">
              {visa}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope="row">{row.label}</th>
            {VISAS.map((visa) => {
              const check = checks.find(
                (c) => c.id === row.id && c.visa === visa,
              );
              if (!check) return <td key={visa} />;
              return (
                <td key={visa} data-status={check.status}>
                  <StatusIcon status={check.status} />
                  <span className={styles.cellText}>
                    {STATUS_TEXT[check.status]}
                  </span>
                  {/* Read out, not shown: e.g. "62 points: 3 short." */}
                  <span className="sr-only">: {check.detail}</span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function summary(result: QuickResult): string {
  if (result.visasMeetingBasics.length > 0) {
    const visas = joinWords(result.visasMeetingBasics, "and");
    return `You meet the basics checked here for ${visas}. That is the starting line, not an invitation.`;
  }
  if (result.checks.some((c) => c.status === "unknown"))
    return "Answer every question to check the basics.";
  return "Not every basic is met yet: see the list.";
}

/** Points per visa, the basic checks and the step to the full check. */
export function QuickCheckResult({
  result,
  occupation,
  focusVisa,
  evidenceAnchor,
}: {
  result: QuickResult;
  occupation: string;
  focusVisa?: Visa;
  evidenceAnchor?: string;
}) {
  const entry = occupationIndex.find((e) => e.code === occupation);
  const order = focusVisa
    ? [focusVisa, ...VISAS.filter((v) => v !== focusVisa)]
    : VISAS;
  const shared = result.checks.filter((c) => !c.visa);
  const perVisa = result.checks.filter((c) => c.visa && c.visa === focusVisa);
  return (
    <div className={styles.result}>
      <ul className={styles.points} aria-label="Your points" aria-live="polite">
        {order.map((visa) => (
          <li key={visa} data-focus={visa === focusVisa || undefined}>
            <span className={styles.pointsVisa}>{visa}</span>
            <span className={styles.pointsValue}>
              {result.answered ? (
                result.points[visa]
              ) : (
                <>
                  <span aria-hidden="true">–</span>
                  <span className="sr-only">not yet calculated</span>
                </>
              )}
            </span>
            <span className={styles.pointsNote}>
              {visa === "189" ? "points" : "with nomination"}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.summary}>{summary(result)}</p>
      <ul className={styles.checks} aria-label="Basic requirements">
        {[...shared, ...perVisa].map((check) => (
          <CheckItem key={`${check.id}-${check.visa ?? "all"}`} check={check} />
        ))}
      </ul>
      {!focusVisa && <VisaChecks checks={result.checks} />}
      <p className={styles.fine}>
        A check of the basics only. The full requirements are on the Home
        Affairs pages linked from each step.
      </p>
      {entry?.hasData && (
        <Link
          className={styles.evidence}
          href={`${occupationPath(entry)}${evidenceAnchor ? `#${evidenceAnchor}` : ""}`}
        >
          See the {focusVisa ? `${focusVisa} ` : ""}evidence for {entry.name}{" "}
          <span aria-hidden="true">→</span>
        </Link>
      )}
      <ConversionBlock
        checkHref={entry ? fullReportHref(entry.code) : "/check/"}
      />
    </div>
  );
}
