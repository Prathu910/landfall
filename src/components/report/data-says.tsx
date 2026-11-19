import type { CutoffChart, Lever } from "../../lib/report/data-says";
import type { DataSays } from "../../lib/report/report-view";
import styles from "./data-says.module.css";

const at = (value: number, scale: CutoffChart["scale"]) =>
  `${((value - scale.lo) / (scale.hi - scale.lo)) * 100}%`;

/** The last six 189 rounds: a dot per listed cut-off, a ring per round that skipped the occupation, a line for the reader's points. */
function CutoffChartView({ chart }: { chart: CutoffChart }) {
  const { scale } = chart;
  return (
    <figure className={styles.chart}>
      <figcaption className={styles.note}>{chart.note}</figcaption>
      <div className={styles.plot} role="img" aria-label={chart.description}>
        <div className={styles.rows} aria-hidden="true">
          {chart.rounds.map((round) => (
            <div key={round.label} className={styles.row}>
              <span className={styles.month}>{round.label}</span>
              <span
                className={`${styles.track} ${round.cutoff === null ? styles.trackUnlisted : ""}`}
              >
                {round.cutoff === null ? (
                  <span className={styles.unlisted}>
                    <span className={styles.ring} />
                    not listed
                  </span>
                ) : (
                  <span
                    className={styles.dot}
                    style={{ left: at(round.cutoff, scale) }}
                    title={`${round.cutoff} points`}
                  />
                )}
              </span>
            </div>
          ))}
          <div className={styles.axis}>
            <span className={styles.month} />
            <span className={styles.track}>
              {scale.ticks.map((tick) => (
                <span
                  key={tick}
                  className={styles.tick}
                  style={{ left: at(tick, scale) }}
                >
                  {tick}
                </span>
              ))}
            </span>
          </div>
          <div className={styles.youLayer}>
            <span className={styles.month} />
            <span className={styles.track}>
              <span
                className={styles.you}
                style={{ left: at(chart.points, scale) }}
              >
                <span className={styles.youLabel}>You · {chart.points}</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}

function LeverList({ title, levers }: { title: string; levers: Lever[] }) {
  if (levers.length === 0) return null;
  return (
    <div className={styles.levers}>
      <h4 className={styles.leverTitle}>{title}</h4>
      <ul>
        {levers.map((lever) => (
          <li key={lever.text} className={styles.lever}>
            <span className={`${styles.effect} ${styles[lever.tone]}`}>
              {lever.effect}
            </span>
            <span>{lever.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "What the data says" below the scorecard cards: the cut-off chart, EOIs like yours and the levers. */
export function DataSaysDetails({ says }: { says: DataSays }) {
  const { chart, like, levers } = says;
  return (
    <div className={styles.details}>
      {chart ? (
        <section className={styles.block} aria-labelledby="cutoffs-heading">
          <h3 id="cutoffs-heading" className={styles.heading}>
            189 cut-offs against your points
          </h3>
          <CutoffChartView chart={chart} />
        </section>
      ) : null}
      {like ? (
        <section className={styles.block} aria-labelledby="like-heading">
          <h3 id="like-heading" className={styles.heading}>
            EOIs like yours
          </h3>
          <p className={styles.like}>
            {like} <a href="#visa-189">See them month by month</a>
          </p>
        </section>
      ) : null}
      {levers.add.length + levers.dated.length > 0 ? (
        <section className={styles.block} aria-labelledby="levers-heading">
          <h3 id="levers-heading" className={styles.heading}>
            What could change it
          </h3>
          <div className={styles.leverGrid}>
            <LeverList title="Points you could add" levers={levers.add} />
            <LeverList title="Dated changes ahead" levers={levers.dated} />
          </div>
        </section>
      ) : null}
      <p className={styles.foot}>
        These counts describe what happened, not your chances. General
        information, not migration advice.
      </p>
    </div>
  );
}

/** The bottom line again, in one paragraph, at the end of the report. */
export function DataSaysRecap({ recap }: { recap: string }) {
  return (
    <section className={styles.recap} aria-labelledby="recap-heading">
      <h2 id="recap-heading" className={styles.recapTitle}>
        What the data says, in short
      </h2>
      <p>{recap}</p>
      <a href="#reality-check">Back to the summary</a>
    </section>
  );
}
