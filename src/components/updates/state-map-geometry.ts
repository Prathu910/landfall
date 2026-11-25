/**
 * Where the recap map and the Instagram card map draw each state and its
 * label. Relative imports only, so the card templates can use it under tsx.
 */
import geometry from "../home/atlas-map-geometry.json";
import type { StateCode } from "../../lib/data/types";

export const ATLAS = geometry;

/** Drawing order: ACT last, so its circle sits on top of NSW. */
export const STATE_DRAW_ORDER: readonly StateCode[] = [
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
export const ACT_CIRCLE = { x: 650, y: 420, r: 26 };

/** The tilt applied to the state shapes (labels are placed upright). */
export const MAP_TILT = "translate(42 28) rotate(-8 320 260)";

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

/** Where a map point lands once the shapes are tilted by MAP_TILT. */
function placed(x: number, y: number): { x: number; y: number } {
  const dx = x - 320;
  const dy = y - 260;
  return {
    x: dx * Math.cos(TILT) - dy * Math.sin(TILT) + 362,
    y: dx * Math.sin(TILT) + dy * Math.cos(TILT) + 288,
  };
}

/** The upright point a state's label centres on. */
export function labelPoint(state: StateCode): { x: number; y: number } {
  if (state === "ACT") return placed(ACT_CIRCLE.x, ACT_CIRCLE.y);
  const { x, y } = geometry.regions[state];
  const [nudgeX, nudgeY] = NUDGE[state];
  return placed(x + nudgeX, y + nudgeY);
}
