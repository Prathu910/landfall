/**
 * "Swipe", a saffron rule and an arrow. The arrow is drawn, not typed: "→"
 * is outside the bundled Latin subsets (spec 6.7, glyphs).
 */
export function SwipeCue({ label }: { label: string }) {
  return (
    <div className="swipe">
      {label}
      <span className="swipe-rule" aria-hidden="true" />
      <svg className="swipe-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 12h17M14 5.5l6.5 6.5-6.5 6.5"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
