import { useId } from "react";
import {
  ACT_CIRCLE,
  ATLAS,
  MAP_TILT,
  STATE_DRAW_ORDER,
  labelPoint,
} from "../../../src/components/updates/state-map-geometry";
import type { StateCode } from "../../../src/lib/data/types";
import type { StateCard } from "../../../src/lib/updates/cards";

type MapView = StateCard["map"];

/**
 * Each label row's baseline, offset from the label point in map units: a
 * state's name, figure and words stack on its centre; the ACT's name sits
 * above its circle and its figure and words below.
 */
const ROWS = {
  state: { code: -22, big: 12, small: 33 },
  act: {
    code: -(ACT_CIRCLE.r + 10),
    big: ACT_CIRCLE.r + 40,
    small: ACT_CIRCLE.r + 61,
  },
};

function Label({
  state,
  label,
}: {
  state: StateCode;
  label: MapView[StateCode];
}) {
  const { x, y } = labelPoint(state);
  const rows = state === "ACT" ? ROWS.act : ROWS.state;
  return (
    <g>
      <text x={x} y={y + rows.code} className="map-code">
        {state}
      </text>
      <text
        x={x}
        y={y + rows.big}
        className={label.big.length > 5 ? "map-big long" : "map-big"}
      >
        {label.big}
      </text>
      <text x={x} y={y + rows.small} className="map-small">
        {label.small}
      </text>
    </g>
  );
}

function Region({ state, shade }: { state: StateCode; shade: number }) {
  const fill = `region band-${shade}`;
  if (state !== "ACT") {
    return <path d={ATLAS.regions[state].path} className={fill} />;
  }
  return (
    <g>
      <path d={ATLAS.regions.ACT.connector} className="map-connector" />
      <path d={ATLAS.regions.ACT.path} className={fill} />
      <circle
        cx={ACT_CIRCLE.x}
        cy={ACT_CIRCLE.y}
        r={ACT_CIRCLE.r}
        className={`act ${fill}`}
      />
    </g>
  );
}

/**
 * The recap page's state map, drawn for a card: the homepage atlas's shapes
 * and depth layers, each state shaded by its published floor and labelled
 * with its figure, sized for a 1080px card.
 */
export function CardMap({ map, label }: { map: MapView; label: string }) {
  const id = useId();
  return (
    <svg
      className="state-map"
      viewBox="20 20 750 540"
      role="img"
      aria-label={label}
    >
      <defs>
        <path id={`${id}country`} d={ATLAS.country} />
        <filter id={`${id}shadow`} x="-30%" y="-30%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
      <g transform={MAP_TILT}>
        <use
          href={`#${id}country`}
          className="map-shadow"
          transform="translate(0 29)"
          filter={`url(#${id}shadow)`}
        />
        <use
          href={`#${id}country`}
          className="map-depth-1"
          transform="translate(0 15)"
        />
        <use
          href={`#${id}country`}
          className="map-depth-2"
          transform="translate(0 9)"
        />
        <use
          href={`#${id}country`}
          className="map-depth-3"
          transform="translate(0 4)"
        />
        {STATE_DRAW_ORDER.map((state) => (
          <Region key={state} state={state} shade={map[state].shade} />
        ))}
      </g>
      {STATE_DRAW_ORDER.map((state) => (
        <Label key={state} state={state} label={map[state]} />
      ))}
    </svg>
  );
}
