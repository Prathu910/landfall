import type { StateSectionView, StateTile } from "@/lib/updates/state-view";
import { OccupationLink } from "./occupation-link";
import { RecapBand, type BandTone } from "./recap-band";
import parts from "./recap-parts.module.css";
import { SectionHead } from "./section-head";
import { StateRecapMap } from "./state-recap-map";
import styles from "./state-section.module.css";

const STAMP_BOTTOM = { "190": "NOMINATED", "491": "REGIONAL" } as const;

function Tile({ tile }: { tile: StateTile }) {
  return (
    <li className={styles.tile}>
      <p className={styles.state}>
        <span>{tile.name}</span>
        <i className={styles[`swatch${tile.shade}`]} aria-hidden="true" />
      </p>
      <p className={styles.figure}>{tile.figure}</p>
      <p className={styles.detail}>
        {tile.top && (
          <>
            {tile.top.label}:{" "}
            <OccupationLink occupation={tile.top.occupation} /> (
            {tile.top.figure})
            <br />
          </>
        )}
        {tile.hidden}
        {tile.previous && (
          <>
            <br />
            {tile.previous}
          </>
        )}
      </p>
    </li>
  );
}

/** "New South Wales at least 790; …", the map's text alternative. */
function mapDescription(view: StateSectionView): string {
  const states = view.tiles.map((t) => `${t.name} ${t.figure}`).join("; ");
  return `Map of Australia: ${view.heading}. ${states}.`;
}

/** One visa's invitations by state: the map, a tile per state, nominations. */
export function StateSection({
  tone,
  view,
}: {
  tone: BandTone;
  view: StateSectionView;
}) {
  const headingId = `s${view.visa}-heading`;
  const { notRecorded, nominations } = view;
  return (
    <RecapBand id={`s${view.visa}`} tone={tone} labelledBy={headingId}>
      <SectionHead
        headingId={headingId}
        kicker={view.label}
        title={view.heading}
        lead={view.lead}
        stamp={{
          top: "SUBCLASS",
          word: view.visa,
          bottom: STAMP_BOTTOM[view.visa],
        }}
      />
      <div className={styles.layout}>
        <figure className={`${parts.card} ${styles.mapCard}`}>
          <StateRecapMap view={view} description={mapDescription(view)} />
          <figcaption className={styles.legend}>
            {view.legend.map((item) => (
              <span key={item.shade}>
                <i
                  className={styles[`swatch${item.shade}`]}
                  aria-hidden="true"
                />
                {item.label}
              </span>
            ))}
          </figcaption>
        </figure>
        <ul className={styles.tiles}>
          {view.tiles.map((tile) => (
            <Tile key={tile.state} tile={tile} />
          ))}
          <li className={`${styles.tile} ${styles.notRecorded}`}>
            <p className={styles.state}>{notRecorded.label}</p>
            <p className={styles.figure}>{notRecorded.figure}</p>
            <p className={styles.detail}>
              {notRecorded.hidden && (
                <>
                  {notRecorded.hidden}
                  <br />
                </>
              )}
              {notRecorded.note}
            </p>
          </li>
        </ul>
      </div>
      {nominations && (
        <div className={`${parts.card} ${styles.nominations}`}>
          {/* A scrolling region takes focus so it scrolls by keyboard. */}
          <div
            className={styles.nominationsScroll}
            tabIndex={0}
            role="region"
            aria-label={nominations.heading}
          >
            <table className={parts.table}>
              <caption>{nominations.heading}</caption>
              <thead>
                <tr>
                  {nominations.cells.map((cell) => (
                    <th key={cell.state} scope="col">
                      {cell.state}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {nominations.cells.map((cell) => (
                    <td key={cell.state}>{cell.value}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className={parts.cap}>{nominations.caption}</p>
        </div>
      )}
    </RecapBand>
  );
}
