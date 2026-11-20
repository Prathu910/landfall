"use client";
import Link from "next/link";
import type { CalculationSummary } from "@/lib/submissions/contract";
import { FEEDBACK_CONTEXT_KEY } from "@/lib/submissions/feedback-context";
import styles from "./feedback.module.css";
export function ReportFeedback({
  summary,
}: {
  summary: CalculationSummary | null;
}) {
  return (
    <aside className={styles.prompt} aria-label="Help improve MigrateLens">
      <p>Was this useful?</p>
      <Link
        href="/feedback/"
        onClick={() => {
          try {
            sessionStorage.removeItem(FEEDBACK_CONTEXT_KEY);
            if (summary)
              sessionStorage.setItem(
                FEEDBACK_CONTEXT_KEY,
                JSON.stringify({ summary, created_at: Date.now() }),
              );
          } catch {
            /* Generic feedback works when browser storage is unavailable. */
          }
        }}
      >
        Tell us what to improve →
      </Link>
    </aside>
  );
}
