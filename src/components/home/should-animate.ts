/**
 * Whether the hero demo may play: only once its stage has been in view, and
 * never when the viewer asks for reduced motion (they keep the poster).
 */
export function shouldAnimate(
  reducedMotion: boolean,
  inView: boolean,
): boolean {
  return !reducedMotion && inView;
}
