import {
  MARK_VIEWBOX,
  markSvgBody,
} from "../../../src/components/brand/mark-geometry";
import {
  ATLAS,
  MAP_TILT,
  STATE_DRAW_ORDER,
} from "../../../src/components/updates/state-map-geometry";
import type {
  HighlightCard,
  HighlightIcon,
} from "../../../src/lib/social/launch-types";

const LINE = {
  fill: "none",
  stroke: "var(--paper)",
  strokeWidth: 6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A round stamp with the 189 in the stencil face. */
function Rounds() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="40" {...LINE} />
      <circle cx="50" cy="50" r="31" {...LINE} strokeWidth={3} />
      <text x="50" y="61" className="icon-text">
        189
      </text>
    </svg>
  );
}

/** Three rising columns on a baseline. */
function Points() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M14 84h72" {...LINE} />
      <path
        d="M26 84V58M50 84V38M74 84V18"
        {...LINE}
        strokeWidth={14}
        strokeLinecap="butt"
      />
    </svg>
  );
}

/** The recap map's states and territories, as one silhouette. */
function States() {
  return (
    <svg viewBox="20 20 750 540" aria-hidden="true">
      <g transform={MAP_TILT}>
        {STATE_DRAW_ORDER.map((state) => (
          <path
            key={state}
            d={ATLAS.regions[state].path}
            fill="var(--paper)"
            stroke="var(--green)"
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}

/** The logo mark: an open lens. */
function Guide() {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markSvgBody("var(--paper)") }}
    />
  );
}

const ICONS: Record<HighlightIcon, () => React.ReactElement> = {
  rounds: Rounds,
  points: Points,
  states: States,
  guide: Guide,
};

/** A highlight cover: guilloche paper and a green seal in the centre circle. */
export function HighlightCover({ card }: { card: HighlightCard }) {
  const Icon = ICONS[card.icon];
  return (
    <div className="highlight">
      <div className="guill" />
      <div className={`seal seal-${card.icon}`} data-circle="" data-safe="">
        <Icon />
      </div>
    </div>
  );
}
