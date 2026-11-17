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
import { formatDate } from "@/lib/migration";
import { comparePool, formatInterval, type PoolOccupation } from "@/lib/pool";
import { toPoolOccupation } from "@/lib/data/legacy";
import { publishedOccupationCode } from "@/lib/data/occupation-url";
import { occupationIndex } from "./data/occupation-index";
import { useOccupationCore } from "./data/use-occupation-core";
import { PoolChart } from "./pool-chart";
import { AnimatedNumber } from "./reveal";
import styles from "./pool-explorer.module.css";

type ExplorerPool =
  | { status: "loading" }
  | { status: "ready"; occupation: PoolOccupation }
  | { status: "none" } // no 189 submitted pool in this snapshot
  | { status: "unavailable" }; // the data file could not be loaded

/** The server-rendered occupation needs no fetch; any other is loaded on demand. */
function useExplorerPool(code: string, initial: PoolOccupation): ExplorerPool {
  const isInitial = code === initial.code;
  const fetchCode = isInitial
    ? null
    : publishedOccupationCode(code, occupationIndex);
  const load = useOccupationCore(fetchCode, occupationIndex);
  if (isInitial) return { status: "ready", occupation: initial };
  if (fetchCode === null) return { status: "none" };
  if (load.status === "ready") {
    const occupation = toPoolOccupation(load.core);
    return occupation ? { status: "ready", occupation } : { status: "none" };
  }
  return load.status === "loading" ? load : { status: "unavailable" };
}

const STATUS_MESSAGE: Record<
  Exclude<ExplorerPool["status"], "ready">,
  string
> = {
  loading: "Loading published data…",
  none: "No 189 submitted EOIs are published for this occupation in this snapshot. The points check still works.",
  unavailable:
    "Published data for this occupation could not be loaded. Try again, or continue with the points check.",
};

export function PoolExplorer({
  initial,
  snapshotDate,
}: {
  initial: PoolOccupation;
  snapshotDate: string;
}) {
  const reduced = useReducedMotion();
  const [code, setCode] = useState(initial.code);
  const [score, setScore] = useState(90);
  const explorer = useExplorerPool(code, initial);
  const ready =
    explorer.status === "ready"
      ? {
          occupation: explorer.occupation,
          pool: comparePool(explorer.occupation, score),
        }
      : null;
  const message =
    explorer.status === "ready" ? null : STATUS_MESSAGE[explorer.status];
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
        data={occupationIndex.map((o) => ({
          value: o.code,
          label: o.name,
        }))}
      />
      {ready ? (
        <>
          <div className="explorer-metric" aria-live="polite">
            <span className="big-number">
              <AnimatedNumber value={formatInterval(ready.pool.higher)} />
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
          <PoolChart occupation={ready.occupation} score={score} />
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
        </>
      ) : (
        <p className={styles.status} role="status">
          {message}
        </p>
      )}
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
      {ready && (
        <div className="explorer-note">
          <Info size={15} />
          <p>
            Another <strong>{formatInterval(ready.pool.same)}</strong> share
            this score. Same-score order is not available in this dataset.
          </p>
        </div>
      )}
      <div className="explorer-bottom">
        <Link href={`/check/?occupation=${code}`} className="text-link">
          Make it personal <ArrowRight size={15} />
        </Link>
        <span>{formatDate(snapshotDate)} snapshot</span>
      </div>
    </motion.div>
  );
}
