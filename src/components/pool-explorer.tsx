"use client";
import { useState } from "react";
import Link from "next/link";
import { ActionIcon, Select, Slider, Tooltip } from "@mantine/core";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Info,
  Minus,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import {
  snapshot,
  comparePool,
  countInterval,
  formatInterval,
  normalizePoolScore,
  type Occupation,
} from "@/lib/pool";
import { AnimatedNumber } from "./reveal";

export function PoolChart({
  occupation,
  score,
}: {
  occupation: Pick<Occupation, "name" | "points">;
  score: number;
}) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  score = normalizePoolScore(score);
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
            stroke="#e4ebe7"
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
                    ? "#3a9f80"
                    : band === score
                      ? "#91dcb8"
                      : band > score
                        ? "#16634f"
                        : "#e1ece6"
                }
              />
              <text
                x={center}
                y="152"
                textAnchor="middle"
                fontSize="11"
                fill={band === score ? "#102e29" : "#5c7066"}
                fontWeight={band === score ? 700 : 400}
              >
                {band}
              </text>
              {band === score && (
                <circle cx={center} cy="167" r="3" fill="#127b61" />
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
export function PoolExplorer() {
  const reduced = useReducedMotion();
  const [code, setCode] = useState("261111"),
    [score, setScore] = useState(90);
  const occupation = snapshot.occupations.find((o) => o.code === code)!,
    pool = comparePool(occupation, score);
  return (
    <motion.div
      className="explorer"
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.15 }}
    >
      <div className="explorer-heading">
        <span className="mini-brand">
          <SlidersHorizontal size={15} /> YOUR POOL EXPLORER
        </span>
        <span className="pill">
          <span className="status-dot" /> Published data
        </span>
      </div>
      <div className="explorer-tab">
        <span>189 · Skilled Independent</span>
        <Link href="/sample/#pool">
          Explore the report <ArrowUpRight size={13} />
        </Link>
      </div>
      <Select
        label="Nominated occupation"
        aria-label="Explore your occupation"
        searchable
        nothingFoundMessage="No match in this snapshot"
        value={code}
        onChange={(value) => value && setCode(value)}
        data={snapshot.occupations.map((o) => ({
          value: o.code,
          label: o.name,
        }))}
      />
      <div className="explorer-metric" aria-live="polite">
        <span className="big-number">
          <AnimatedNumber value={formatInterval(pool.higher)} />
        </span>
        <span>
          EOIs with higher points
          <br />
          in this occupation
        </span>
        <Tooltip label="A range preserves Home Affairs counts masked below 20. This is not your queue position.">
          <ActionIcon variant="subtle" aria-label="About the EOI count">
            <Info size={16} />
          </ActionIcon>
        </Tooltip>
      </div>
      <PoolChart occupation={occupation} score={score} />
      <div className="chart-key">
        <span>
          <i className="key-dot dark" /> Higher points
        </span>
        <span>
          <i className="key-dot lime" /> Your score
        </span>
        <span>
          <i className="key-dot pale" /> Lower points
        </span>
      </div>
      <div className="explorer-slider">
        <div>
          <span>Try a different score</span>
          <strong>
            <AnimatedNumber value={score} /> points
          </strong>
        </div>
        <div className="slider-row">
          <ActionIcon
            variant="light"
            aria-label="5 fewer points"
            disabled={score <= 65}
            onClick={() => setScore(score - 5)}
          >
            <Minus size={14} />
          </ActionIcon>
          <Slider
            thumbLabel="Your points"
            min={65}
            max={110}
            step={5}
            value={score}
            onChange={setScore}
            marks={[
              { value: 65, label: "65" },
              { value: 90, label: "90" },
              { value: 110, label: "110" },
            ]}
          />
          <ActionIcon
            variant="light"
            aria-label="5 more points"
            disabled={score >= 110}
            onClick={() => setScore(score + 5)}
          >
            <Plus size={14} />
          </ActionIcon>
        </div>
      </div>
      <div className="explorer-note">
        <Info size={15} />
        <p>
          Another <strong>{formatInterval(pool.same)}</strong> share this score.
          Same-score order is not available in this dataset.
        </p>
      </div>
      <div className="explorer-bottom">
        <Link href={`/check/?occupation=${code}`} className="text-link">
          Make it personal <ArrowRight size={15} />
        </Link>
        <span>31 Oct 2026 snapshot</span>
      </div>
    </motion.div>
  );
}
