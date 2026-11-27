import { SELLER } from "@/lib/orders/seller";
import type { IssuedStatus } from "./use-issued-report";
import styles from "./issued-report.module.css";

const LINES: Record<Exclude<IssuedStatus, "report">, string> = {
  loading: "Loading your report…",
  revoked: "This report was refunded, so its link no longer opens it.",
  expired: "This report has expired: links work for 12 months after issue.",
  "not-found":
    "We couldn't find a report for this link. Check that you copied the whole link from your email.",
  error: "We couldn't load your report just now. Reload the page to try again.",
};

/** Every state of /report/ other than the report itself. */
export function ReportState({
  status,
  onRetry,
}: {
  status: Exclude<IssuedStatus, "report">;
  onRetry?: () => void;
}) {
  if (status === "loading")
    return (
      <p className={styles.state} role="status">
        {LINES.loading}
      </p>
    );
  return (
    <div className={styles.state}>
      {/* The report's headline is the page's h1; without a report, this is. */}
      <h1 className={styles.stateTitle}>Your PR report</h1>
      <p role="alert">{LINES[status]}</p>
      <p>
        Questions? Write to{" "}
        <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
        {status === "error" ? "." : " with your report number if you have it."}
      </p>
      {status === "error" && onRetry && (
        <button type="button" className={styles.button} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
