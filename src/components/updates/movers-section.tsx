import type { MoversView } from "@/lib/updates/data-view";
import { MoveList } from "./move-list";
import { RecapBand, type BandTone } from "./recap-band";
import { SectionHead } from "./section-head";
import styles from "./movers-section.module.css";

const HEADING_ID = "movers-heading";

/** The round's cut-off moves beside the 189 pools that moved most. */
export function MoversSection({
  tone,
  movers,
}: {
  tone: BandTone;
  movers: MoversView;
}) {
  const lists = [
    movers.cutoffs?.fell,
    movers.cutoffs?.rose,
    movers.pool?.fell,
    movers.pool?.rose,
  ].filter((list) => list !== undefined);
  return (
    <RecapBand id="movers" tone={tone} labelledBy={HEADING_ID}>
      <SectionHead
        headingId={HEADING_ID}
        kicker="Biggest movers"
        title="Which occupations moved most"
        lead={movers.lead}
      />
      <div className={styles.lists}>
        {lists.map((list) => (
          <MoveList key={list.heading} list={list} />
        ))}
      </div>
    </RecapBand>
  );
}
