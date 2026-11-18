import type { RoundsBlock, RoundTile } from "../../lib/report/panel-189";
import styles from "./panel-189.module.css";

function Tile({ tile }: { tile: RoundTile }) {
  return (
    <li
      className={`${styles.tile} ${tile.listed ? styles.listed : styles.muted}`}
    >
      <span className={styles.tileDate}>{tile.label}</span>
      <b className={styles.tileValue}>{tile.value}</b>
    </li>
  );
}

export function RoundsTiles({ rounds }: { rounds: RoundsBlock }) {
  return (
    <>
      <ul className={styles.tiles}>
        {rounds.tiles.map((tile) => (
          <Tile key={tile.date} tile={tile} />
        ))}
      </ul>
      <p className={styles.note}>{rounds.note}</p>
      {rounds.skippedNote ? (
        <p className={styles.note}>{rounds.skippedNote}</p>
      ) : null}
      {rounds.all.length > rounds.tiles.length ? (
        <details className={styles.details}>
          <summary>See all rounds</summary>
          <ul className={styles.allRounds}>
            {rounds.all.map((tile) => (
              <li key={tile.date}>
                <span>{tile.label}</span>
                <b>{tile.value}</b>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
