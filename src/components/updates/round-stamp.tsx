import { useId } from "react";
import {
  BIG_STAMP,
  bigArcWidths,
  bigWordLayout,
  capArcText,
  estimatedWidth,
  longestLine,
  stampLines,
  stampTextSize,
  viewBoxAttr,
} from "../../lib/outlook/stamp-geometry";
import { InkFilter } from "../report/ink-filter";

/** Ring letter spacing, as the homepage stamps. */
const RING_SPACING = 2;
/** A multi-line word stays smaller than a single word, so the ring has room. */
const MULTI_LINE_MAX = 46;

/**
 * A ring line estimated wider than its clear arc is squeezed to fit with
 * textLength, worked out here rather than measured, so static markup fits
 * too (the report's stamps measure with useFitStampText instead).
 */
function RingText({
  text,
  size,
  arc,
  path,
  hanging = false,
}: {
  text: string;
  size: number;
  arc: number;
  path: string;
  hanging?: boolean;
}) {
  const line = capArcText(text, size, arc, RING_SPACING);
  const squeeze = estimatedWidth(line, size, RING_SPACING) > arc;
  return (
    <text
      fontWeight="900"
      fontSize={size}
      fill="currentColor"
      letterSpacing={RING_SPACING}
    >
      <textPath
        href={path}
        startOffset="50%"
        textAnchor="middle"
        dominantBaseline={hanging ? "hanging" : undefined}
        textLength={squeeze ? arc : undefined}
        lengthAdjust={squeeze ? "spacingAndGlyphs" : undefined}
      >
        {line}
      </textPath>
    </text>
  );
}

type RoundStampProps = {
  /** The line along the top of the ring. */
  top: string;
  /** The word in the box; long words break onto two lines. */
  word: string;
  /** The line along the bottom of the ring. */
  bottom: string;
  /** Read out in place of the three lines. */
  label?: string;
  rotate?: number;
  /** The word box's fill, so the ring never shows through it. */
  paper?: string;
  className?: string;
};

/**
 * The round ink stamp: the homepage geometry, the stencil face and the
 * report's fitting rules. Pure SVG with relative imports and no CSS module,
 * so the Instagram card templates can render it to static markup. Ink is
 * `currentColor`; the caller's class sets it, the width and any glow. Never
 * animated. Draw it at least BIG_STAMP.minWidth (230px) wide, so its ring
 * text stays at 12px or more.
 */
export function RoundStamp({
  top,
  word,
  bottom,
  label,
  rotate = -7,
  paper = "var(--brand-paper)",
  className,
}: RoundStampProps) {
  const id = useId();
  const lines = stampLines(word);
  const size = stampTextSize(
    longestLine(lines),
    BIG_STAMP.wordWidth,
    lines.length > 1 ? MULTI_LINE_MAX : BIG_STAMP.wordMax,
    BIG_STAMP.floor,
  );
  const layout = bigWordLayout(lines.length, size);
  const arcs = bigArcWidths(layout.boxHeight);
  const ring = { fill: "none", stroke: "currentColor" };
  return (
    <svg
      viewBox={viewBoxAttr(BIG_STAMP.viewBox)}
      role="img"
      aria-label={label ?? `${top}: ${word}, ${bottom}`}
      className={className}
      style={{ fontFamily: "var(--font-stamp)", overflow: "visible" }}
    >
      <defs>
        <InkFilter id={`${id}ink`} />
        <path id={`${id}top`} d="M40 160 A120 120 0 0 1 280 160" />
        <path id={`${id}bottom`} d="M52 160 A108 108 0 0 0 268 160" />
      </defs>
      <g filter={`url(#${id}ink)`} transform={`rotate(${rotate} 160 160)`}>
        <circle cx="160" cy="160" r="150" {...ring} strokeWidth="7" />
        <circle cx="160" cy="160" r="136" {...ring} strokeWidth="2.5" />
        <RingText
          text={top}
          size={BIG_STAMP.ringSize}
          arc={arcs.ring}
          path={`#${id}top`}
        />
        <RingText
          text={bottom}
          size={BIG_STAMP.bottomSize}
          arc={arcs.bottom}
          path={`#${id}bottom`}
          hanging
        />
        <rect
          x="22"
          y={layout.boxY}
          width="276"
          height={layout.boxHeight}
          fill={paper}
          stroke="currentColor"
          strokeWidth="5"
        />
        {lines.map((line, index) => (
          <text
            key={line}
            x="160"
            y={layout.baselines[index]}
            textAnchor="middle"
            fontWeight="900"
            fontSize={size}
            fill="currentColor"
            letterSpacing="1.5"
          >
            {line}
          </text>
        ))}
      </g>
    </svg>
  );
}
