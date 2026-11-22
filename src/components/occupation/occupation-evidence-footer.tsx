import Link from "next/link";
import { formatDate } from "@/lib/migration";
import styles from "./occupation-evidence-footer.module.css";

export function OccupationEvidenceFooter({
  code,
  sourceText,
  checkedAt,
  sources,
  snapshotId,
  federalCheckedAt,
}: {
  code: string;
  sourceText: string;
  checkedAt: string;
  snapshotId: string;
  federalCheckedAt?: string;
  sources: { dashboard: string; currentRounds: string };
}) {
  return (
    <>
      <aside className={styles.bottomCta}>
        <div>
          <p className={styles.sectionLabel}>
            FROM THE OCCUPATION TO YOUR PROFILE
          </p>
          <h2>What does this mean for you?</h2>
          <p>
            Calculate your points, see the EOIs at your score and explore the
            published evidence for your profile.
          </p>
        </div>
        <Link href={`/check/?occupation=${code}`}>
          Check my points, free <span aria-hidden="true">↗</span>
        </Link>
      </aside>
      <footer className={styles.sources}>
        <h2>Sources & limitations</h2>
        <p>
          {sourceText}. Last updated {formatDate(checkedAt)}.
        </p>
        <p>
          <a href={sources.dashboard} target="_blank" rel="noreferrer">
            Official SkillSelect dashboard ↗
          </a>
          <a href={sources.currentRounds} target="_blank" rel="noreferrer">
            Home Affairs invitation rounds ↗
          </a>
          <Link href="/methodology/">How we read the data</Link>
        </p>
        <p>
          Masked counts stay under 20 (0–19); an unpublished count is not zero.
          {federalCheckedAt && (
            <> Federal-list source checked {formatDate(federalCheckedAt)}.</>
          )}{" "}
          State-list links in the table lead to official program sources; their
          rules can change.
        </p>
        <p>Snapshot ID: {snapshotId}</p>
        <p>
          General information, not migration advice. MigrateLens is not a
          registered migration agent.
        </p>
      </footer>
    </>
  );
}
