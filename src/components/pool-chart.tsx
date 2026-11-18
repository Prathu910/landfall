"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  countInterval,
  normalizePoolScore,
  type PoolOccupation,
} from "@/lib/pool";

export function PoolChart({
  occupation,
  score: requestedScore,
}: {
  occupation: Pick<PoolOccupation, "name" | "points">;
  score: number;
}) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const score = normalizePoolScore(requestedScore);
  const first = Math.min(65, Math.floor(score / 5) * 5),
    last = Math.max(110, Math.ceil(score / 5) * 5);
  const bands = Array.from(
      { length: (last - first) / 5 + 1 },
      (_, i) => first + i * 5,
    ),
    spacing = 420 / bands.length;
  const values = bands.map((value) =>
    occupation.points
      .filter((p) => p.score === value)
      .reduce((sum, p) => sum + countInterval(p.count).max, 0),
  );
  const max = Math.max(...values, 1);
  return (
    <div className="chart-wrap">
      <svg
        className="pool-chart"
        viewBox="0 0 440 180"
        role="img"
        aria-label={`Published EOI distribution for ${occupation.name}. Score ${score} is highlighted. Bar heights use interval upper bounds for masked counts.`}
      >
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1="10"
            x2="430"
            y1={20 + i * 52}
            y2={20 + i * 52}
            stroke="#ECE7DC"
            strokeDasharray="3 5"
          />
        ))}
        {bands.map((band, i) => {
          const height = Math.max(3, (values[i] / max) * 105),
            center = 10 + spacing * (i + 0.5);
          const raw =
            occupation.points.find((p) => p.score === band)?.count ?? "0";
          return (
            <g
              key={band}
              onMouseEnter={() => setHover(band)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${band} points: ${raw} EOIs`}</title>
              <motion.rect
                initial={false}
                animate={{ y: 128 - height, height }}
                transition={{
                  duration: reduced ? 0 : 0.55,
                  type: "spring",
                  bounce: 0.1,
                }}
                x={center - spacing * 0.35}
                width={spacing * 0.7}
                rx="4"
                fill={
                  hover === band
                    ? "#6B6558"
                    : band === score
                      ? "#B9AF9A"
                      : band > score
                        ? "#1B1A17"
                        : "#ECE7DC"
                }
              />
              <text
                x={center}
                y="152"
                textAnchor="middle"
                fontSize="12"
                fill={band === score ? "#1B1A17" : "#6B6558"}
                fontWeight={band === score ? 700 : 400}
              >
                {band}
              </text>
              {band === score && (
                <circle cx={center} cy="167" r="3" fill="#1B1A17" />
              )}
            </g>
          );
        })}
      </svg>
      <span className="chart-hover" aria-live="polite">
        {hover !== null
          ? `${hover} points · ${occupation.points.find((p) => p.score === hover)?.count ?? 0} published EOIs`
          : "Explore a bar to see the published count"}
      </span>
    </div>
  );
}
