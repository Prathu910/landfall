import type { ReactNode } from "react";
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

function Region({
  state,
  linked,
  children,
}: {
  state: StateCode;
  linked: boolean;
  children: ReactNode;
}) {
  if (!linked) return <g>{children}</g>;
  return (
    <a href={`#${state.toLowerCase()}`} tabIndex={-1} className={styles.region}>
      {children}
    </a>
  );
}

/**
 * `linkMode: "none"` draws plain shapes (a state page's decorative map);
 * `highlight` fills one state.
 */
export function StateMap({
  highlight,
  linkMode = "anchor",
  className,
}: {
  highlight?: StateCode;
  linkMode?: "anchor" | "none";
  className?: string;
}) {
  return (
    <svg
      className={`${styles.map} ${className ?? ""}`}
      viewBox="20 20 720 520"
      aria-hidden="true"
    >
      <g transform="translate(42 28) rotate(-8 320 260)">
        {ORDER.map((state) => {
          const shape = geometry.regions[state];
          const face = `${styles.face} ${state === highlight ? styles.highlight : ""}`;
          return (
            <Region key={state} state={state} linked={linkMode === "anchor"}>
              <path className={face} d={shape.path} />
              {state === "ACT" && (
                <>
                  <path
                    className={styles.connector}
                    d={geometry.regions.ACT.connector}
                  />
                  <circle className={face} cx="650" cy="420" r="24" />
                </>
              )}
              <text
                className={`${styles.label} ${state === highlight ? styles.highlightLabel : ""}`}
                x={shape.x}
                y={shape.y}
              >
                {state}
              </text>
            </Region>
          );
        })}
      </g>
    </svg>
  );
}
