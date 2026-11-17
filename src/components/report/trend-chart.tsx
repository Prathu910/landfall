"use client";
import { useState } from "react";
import { Accordion } from "@mantine/core";
import { motion, useReducedMotion } from "motion/react";
import { formatDate } from "@/lib/migration";
import { formatInterval } from "@/lib/pool";
import type { TrendEvidence } from "@/lib/report-evidence";

export function TrendChart({ rows }: { rows: TrendEvidence[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const reduced = useReducedMotion();
  if (!rows.length) return null;
  const min = Math.min(...rows.map((r) => r.total.min)) * 0.94;
  const max = Math.max(...rows.map((r) => r.total.max)) * 1.03;
  const span = Math.max(1, max - min);
  const x = (i: number) => 20 + (i / (rows.length - 1 || 1)) * 560;
  const y = (n: number) => 145 - ((n - min) / span) * 115;
  const path = rows
    .map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r.total.max)}`)
    .join(" ");
  const active = rows[selected ?? rows.length - 1];
  return (
    <div className="trend-chart">
      <svg
        viewBox="0 0 600 178"
        role="img"
        aria-label="Twelve monthly published 189 submitted EOI totals. Relative vertical scale; masked totals use an upper-bound line."
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6dba88" stopOpacity=".22" />
            <stop offset="100%" stopColor="#6dba88" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 85, 140].map((n) => (
          <line
            key={n}
            x1="20"
            x2="580"
            y1={n}
            y2={n}
            stroke="#e3ecde"
            strokeDasharray="3 5"
          />
        ))}
        <path d={`${path} L580,145 L20,145 Z`} fill="url(#trend-fill)" />
        <motion.path
          d={path}
          fill="none"
          stroke="#438d5c"
          strokeWidth="2.5"
          initial={false}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.8 }}
        />
        {rows.map((r, i) => (
          <g
            key={r.date}
            onMouseEnter={() => setSelected(i)}
            onMouseLeave={() => setSelected(null)}
          >
            <title>{`${formatDate(r.date)}: ${formatInterval(r.total)} EOIs`}</title>
            <circle cx={x(i)} cy={y(r.total.max)} r="16" fill="transparent" />
            <circle
              cx={x(i)}
              cy={y(r.total.max)}
              r={selected === i ? 5 : 3}
              fill={selected === i ? "#102e29" : "#fff"}
              stroke="#438d5c"
              strokeWidth="2"
            />
            {(i === 0 || i === rows.length - 1 || i % 3 === 0) && (
              <text
                x={x(i)}
                y="170"
                textAnchor={
                  i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle"
                }
                fill="#5d7e63"
                fontSize="10"
              >
                {new Date(r.date + "T00:00:00Z").toLocaleDateString("en-GB", {
                  month: "short",
                  year: "2-digit",
                  timeZone: "UTC",
                })}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="trend-detail" aria-live="polite">
        <span>
          {formatDate(active.date)} ·{" "}
          <strong>{formatInterval(active.total)} EOIs</strong>
        </span>
        <span>189 submitted · relative scale</span>
      </div>
      <Accordion
        keepMounted
        keepMountedMode="display-none"
        className="report-accordion"
        variant="default"
      >
        <Accordion.Item value="table">
          <Accordion.Control>View monthly figures</Accordion.Control>
          <Accordion.Panel>
            <table className="rounds-table">
              <thead>
                <tr>
                  <th scope="col">Snapshot</th>
                  <th scope="col">Submitted EOIs</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date}>
                    <td>{formatDate(r.date)}</td>
                    <td>{formatInterval(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
