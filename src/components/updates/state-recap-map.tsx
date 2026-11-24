import geometry from "@/components/home/atlas-map-geometry.json";
import type { StateCode } from "@/lib/data/types";
import type { StateSectionView } from "@/lib/updates/state-view";
import styles from "./state-recap-map.module.css";

/** Drawing order: ACT last, so its circle sits on top of NSW. */
const ORDER: readonly StateCode[] = [
  "WA",
  "NT",
  "SA",
  "QLD",
  "NSW",
  "VIC",
  "TAS",
  "ACT",
];
/** The ACT's circle, drawn off the coast like the homepage atlas. */
const ACT_CIRCLE = { x: 650, y: 420, r: 26 };
/** Each label's offset from its region's centre, in map units (mockup). */
const NUDGE: Record<StateCode, [number, number]> = {
  NSW: [10, 8],
  VIC: [-12, 14],
  TAS: [-6, 22],
  ACT: [0, 0],
  QLD: [10, 10],
  SA: [-6, 0],
  NT: [0, 10],
  WA: [16, 10],
};
const TILT = (-8 * Math.PI) / 180;

/**
 * Where a map point lands once the shapes are tilted (the group transform
 * `translate(42 28) rotate(-8 320 260)`); labels are placed upright there.
 */
function placed(x: number, y: number): { x: number; y: number } {
  const dx = x - 320;
  const dy = y - 260;
  return {
    x: dx * Math.cos(TILT) - dy * Math.sin(TILT) + 362,
    y: dx * Math.sin(TILT) + dy * Math.cos(TILT) + 288,
  };
}

function labelPoint(state: StateCode) {
  if (state === "ACT") return placed(ACT_CIRCLE.x, ACT_CIRCLE.y);
  const { x, y } = geometry.regions[state];
  const [nudgeX, nudgeY] = NUDGE[state];
  return placed(x + nudgeX, y + nudgeY);
}

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
          <path id={`${id}-country`} d={geometry.country} />
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
        <g transform="translate(42 28) rotate(-8 320 260)">
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
          {ORDER.map((state) => {
            const shade = styles[`band${view.map[state].shade}`];
            if (state !== "ACT") {
              return (
                <path
                  key={state}
                  d={geometry.regions[state].path}
                  className={`${styles.region} ${shade}`}
                />
              );
            }
            return (
              <g key={state}>
                <path
                  d={geometry.regions.ACT.connector}
                  className={styles.connector}
                />
                <path
                  d={geometry.regions.ACT.path}
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
        {ORDER.map((state) => (
          <Label key={state} state={state} label={view.map[state]} />
        ))}
      </svg>
    </div>
  );
}
