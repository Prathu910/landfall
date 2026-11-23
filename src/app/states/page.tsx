import Link from "next/link";
import { Info, MapPinned } from "lucide-react";
import { stateRuleData } from "@/components/data/state-rule-data";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { StateCard } from "@/components/states/state-card";
import { StateMap } from "@/components/states/state-map";
import { statePrograms } from "@/data/states";
import { buildStateCards } from "@/lib/states-page/state-cards";
import styles from "./states-page.module.css";

export const metadata = { title: "State and territory pathways" };

export default function StatesPage() {
  const cards = buildStateCards(statePrograms, stateRuleData);
  const year = stateRuleData.rules.programYear.replace("-", "–");
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb="States"
          eyebrow="190 and 491 nomination"
          icon={MapPinned}
          title="State and territory nomination programs"
          intro="Federal points are one part. Each state and territory has its own criteria, priorities and selection process for nomination."
          meta={[
            `${cards.length} states and territories`,
            `${year} program year`,
          ]}
        />
        <div className={styles.layout}>
          <aside className={styles.side}>
            <div className={styles.mapPanel}>
              <StateMap />
            </div>
            <nav
              className={styles.jump}
              aria-label="Jump to a state or territory"
            >
              {cards.map((card) => (
                <a key={card.code} href={`#${card.anchor}`}>
                  <abbr title={card.name}>{card.code}</abbr>
                </a>
              ))}
            </nav>
            <div className={styles.notice}>
              <Info size={17} aria-hidden />
              <div>
                <p>
                  Sourced program summaries. A state’s system is separate from
                  federal points. Places, pathways and opening conditions can
                  change; these summaries do not establish personal eligibility.
                </p>
                <p>
                  To see whether your occupation is on each state’s list, open
                  its <Link href="/occupations/">occupation page</Link>.
                </p>
              </div>
            </div>
          </aside>
          <div className={styles.cards}>
            {cards.map((card) => (
              <StateCard key={card.code} card={card} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
