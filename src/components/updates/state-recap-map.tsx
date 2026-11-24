import type { StateCode } from "@/lib/data/types";
import type { StateSectionView } from "@/lib/updates/state-view";
import {
  ACT_CIRCLE,
  ATLAS,
  MAP_TILT,
  STATE_DRAW_ORDER,
  labelPoint,
} from "./state-map-geometry";
import styles from "./state-recap-map.module.css";

function Label({
  state,
  label,
}: {
  state: StateCode;
  label: StateSectionView["map"][StateCode];
}) {
  const { x, y } = labelPoint(state);
  const act = state === "ACT";
  // The ACT's name sits above its circle and its figures below.
  const valueY = act ? y + ACT_CIRCLE.r + 4 : y;
  return (
    <>
      <text x={x} y={act ? y - ACT_CIRCLE.r - 10 : y} className={styles.code}>
        <tspan dy={act ? 0 : "-0.9em"}>{state}</tspan>
      </text>
      <text x={x} y={valueY} className={styles.value}>
        <tspan
          x={x}
          dy={act ? "1em" : "0.55em"}
          className={label.big.length > 5 ? styles.bigLong : styles.big}
        >
          {label.big}
        </tspan>
        <tspan x={x} dy="1.15em" className={styles.small}>
          {label.small}
        </tspan>
      </text>
    </>
  );
}

/**
 * The homepage atlas's state shapes, shaded by each state's published floor
 * and labelled with its figure. A labelled image: the same figures are in
 * the tiles beside it.
 */
export function StateRecapMap({
  view,
  description,
}: {
  view: StateSectionView;
  description: string;
}) {
  const id = `map-${view.visa}`;
  return (
    <div className={styles.frame}>
      <svg
        className={styles.map}
        viewBox="20 20 750 530"
        role="img"
        aria-label={description}
      >
        <defs>
          <path id={`${id}-country`} d={ATLAS.country} />
          <filter
            id={`${id}-shadow`}
            x="-30%"
            y="-30%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="11" />
          </filter>
        </defs>
        <g transform={MAP_TILT}>
          <use
            href={`#${id}-country`}
            className={styles.shadow}
            transform="translate(0 29)"
            filter={`url(#${id}-shadow)`}
          />
          <use
            href={`#${id}-country`}
            className={styles.depth1}
            transform="translate(0 15)"
          />
          <use
            href={`#${id}-country`}
            className={styles.depth2}
            transform="translate(0 9)"
          />
          <use
            href={`#${id}-country`}
            className={styles.depth3}
            transform="translate(0 4)"
          />
          {STATE_DRAW_ORDER.map((state) => {
            const shade = styles[`band${view.map[state].shade}`];
            if (state !== "ACT") {
              return (
                <path
                  key={state}
                  d={ATLAS.regions[state].path}
                  className={`${styles.region} ${shade}`}
                />
              );
            }
            return (
              <g key={state}>
                <path
                  d={ATLAS.regions.ACT.connector}
                  className={styles.connector}
                />
                <path
                  d={ATLAS.regions.ACT.path}
                  className={`${styles.region} ${shade}`}
                />
                <circle
                  cx={ACT_CIRCLE.x}
                  cy={ACT_CIRCLE.y}
                  r={ACT_CIRCLE.r}
                  className={`${styles.actCircle} ${shade}`}
                />
              </g>
            );
          })}
        </g>
        {STATE_DRAW_ORDER.map((state) => (
          <Label key={state} state={state} label={view.map[state]} />
        ))}
      </svg>
    </div>
  );
}
