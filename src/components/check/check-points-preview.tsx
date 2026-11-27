import Link from "next/link";
import { ChevronDown, Globe2, ShieldCheck } from "lucide-react";
import type { PointsResult } from "@/lib/migration";
import { PassportBackground } from "../report/passport-background";
import styles from "./check-points-preview.module.css";

/** A live points tally, deliberately separate from the report's outlook verdict. */
export function CheckPointsPreview({ result }: { result: PointsResult }) {
  return (
    <aside className={styles.aside} aria-labelledby="points-preview-heading">
      <div className={styles.passport}>
        <PassportBackground />
        <div className={styles.top}>
          <span>
            <Globe2 size={17} aria-hidden /> MigrateLens
          </span>
          <span className={styles.live}>Live estimate</span>
        </div>
        <div className={styles.score}>
          <h2 id="points-preview-heading">
            {result.missing.length
              ? "Your points so far"
              : "Your federal points"}
          </h2>
          <div
            className={styles.total}
            role="status"
            aria-label={`${result.base} points before nomination`}
          >
            <strong>{result.base}</strong>
            <span>
              points
              <br />
              before nomination
            </span>
          </div>
          <p className={styles.caption}>Your answers build the picture.</p>
        </div>
        <div className={styles.visas} aria-label="Estimated points by visa">
          <div>
            <span>189</span>
            <strong>{result.base}</strong>
            <small>Independent</small>
          </div>
          <div>
            <span>190</span>
            <strong>{result.subclass190}</strong>
            <small>With nomination</small>
          </div>
          <div>
            <span>491</span>
            <strong>{result.subclass491}</strong>
            <small>If nominated / sponsored</small>
          </div>
        </div>
        <p className={styles.visaNote}>
          190 adds 5 points; provisional 491 adds 15. Nomination or sponsorship
          is not automatic.
        </p>
        <details className={styles.breakdown}>
          <summary>
            Where your points come from
            <ChevronDown size={16} aria-hidden />
          </summary>
          <dl>
            {result.categories.map((category) => (
              <div key={category.key}>
                <dt>{category.label}</dt>
                <dd>{category.points}</dd>
              </div>
            ))}
          </dl>
        </details>
        <p className={styles.note}>
          Points alone don’t establish eligibility or predict an invitation.
          Your report adds the published occupation evidence.
        </p>
      </div>
      <div className={styles.privacy}>
        <ShieldCheck size={18} aria-hidden />
        <p>
          Your free result is calculated in this browser and sends us nothing.
          If you claim or buy the full report, your answers and email go to our
          server to build it: see our{" "}
          <Link href="/privacy/">privacy policy</Link>.
        </p>
      </div>
    </aside>
  );
}
