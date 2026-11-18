import type { Tile } from "../../lib/state-outlook/view";
import styles from "./state-tile.module.css";

type Props = {
  tile: Tile;
  groupLabel: string;
  onOpen: (href: string) => void;
};

/** One jurisdiction: colour shows the group, the label always says it too. */
export function StateTile({ tile, groupLabel, onOpen }: Props) {
  return (
    <a
      className={`${styles.tile} ${styles[tile.group]}`}
      href={tile.href}
      onClick={(event) => {
        event.preventDefault();
        onOpen(tile.href);
      }}
    >
      <span className={styles.code}>{tile.label}</span>
      <span className={styles.group}>{groupLabel}</span>
      <span className={styles.fragment}>{tile.fragment}</span>
      <span className={styles.cue}>See the reasons</span>
    </a>
  );
}
