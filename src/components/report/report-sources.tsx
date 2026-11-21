import Link from "next/link";
import type { ReportSource } from "@/lib/data/report-source";
import { formatDate } from "@/lib/migration";
import styles from "./report-sources.module.css";

/** Where every figure comes from; the evidence section and the printed appendix share it. */
export function ReportSources({ source }: { source: ReportSource }) {
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
