"use client";

import { useId, useRef } from "react";
import { labelName, stampName } from "@/lib/outlook/labels";
import type { Shift } from "@/lib/outlook/losses";
import {
  SHIFT_STAMP,
  stampStretch,
  stampTextSize,
  viewBoxAttr,
} from "@/lib/outlook/stamp-geometry";
import { InkFilter } from "./ink-filter";
import styles from "./stamp.module.css";
import { useFitStampText } from "./use-fit-stamp-text";

const BOX_WIDTH = 118;
const MIDLINE = 35;

function ShiftBox({
  x,
  shift,
  rotate,
}: {
  x: number;
  shift: Shift;
  rotate: number;
}) {
  const text = `${shift.points} ${stampName(shift.label)}`.toUpperCase();
  const size = stampTextSize(
    text,
    SHIFT_STAMP.textWidth,
    SHIFT_STAMP.textMax,
    SHIFT_STAMP.floor,
  );
  return (
    <g
      className={styles[shift.label]}
      transform={`rotate(${rotate} ${x + 56} ${MIDLINE})`}
    >
      <rect
        x={x}
        y={10}
        width={BOX_WIDTH}
        height={50}
        rx={8}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
      />
      <text
        className={styles.text}
        x={x + BOX_WIDTH / 2}
        y={MIDLINE + size * 0.36}
        textAnchor="middle"
        data-fit={SHIFT_STAMP.textWidth}
        fontWeight={900}
        fontSize={size}
        fontStretch={`${stampStretch(text, size, SHIFT_STAMP.textWidth)}%`}
        fill="currentColor"
      >
        {text}
      </text>
    </g>
  );
}

function spoken(shift: Shift): string {
  return `${shift.points} points, ${labelName(shift.label)}`;
}

/** "Before → after" for one improvement or loss card. */
export function ShiftStamps({ from, to }: { from: Shift; to: Shift }) {
  const ref = useRef<SVGSVGElement>(null);
  useFitStampText(ref);
  const id = useId();
  const filterId = `${id}ink`;
  const arrowId = `${id}arrow`;

  return (
    <svg
      ref={ref}
      viewBox={viewBoxAttr(SHIFT_STAMP.viewBox)}
      role="img"
      aria-label={`From ${spoken(from)}, to ${spoken(to)}`}
      className={styles.stamp}
      style={{ minWidth: SHIFT_STAMP.minWidth }}
    >
      <defs>
        <InkFilter id={filterId} />
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={7}
          markerHeight={7}
          orient="auto"
        >
          <path className={styles.arrowHead} d="M0 0 L10 5 L0 10 z" />
        </marker>
      </defs>
      <g filter={`url(#${filterId})`}>
        <ShiftBox x={0} shift={from} rotate={-4} />
        <ShiftBox x={158} shift={to} rotate={3} />
      </g>
      <path
        className={styles.arrow}
        d={`M124 ${MIDLINE} H150`}
        strokeWidth={2.5}
        markerEnd={`url(#${arrowId})`}
      />
    </svg>
  );
}
