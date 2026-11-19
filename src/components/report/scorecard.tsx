import {
  AT_SCORE_LABEL,
  LOADING_HEADLINE,
  POINTS_UNIT,
  type Scorecard,
  type ScorecardCard,
} from "../../lib/report/scorecard";
import type { DataSays } from "../../lib/report/report-view";
import { Reveal } from "../reveal";
import { DataSaysDetails } from "./data-says";
import { NoteWithLink } from "./note-with-link";
import styles from "./scorecard.module.css";

function Card({ card, loading }: { card: ScorecardCard; loading: boolean }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{card.title}</h3>
      {loading ? null : (
        <>
          <span className={`${styles.chip} ${styles[card.chip.tone]}`}>
            {card.chip.label}
          </span>
          <p className={styles.sentence}>{card.sentence}</p>
        </>
      )}
      <p className={styles.points}>
        <span className={styles.pointsValue}>{card.points}</span> {POINTS_UNIT}
        {card.pointsNote ? (
          <span className={styles.pointsNote}> {card.pointsNote}</span>
        ) : null}
      </p>
      {loading ? null : (
        <>
          {card.ahead ? (
            <p className={styles.row}>
              <span>{card.aheadLabel}</span>
              <b>{card.ahead}</b>
            </p>
          ) : null}
          {card.atScore ? (
            <p className={styles.row}>
              <span>{AT_SCORE_LABEL}</span>
              <b>{card.atScore}</b>
            </p>
          ) : null}
          {card.href ? (
            <a className={styles.link} href={card.href}>
              {card.visa} details
            </a>
          ) : null}
        </>
      )}
    </article>
  );
}

/** "What the data says": the bottom line, the three visas, then the chart, EOIs like yours and the levers. */
export function RealityScorecard({
  scorecard,
  dataSays = null,
}: {
  scorecard: Scorecard;
  dataSays?: DataSays | null;
}) {
  const loading = scorecard.headline === LOADING_HEADLINE;
  return (
    <section
      id="reality-check"
      aria-labelledby="reality-check-heading"
      className={styles.section}
    >
      <Reveal>
        <div className={styles.strip}>
          <p className={styles.eyebrow}>What the data says</p>
          <h2 id="reality-check-heading" className={styles.headline}>
            {scorecard.headline}
          </h2>
          {loading || !scorecard.detail ? null : (
            <p className={styles.detail}>{scorecard.detail}</p>
          )}
          {loading ? null : (
            <p className={styles.source}>{scorecard.sourceLine}</p>
          )}
        </div>
        <div className={styles.grid}>
          {scorecard.cards.map((card) => (
            <Card key={card.visa} card={card} loading={loading} />
          ))}
        </div>
        {loading || !scorecard.queueNote ? null : (
          <NoteWithLink note={scorecard.queueNote} className={styles.overlap} />
        )}
        {loading ? null : (
          <p className={styles.overlap}>{scorecard.overlapNote}</p>
        )}
        {loading || !dataSays ? null : <DataSaysDetails says={dataSays} />}
      </Reveal>
    </section>
  );
}
