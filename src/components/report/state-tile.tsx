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

/** "Rules being checked": our check is still running, not a verdict on the user. */
function ClockIcon() {
  return (
    <svg
      className={styles.icon}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 4.5V8l2.3 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      <span className={styles.group}>
        {tile.group === "unverified" && <ClockIcon />}
        {groupLabel}
      </span>
      {tile.lead ? (
        <>
          <span className={styles.headline}>{tile.lead.headline}</span>
          <span className={styles.detail}>{tile.lead.detail}</span>
        </>
      ) : (
        <span className={styles.fragment}>{tile.fragment}</span>
      )}
      <span className={styles.cue}>See the reasons</span>
    </a>
  );
}
