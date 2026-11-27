/**
 * The reels' motion as data (reel brief 2026-11-27): each moving element's
 * Web Animations keyframes over the whole reel, so the page only plays them
 * paused and `seek(ms)` sets one time for every frame. Calm and editorial:
 * ease-out moves of 300 to 600 ms, text rising 32px as it fades in and
 * 24px as it fades out, bars growing from the baseline. A stamp never
 * moves: it appears and goes with a hard cut.
 */

/** One keyframe; `offset` is the share (0 to 1) of the whole reel. */
export type ReelKeyframe = {
  offset: number;
  opacity?: number;
  transform?: string;
  /** The easing of the segment that starts at this keyframe. */
  easing?: string;
};

/** The keyframes of every element whose `data-anim` is `target`. */
export type ReelTrack = { target: string; keyframes: ReelKeyframe[] };

/** A number that counts up from 0 as its bar grows, then shows `text`. */
export type ReelCount = {
  target: string;
  startMs: number;
  durationMs: number;
  to: number;
  text: string;
};

/** Ease-out cubic, the same curve as the page's count-up (`1 - (1 - p)^3`). */
export const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)";
export const ENTER_MS = 500;
export const EXIT_MS = 300;
export const RISE_PX = 32;
export const FALL_PX = 24;
export const GROW_MS = 600;

const offsetOf = (ms: number, totalMs: number) => {
  if (ms < 0 || ms > totalMs) {
    throw new Error(`${ms} ms is outside the ${totalMs} ms reel`);
  }
  return Number((ms / totalMs).toFixed(6));
};

const shown = { opacity: 1, transform: "translateY(0px)" };
const below = { opacity: 0, transform: `translateY(${RISE_PX}px)` };
const above = { opacity: 0, transform: `translateY(-${FALL_PX}px)` };

/**
 * Text that fades and rises in at `inMs` (or is there from the first frame
 * when `inMs` is null) and, when `outMs` is set, fades and rises out from
 * `outMs`. Hidden before and after.
 */
export function fadeTrack(
  target: string,
  inMs: number | null,
  outMs: number | null,
  totalMs: number,
): ReelTrack {
  const at = (ms: number) => offsetOf(ms, totalMs);
  const enter: ReelKeyframe[] =
    inMs === null
      ? [{ offset: 0, ...shown }]
      : [
          { offset: 0, ...below },
          { offset: at(inMs), ...below, easing: EASE_OUT },
          { offset: at(inMs + ENTER_MS), ...shown },
        ];
  const exit: ReelKeyframe[] =
    outMs === null
      ? [{ offset: 1, ...shown }]
      : [
          { offset: at(outMs), ...shown, easing: EASE_OUT },
          { offset: at(outMs + EXIT_MS), ...above },
          { offset: 1, ...above },
        ];
  return { target, keyframes: dropRepeats([...enter, ...exit]) };
}

/** A bar that grows from its baseline between `startMs` and `startMs + GROW_MS`. */
export function growTrack(
  target: string,
  startMs: number,
  totalMs: number,
): ReelTrack {
  const at = (ms: number) => offsetOf(ms, totalMs);
  return {
    target,
    keyframes: dropRepeats([
      { offset: 0, transform: "scaleY(0)" },
      { offset: at(startMs), transform: "scaleY(0)", easing: EASE_OUT },
      { offset: at(startMs + GROW_MS), transform: "scaleY(1)" },
      { offset: 1, transform: "scaleY(1)" },
    ]),
  };
}

/** A stamp: shown from `inMs` to `outMs` with hard cuts, never a tween. */
export function cutTrack(
  target: string,
  inMs: number,
  outMs: number | null,
  totalMs: number,
): ReelTrack {
  const at = (ms: number) => offsetOf(ms, totalMs);
  const keyframes: ReelKeyframe[] = [
    { offset: 0, opacity: 0 },
    { offset: at(inMs), opacity: 0 },
    { offset: at(inMs), opacity: 1 },
  ];
  if (outMs !== null) {
    keyframes.push(
      { offset: at(outMs), opacity: 1 },
      { offset: at(outMs), opacity: 0 },
    );
  }
  keyframes.push({ offset: 1, opacity: outMs === null ? 1 : 0 });
  return { target, keyframes: dropRepeats(keyframes) };
}

/**
 * Drops a keyframe the next one repeats at the same offset (a move that
 * starts at 0 ms), keeping the later one and its easing, and keeping a hard
 * cut's two keyframes.
 */
function dropRepeats(keyframes: ReelKeyframe[]): ReelKeyframe[] {
  const same = (a: ReelKeyframe, b: ReelKeyframe | undefined) =>
    b !== undefined &&
    a.offset === b.offset &&
    a.opacity === b.opacity &&
    a.transform === b.transform;
  return keyframes.filter((k, i) => !same(k, keyframes[i + 1]));
}

/** The count-up value at `ms`, as the page computes it (ease-out cubic). */
export function countAt(count: ReelCount, ms: number): string {
  const p = Math.min(1, Math.max(0, (ms - count.startMs) / count.durationMs));
  return p >= 1
    ? count.text
    : String(Math.round(count.to * (1 - (1 - p) ** 3)));
}
