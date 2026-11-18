import type { TrendEvidence } from "@/lib/report-evidence";
import type { PanelViews } from "@/lib/report/report-view";
import type { ReportOccupation } from "../data/report-occupation";
import { LoadingData } from "./loading-data";
import { Panel189 } from "./panel-189";
import { PanelNominated } from "./panel-nominated";
import { TrendChart } from "./trend-chart";
import styles from "./visa-panels.module.css";

/** The 189 monthly totals, with the coverage caveat that always travels with them. */
function Trend189({ rows }: { rows: TrendEvidence[] }) {
  if (!rows.length) return null;
  return (
    <div className={styles.trend}>
      <h4 className={styles.trendHeading}>
        Twelve months of published 189 totals
      </h4>
      <TrendChart rows={rows} />
      <p className={styles.trendNote}>
        These are published monthly totals. The published data appears to
        include EOIs submitted from about late 2024 onward, so earlier months
        may undercount the pool; treat month-to-month rises with caution.
      </p>
    </div>
  );
}

/** The 189, 190 and 491 panels; the scorecard explains when there is no data. */
export function VisaPanels({
  occupation,
  panels,
  source,
}: {
  occupation: ReportOccupation;
  panels: PanelViews | null;
  source: string;
}) {
  if (occupation.status === "loading") return <LoadingData />;
  if (occupation.status !== "ready" || !panels) return null;
  const [panel190, panel491] = panels.nominated;
  return (
    <>
      <Panel189
        whereYouStand={panels.whereYouStand}
        trend={<Trend189 rows={occupation.evidence.trend} />}
        sameScore={panels.sameScore}
        rounds={panels.rounds}
        eois={panels.eois}
        changes={panels.changes}
        source={source}
      />
      <PanelNominated panel={panel190} source={source} />
      <PanelNominated panel={panel491} source={source} />
    </>
  );
}
