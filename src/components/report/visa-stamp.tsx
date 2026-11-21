"use client";

import { useId, useRef } from "react";
import { labelName, stampName } from "@/lib/outlook/labels";
import type { OutlookLabel } from "@/lib/outlook/labels";
import {
  VISA_STAMP,
  stampTextSize,
  viewBoxAttr,
} from "@/lib/outlook/stamp-geometry";
import type { VisaCard } from "@/lib/outlook/view";
import { InkFilter } from "./ink-filter";
import styles from "./stamp.module.css";
import { useFitStampText } from "./use-fit-stamp-text";

const TOP_BASELINE = 57;
const BOTTOM_BASELINE = 129;
/** A third of the size below this centres the capitals on the frame. */
const WORD_CENTRE = 88;

/** 189 is a rectangle, 190 a hexagon and 491 an oval, as in the mockup. */
function Frame({ shape }: { shape: VisaCard["shape"] }) {
  const ink = { fill: "none", stroke: "currentColor" };
  if (shape === "rect") {
    return (
      <>
        <rect
          x={10}
          y={10}
          width={200}
          height={140}
          rx={16}
          {...ink}
          strokeWidth={5}
        />
        <rect
          x={20}
          y={20}
          width={180}
          height={120}
          rx={10}
          {...ink}
          strokeWidth={2}
        />
      </>
    );
  }
  if (shape === "hex") {
    return (
      <polygon
        points="110,6 206,40 206,120 110,154 14,120 14,40"
        {...ink}
        strokeWidth={5}
      />
    );
  }
  return (
    <>
      <ellipse cx={110} cy={80} rx={102} ry={72} {...ink} strokeWidth={5} />
      <ellipse
        cx={110}
        cy={80}
        rx={90}
        ry={60}
        {...ink}
        strokeWidth={2}
        strokeDasharray="3 4"
      />
    </>
  );
}

/** The full label name is read aloud when the stamp shows a short one. */
function spokenWord(word: string, label: OutlookLabel): string {
  return word === stampName(label) ? labelName(label) : word;
}

/** One visa's stamp in "Your three visas". */
export function VisaStamp({
  shape,
  top,
  word,
  points,
  label,
  rotate,
}: {
  shape: VisaCard["shape"];
  top: string;
  word: string;
  points: number;
  label: OutlookLabel;
  /** Degrees; the row tilts each stamp a little differently. */
  rotate: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useFitStampText(ref);
  const filterId = `${useId()}ink`;

  const stampWord = word.toUpperCase();
  const size = stampTextSize(
    stampWord,
    VISA_STAMP.wordWidth,
    VISA_STAMP.wordMax,
    VISA_STAMP.floor,
  );
  const edgeText = {
    className: styles.text,
    x: 110,
    textAnchor: "middle",
    fontWeight: 800,
    fontSize: VISA_STAMP.edgeSize,
    fill: "currentColor",
  } as const;

  return (
    <svg
      ref={ref}
      viewBox={viewBoxAttr(VISA_STAMP.viewBox)}
      role="img"
      aria-label={`${top}: ${spokenWord(word, label)}, ${points} points`}
      className={`${styles.stamp} ${styles[label]}`}
      style={{ minWidth: VISA_STAMP.minWidth }}
    >
      <defs>
        <InkFilter id={filterId} />
      </defs>
      <g filter={`url(#${filterId})`} transform={`rotate(${rotate} 110 80)`}>
        <Frame shape={shape} />
        <text
          {...edgeText}
          y={TOP_BASELINE}
          data-fit={VISA_STAMP.topWidth}
          letterSpacing={1}
        >
          {top}
        </text>
        <text
          className={styles.text}
          x={110}
          y={WORD_CENTRE + size / 3}
          textAnchor="middle"
          data-fit={VISA_STAMP.wordWidth}
          fontWeight={900}
          fontSize={size}
          fill="currentColor"
        >
          {stampWord}
        </text>
        <text
          {...edgeText}
          y={BOTTOM_BASELINE}
          data-fit={VISA_STAMP.bottomWidth}
        >
          {points} PTS
        </text>
      </g>
    </svg>
  );
}
