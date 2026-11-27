import type { StatePageView } from "@/lib/state-page/view";
import { RecapBand, type BandTone } from "@/components/updates/recap-band";
import { SectionHead } from "@/components/updates/section-head";
import { StateMonthChart } from "./state-month-chart";
import styles from "./state-sections.module.css";

const HEADING_ID = "months-heading";

/** The last 12 month ends for the 190, then the 491. */
export function StateMonthsSection({
  tone,
  title,
  months,
}: {
  tone: BandTone;
  title: string;
  months: StatePageView["months"];
}) {
  return (
    <RecapBand id="months" tone={tone} labelledBy={HEADING_ID}>
      <SectionHead
        headingId={HEADING_ID}
        kicker="The last 12 months"
        title={title}
        lead={months.lead}
      />
      <div className={styles.stack}>
        {months.cards.map((card) => (
          <StateMonthChart key={card.visa} card={card} />
        ))}
      </div>
    </RecapBand>
  );
}
