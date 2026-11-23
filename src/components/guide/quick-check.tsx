"use client";
import { useEffect, useState } from "react";
import { federalList } from "@/components/data/federal-list";
import { FormTheme } from "@/components/forms/form-theme-provider";
import type { Visa } from "@/lib/data/types";
import {
  EMPTY_ANSWERS,
  quickCheck,
  type QuickAnswers,
} from "@/lib/guide/quick-check";
import { localToday } from "@/lib/migration";
import { useGuideAnswers, useOccupationFromUrl } from "./guide-store";
import { QuickCheckForm } from "./quick-check-form";
import { QuickCheckResult } from "./quick-check-result";
import styles from "./quick-check.module.css";

/**
 * The embedded points calculator and basic requirements check. Answers stay
 * in memory; only the occupation code can travel, to /check/.
 */
export function QuickCheck({
  buildDate,
  focusVisa,
  evidenceAnchor,
}: {
  /** The static build's date, used until the reader's own date is read. */
  buildDate: string;
  /** On a visa page, that visa leads the result. */
  focusVisa?: Visa;
  /** The occupation page section with this visa's evidence. */
  evidenceAnchor?: string;
}) {
  useOccupationFromUrl();
  const { occupation } = useGuideAnswers();
  const [answers, setAnswers] = useState<QuickAnswers>(EMPTY_ANSWERS);
  const [asOf, setAsOf] = useState(buildDate);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the reader's local date is only known after hydration
    setAsOf(localToday());
  }, []);
  const merged = { ...answers, occupation };
  const result = quickCheck(merged, asOf, federalList);
  return (
    <FormTheme>
      <div className={styles.quick}>
        <QuickCheckForm
          answers={merged}
          onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
        />
        {/* Phones: the running total stays in view, on one line, while
            answering; the full result (announced politely) follows the form. */}
        <p className={styles.tally} aria-hidden="true">
          {result.answered
            ? `189: ${result.points["189"]} · 190: ${result.points["190"]} · 491: ${result.points["491"]}`
            : "Answer to see your points"}
        </p>
        <QuickCheckResult
          result={result}
          occupation={occupation}
          focusVisa={focusVisa}
          evidenceAnchor={evidenceAnchor}
        />
      </div>
    </FormTheme>
  );
}
