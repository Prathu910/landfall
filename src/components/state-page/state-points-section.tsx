import type { PoolView } from "@/lib/updates/data-view";
import { PoolChart } from "@/components/updates/pool-chart";
import { RecapBand, type BandTone } from "@/components/updates/recap-band";
import { SectionHead } from "@/components/updates/section-head";
import styles from "./state-sections.module.css";

const HEADING_ID = "points-heading";

/** The points of EOIs holding an invitation in the data month, per visa. */
export function StatePointsSection({
  tone,
  title,
  lead,
  charts,
}: {
  tone: BandTone;
  title: string;
  lead: string;
  charts: PoolView[];
}) {
  return (
    <RecapBand id="points" tone={tone} labelledBy={HEADING_ID}>
      <SectionHead
        headingId={HEADING_ID}
        kicker="By points"
        title={title}
        lead={lead}
      />
      <div className={styles.pair}>
        {charts.map((chart) => (
          <PoolChart key={chart.heading} pool={chart} />
        ))}
      </div>
    </RecapBand>
  );
}
