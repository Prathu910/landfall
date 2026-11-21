"use client";

import { useId, useRef } from "react";
import { labelName, stampName } from "@/lib/outlook/labels";
import type { OutlookLabel } from "@/lib/outlook/labels";
import {
  BIG_STAMP,
  bigWordLayout,
  longestLine,
  stampLines,
  stampTextSize,
  viewBoxAttr,
} from "@/lib/outlook/stamp-geometry";
import { InkFilter } from "./ink-filter";
import styles from "./stamp.module.css";
import { useFitStampText } from "./use-fit-stamp-text";

const { viewBox } = BIG_STAMP;
const BOX_X = 22;
const BOX_WIDTH = 276;

/** The round stamp for the reader's best visa (or all three, combined). */
export function BigStamp({
  label,
  ring,
  bottom,
  tooFew,
}: {
  label: OutlookLabel;
  ring: string;
  bottom: string;
  tooFew: boolean;
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

  return (
    <svg
      ref={ref}
      viewBox={viewBoxAttr(viewBox)}
      role="img"
      aria-label={`Stamp: ${ring}, ${labelName(label, tooFew)}`}
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
        <text
          className={styles.text}
          fontWeight={800}
          fontSize={BIG_STAMP.ringSize}
          fill="currentColor"
          letterSpacing={2}
        >
          <textPath
            href={`#${topPathId}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {ring}
          </textPath>
        </text>
        <text
          className={styles.text}
          fontWeight={800}
          fontSize={BIG_STAMP.bottomSize}
          fill="currentColor"
          letterSpacing={2}
        >
          <textPath
            href={`#${bottomPathId}`}
            startOffset="50%"
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {bottom}
          </textPath>
        </text>
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
            fill="currentColor"
            letterSpacing={1.5}
          >
            {line}
          </text>
        ))}
      </g>
    </svg>
  );
}
