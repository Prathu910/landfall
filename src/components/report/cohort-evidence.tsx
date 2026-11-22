import type { CohortEvidence as Cohort } from "@/lib/outlook/evidence";
import { LoadingData } from "./loading-data";
import { OutcomeBar } from "./outcome-bar";
import section from "./section.module.css";
import styles from "./evidence-tables.module.css";

const DETAIL_FAILED =
  "Published outcomes by submission month couldn't be loaded, so they're left out here. Everything else on this page comes from the main data file.";

function Outcomes({
  cohort,
  detailLoading,
}: {
  cohort: Cohort;
  detailLoading: boolean;
}) {
  const { outcomes } = cohort;
  if (outcomes.kind === "loading") {
    return detailLoading ? (
      <LoadingData />
    ) : (
      <p className={section.empty}>{DETAIL_FAILED}</p>
    );
  }
  if (outcomes.kind !== "ready") {
    return <p className={section.empty}>{outcomes.text}</p>;
  }
  return (
    <>
      <p>{outcomes.sentence}</p>
      <OutcomeBar view={outcomes} withCounts />
      <span className={styles.note}>
        {outcomes.statusNote} {outcomes.closedNote}
      </span>
    </>
  );
}

/** What happened to EOIs from one submission month, as published. */
export function CohortEvidence({
  cohort,
  detailLoading,
}: {
  cohort: Cohort;
  detailLoading: boolean;
}) {
  return (
    <div>
      <h3 className={section.h3}>{cohort.title}</h3>
      <p className={section.sub}>{cohort.sub}</p>
      <Outcomes cohort={cohort} detailLoading={detailLoading} />
    </div>
  );
}
