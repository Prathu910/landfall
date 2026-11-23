"use client";

import { useId } from "react";
import { stampName, type OutlookLabel } from "@/lib/outlook/labels";
import { InkFilter } from "@/components/report/ink-filter";
import styles from "./home-stamp.module.css";

type StampProps = {
  label: OutlookLabel;
  top: string;
  bottom: string;
  shape?: "round" | "rect" | "hex" | "oval";
  rotate?: number;
};

/** The approved homepage's stencil treatment is intentionally separate from report typography. */
export function HomeStamp({
  label,
  top,
  bottom,
  shape = "round",
  rotate = -4,
}: StampProps) {
  const id = useId();
  const word = stampName(label).toUpperCase();
  const round = shape === "round";
  const lines = round && word.length > 12 ? word.split(" ") : [word];
  const width = round ? 250 : 168;
  const size = Math.min(
    round ? 56 : 30,
    width / (Math.max(...lines.map((line) => line.length)) * 0.56),
  );
  const ink = { fill: "none", stroke: "currentColor" };
  return (
    <svg
      viewBox={round ? "-24 -24 368 368" : "-12 -12 244 184"}
      role="img"
      aria-label={`${top}: ${stampName(label)}, ${bottom}`}
      className={`${styles.stamp} ${styles[label]}`}
    >
      <defs>
        <InkFilter id={`${id}ink`} />
        {round && (
          <>
            <path id={`${id}top`} d="M40 160 A120 120 0 0 1 280 160" />
            <path id={`${id}bottom`} d="M52 160 A108 108 0 0 0 268 160" />
          </>
        )}
      </defs>
      <g
        filter={`url(#${id}ink)`}
        transform={`rotate(${round ? -7 : rotate} ${round ? "160 160" : "110 80"})`}
      >
        {round ? (
          <>
            <circle cx="160" cy="160" r="150" {...ink} strokeWidth="7" />
            <circle cx="160" cy="160" r="136" {...ink} strokeWidth="2.5" />
            <text
              fontWeight="900"
              fontSize="24"
              fill="currentColor"
              letterSpacing="2"
            >
              <textPath
                href={`#${id}top`}
                startOffset="50%"
                textAnchor="middle"
              >
                {top}
              </textPath>
            </text>
            <text
              fontWeight="900"
              fontSize="21"
              fill="currentColor"
              letterSpacing="2"
            >
              <textPath
                href={`#${id}bottom`}
                startOffset="50%"
                textAnchor="middle"
                dominantBaseline="hanging"
              >
                {bottom}
              </textPath>
            </text>
            <rect
              x="22"
              y={118 - (lines.length - 1) * size * 0.5}
              width="276"
              height={84 + (lines.length - 1) * size}
              fill="white"
              stroke="currentColor"
              strokeWidth="5"
            />
            {lines.map((line, index) => (
              <text
                key={line}
                x="160"
                y={172 - (lines.length - 1) * size * 0.5 + index * size}
                textAnchor="middle"
                fontWeight="900"
                fontSize={size}
                fill="currentColor"
                letterSpacing="1.5"
              >
                {line}
              </text>
            ))}
          </>
        ) : (
          <>
            {shape === "rect" ? (
              <>
                <rect
                  x="10"
                  y="10"
                  width="200"
                  height="140"
                  rx="16"
                  {...ink}
                  strokeWidth="5"
                />
                <rect
                  x="20"
                  y="20"
                  width="180"
                  height="120"
                  rx="10"
                  {...ink}
                  strokeWidth="2"
                />
              </>
            ) : shape === "hex" ? (
              <polygon
                points="110,6 206,40 206,120 110,154 14,120 14,40"
                {...ink}
                strokeWidth="5"
              />
            ) : (
              <>
                <ellipse
                  cx="110"
                  cy="80"
                  rx="102"
                  ry="72"
                  {...ink}
                  strokeWidth="5"
                />
                <ellipse
                  cx="110"
                  cy="80"
                  rx="90"
                  ry="60"
                  {...ink}
                  strokeWidth="2"
                  strokeDasharray="3 4"
                />
              </>
            )}
            <text
              x="110"
              y="58"
              textAnchor="middle"
              fontWeight="900"
              fontSize={Math.min(22, 150 / (top.length * 0.62))}
              fill="currentColor"
              letterSpacing="1"
            >
              {top}
            </text>
            <text
              x="110"
              y={88 + size / 3}
              textAnchor="middle"
              fontWeight="900"
              fontSize={size}
              fill="currentColor"
            >
              {word}
            </text>
            <text
              x="110"
              y="128"
              textAnchor="middle"
              fontWeight="900"
              fontSize="19"
              fill="currentColor"
            >
              {bottom}
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
