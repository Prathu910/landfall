import Link from "next/link";
import {
  LOADING_HEADLINE,
  type Scorecard,
  type ScorecardCard,
} from "../../lib/report/scorecard";
import { Reveal } from "../reveal";
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
        <span className={styles.pointsValue}>{card.points}</span> points
        {card.pointsNote ? (
          <span className={styles.pointsNote}> {card.pointsNote}</span>
        ) : null}
      </p>
      {loading ? null : (
        <>
          {card.ahead ? (
            <p className={styles.row}>
              <span>Ahead of you</span>
              <b>{card.ahead}</b>
            </p>
          ) : null}
          {card.atScore ? (
            <p className={styles.row}>
              <span>At your score</span>
              <b>{card.atScore}</b>
            </p>
          ) : null}
          <Link className={styles.link} href={card.href}>
            {card.title.split(" ")[0]} details
          </Link>
        </>
      )}
    </article>
  );
}

export function RealityScorecard({ scorecard }: { scorecard: Scorecard }) {
  const loading = scorecard.headline === LOADING_HEADLINE;
  return (
    <section
      id="reality-check"
      aria-labelledby="reality-check-heading"
      className={styles.section}
    >
      <Reveal>
        <div className={styles.strip}>
          <p className={styles.eyebrow}>Your reality check</p>
          <h2 id="reality-check-heading" className={styles.headline}>
            {scorecard.headline}
          </h2>
          {loading ? null : (
            <p className={styles.source}>{scorecard.sourceLine}</p>
          )}
        </div>
        <div className={styles.grid}>
          {scorecard.cards.map((card) => (
            <Card key={card.visa} card={card} loading={loading} />
          ))}
        </div>
        {loading ? null : (
          <p className={styles.overlap}>{scorecard.overlapNote}</p>
        )}
      </Reveal>
    </section>
  );
}
