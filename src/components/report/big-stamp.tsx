"use client";

import { useId, useRef } from "react";
import { labelName, stampName } from "@/lib/outlook/labels";
import type { OutlookLabel } from "@/lib/outlook/labels";
import {
  BIG_STAMP,
  bigArcWidths,
  bigWordLayout,
  capArcText,
  longestLine,
  stampLines,
  stampStretch,
  stampTextSize,
  viewBoxAttr,
} from "@/lib/outlook/stamp-geometry";
import { InkFilter } from "./ink-filter";
import styles from "./stamp.module.css";
import { useFitStampText } from "./use-fit-stamp-text";

const { viewBox } = BIG_STAMP;
const BOX_X = 22;
const BOX_WIDTH = 276;
const ARC_SPACING = 2;
const WORD_SPACING = 1.5;

/** A ring line on an arc, capped so it can't run into the word box. */
function ArcText({
  pathId,
  text,
  size,
  arcWidth,
  hanging,
}: {
  pathId: string;
  text: string;
  size: number;
  arcWidth: number;
  hanging: boolean;
}) {
  const capped = capArcText(text, size, arcWidth, ARC_SPACING);
  const stretch = stampStretch(capped, size, arcWidth, ARC_SPACING);
  return (
    <text
      className={styles.text}
      fontWeight={800}
      fontSize={size}
      fontStretch={`${stretch}%`}
      fill="currentColor"
      letterSpacing={ARC_SPACING}
    >
      <textPath
        href={`#${pathId}`}
        startOffset="50%"
        textAnchor="middle"
        dominantBaseline={hanging ? "hanging" : undefined}
        data-fit={arcWidth}
      >
        {capped}
      </textPath>
    </text>
  );
}

/** The round stamp for the reader's best visa (or all three, combined). */
export function BigStamp({
  label,
  ring,
  bottom,
  tooFew,
  decorative = false,
}: {
  label: OutlookLabel;
  ring: string;
  bottom: string;
  tooFew: boolean;
  /** True when nearby text already names the stamp (the print copy), so it isn't read twice. */
  decorative?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useFitStampText(ref);
  const id = useId();
  const filterId = `${id}ink`;
  const maskId = `${id}mask`;
  const topPathId = `${id}top`;
  const bottomPathId = `${id}bottom`;

  const lines = stampLines(stampName(label, tooFew).toUpperCase());
  const size = stampTextSize(
    longestLine(lines),
    BIG_STAMP.wordWidth,
    BIG_STAMP.wordMax,
    BIG_STAMP.floor,
  );
  const word = bigWordLayout(lines.length, size);
  const arcs = bigArcWidths(word.boxHeight);

  return (
    <svg
      ref={ref}
      viewBox={viewBoxAttr(viewBox)}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative ? undefined : `Stamp: ${ring}, ${labelName(label, tooFew)}`
      }
      aria-hidden={decorative || undefined}
      className={`${styles.stamp} ${styles[label]}`}
      style={{ minWidth: BIG_STAMP.minWidth }}
    >
      <defs>
        <InkFilter id={filterId} />
        <path id={topPathId} d="M40 160 A120 120 0 0 1 280 160" />
        <path id={bottomPathId} d="M52 160 A108 108 0 0 0 268 160" />
        {/* Hides the rings behind the word box; mask colours are luminance. */}
        <mask id={maskId} maskUnits="userSpaceOnUse" {...viewBox}>
          <rect {...viewBox} fill="white" />
          <rect
            x={BOX_X}
            y={word.boxY}
            width={BOX_WIDTH}
            height={word.boxHeight}
            fill="black"
          />
        </mask>
      </defs>
      <g filter={`url(#${filterId})`} transform="rotate(-7 160 160)">
        <g mask={`url(#${maskId})`}>
          <circle
            cx={160}
            cy={160}
            r={150}
            fill="none"
            stroke="currentColor"
            strokeWidth={7}
          />
          <circle
            cx={160}
            cy={160}
            r={136}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          />
        </g>
        <ArcText
          pathId={topPathId}
          text={ring}
          size={BIG_STAMP.ringSize}
          arcWidth={arcs.ring}
          hanging={false}
        />
        <ArcText
          pathId={bottomPathId}
          text={bottom}
          size={BIG_STAMP.bottomSize}
          arcWidth={arcs.bottom}
          hanging={true}
        />
        <rect
          x={BOX_X}
          y={word.boxY}
          width={BOX_WIDTH}
          height={word.boxHeight}
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
        />
        {lines.map((line, index) => (
          <text
            key={index}
            className={styles.text}
            x={160}
            y={word.baselines[index]}
            textAnchor="middle"
            data-fit={BIG_STAMP.wordWidth}
            fontWeight={900}
            fontSize={size}
            fontStretch={`${stampStretch(line, size, BIG_STAMP.wordWidth, WORD_SPACING)}%`}
            fill="currentColor"
            letterSpacing={WORD_SPACING}
          >
            {line}
          </text>
        ))}
      </g>
    </svg>
  );
}
