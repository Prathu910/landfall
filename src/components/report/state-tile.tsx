import type { Tile } from "../../lib/state-outlook/view";
import styles from "./state-tile.module.css";

type Props = {
  tile: Tile;
  groupLabel: string;
  /** Opens the tile's panel in place; without it the tile is a plain link to `href`. */
  onOpen?: (href: string) => void;
  /** Where the link goes, when it isn't the tile's own panel on this page. */
  href?: string;
};

/** One jurisdiction: colour shows the group, the label always says it too. */
export function StateTile({ tile, groupLabel, onOpen, href }: Props) {
  return (
    <a
      className={`${styles.tile} ${styles[tile.group]}`}
      href={href ?? tile.href}
      onClick={
        onOpen
          ? (event) => {
              event.preventDefault();
              onOpen(tile.href);
            }
          : undefined
      }
    >
      <span className={styles.code}>{tile.label}</span>
      <span className={styles.group}>{groupLabel}</span>
      <span className={styles.fragment}>{tile.fragment}</span>
      <span className={styles.cue}>See the reasons</span>
    </a>
  );
}
