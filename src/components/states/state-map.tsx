import type { StateCode } from "@/lib/data/types";
import geometry from "@/components/home/atlas-map-geometry.json";
import styles from "./state-map.module.css";

// The homepage atlas's state shapes, drawn statically: a pointer shortcut to
// each card. The labelled jump links beside it are the accessible route, so
// the map is hidden from assistive tech and the tab order.
const ORDER: StateCode[] = [
  "WA",
  "NT",
  "SA",
  "QLD",
  "NSW",
  "VIC",
  "TAS",
  "ACT",
];

export function StateMap() {
  return (
    <svg className={styles.map} viewBox="20 20 720 520" aria-hidden="true">
      <g transform="translate(42 28) rotate(-8 320 260)">
        {ORDER.map((state) => {
          const shape = geometry.regions[state];
          return (
            <a
              key={state}
              href={`#${state.toLowerCase()}`}
              tabIndex={-1}
              className={styles.region}
            >
              <path className={styles.face} d={shape.path} />
              {state === "ACT" && (
                <>
                  <path
                    className={styles.connector}
                    d={geometry.regions.ACT.connector}
                  />
                  <circle className={styles.face} cx="650" cy="420" r="24" />
                </>
              )}
              <text className={styles.label} x={shape.x} y={shape.y}>
                {state}
              </text>
            </a>
          );
        })}
      </g>
    </svg>
  );
}
