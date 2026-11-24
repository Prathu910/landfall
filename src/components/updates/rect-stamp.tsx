import { useId } from "react";
import {
  VISA_STAMP,
  stampTextSize,
  viewBoxAttr,
} from "../../lib/outlook/stamp-geometry";
import { InkFilter } from "../report/ink-filter";

/** A visa number fills the frame, unlike the report's label words. */
const WORD_MAX = 54;

type RectStampProps = {
  top: string;
  /** The big middle word, such as a visa subclass. */
  word: string;
  bottom: string;
  label?: string;
  rotate?: number;
  className?: string;
};

/**
 * The rectangular visa stamp: the report's frame, the stencil face and the
 * visa stamp's sizes. Pure SVG with relative imports and no CSS module, so
 * the Instagram card templates can render it to static markup. Ink is
 * `currentColor`; the caller's class sets it and the width. Never animated.
 * Draw it at least VISA_STAMP.minWidth (116px) wide, so its edge lines stay
 * at 12px or more.
 */
export function RectStamp({
  top,
  word,
  bottom,
  label,
  rotate = -4,
  className,
}: RectStampProps) {
  const id = useId();
  const size = stampTextSize(
    word,
    VISA_STAMP.widths.rect.word,
    WORD_MAX,
    VISA_STAMP.floor,
  );
  const frame = { fill: "none", stroke: "currentColor" };
  const edge = {
    textAnchor: "middle",
    fontWeight: 900,
    fontSize: VISA_STAMP.edgeSize,
    letterSpacing: 1,
    fill: "currentColor",
  } as const;
  return (
    <svg
      viewBox={viewBoxAttr(VISA_STAMP.viewBox)}
      role="img"
      aria-label={label ?? `${top}: ${word}, ${bottom}`}
      className={className}
      style={{ fontFamily: "var(--font-stamp)", overflow: "visible" }}
    >
      <defs>
        <InkFilter id={`${id}ink`} />
      </defs>
      <g filter={`url(#${id}ink)`} transform={`rotate(${rotate} 110 80)`}>
        <rect
          x="10"
          y="10"
          width="200"
          height="140"
          rx="16"
          {...frame}
          strokeWidth="5"
        />
        <rect
          x="20"
          y="20"
          width="180"
          height="120"
          rx="10"
          {...frame}
          strokeWidth="2"
        />
        <text x="110" y="52" {...edge}>
          {top}
        </text>
        <text
          x="110"
          y={84 + size * 0.34}
          textAnchor="middle"
          fontWeight="900"
          fontSize={size}
          letterSpacing="1"
          fill="currentColor"
        >
          {word}
        </text>
        <text x="110" y="130" {...edge}>
          {bottom}
        </text>
      </g>
    </svg>
  );
}
