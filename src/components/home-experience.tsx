"use client";
import { useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { PoolExplorer } from "./pool-explorer";
import { sampleProfile, calculatePoints } from "@/lib/migration";
import type { PoolOccupation } from "@/lib/pool";

export function HomeExperience({
  initialPool,
  snapshotDate,
}: {
  initialPool: PoolOccupation;
  snapshotDate: string;
}) {
  const [view, setView] = useState("pool");
  const reduced = useReducedMotion();
  const result = calculatePoints(sampleProfile, "2026-11-17");
  return (
    <div className="hero-product">
      <div className="product-halo" />
      <div className="product-topline">
        <span className="product-mark">
          <Sparkles size={14} /> THE LANDFALL PERSPECTIVE
        </span>
        <span className="product-version">Made for your next chapter</span>
      </div>
      <SegmentedControl
        aria-label="Explore report features"
        fullWidth
        value={view}
        onChange={setView}
        data={[
          { value: "pool", label: "The pool" },
          { value: "points", label: "Your points" },
          { value: "dates", label: "Your timeline" },
        ]}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -8 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          {view === "pool" ? (
            <PoolExplorer initial={initialPool} snapshotDate={snapshotDate} />
          ) : view === "points" ? (
            <div className="explorer preview-pane">
              <div className="explorer-heading">
                <span className="mini-brand">
                  <FileCheck2 size={15} /> AARAV’S SAMPLE AUDIT
                </span>
                <span className="pill">Illustrative profile</span>
              </div>
              <div className="preview-score">
                <span>{result.base}</span>
                <div>
                  Federal points
                  <br />
                  <small>Every category accounted for</small>
                </div>
                <CheckCircle2 size={28} />
              </div>
              {result.categories
                .filter((c) => c.points > 0)
                .map((c, i) => (
                  <div className="preview-audit" key={c.key}>
                    <span>{c.label}</span>
                    <div>
                      <motion.i
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${(c.points / c.max) * 100}%` }}
                        transition={{
                          delay: reduced ? 0 : i * 0.06,
                          duration: reduced ? 0 : 0.45,
                        }}
                      />
                    </div>
                    <strong>{c.points}</strong>
                  </div>
                ))}
              <p className="data-caption">
                90 independent · 95 if nominated for 190 · 105 if nominated or
                sponsored for 491. Nomination is not established.
              </p>
            </div>
          ) : (
            <div className="explorer preview-pane">
              <div className="explorer-heading">
                <span className="mini-brand">
                  <CalendarDays size={15} /> AARAV’S PERSONAL DATES
                </span>
                <span className="pill">Illustrative profile</span>
              </div>
              <h3 className="preview-title">
                The next chapter,
                <br />
                <em>on your timeline.</em>
              </h3>
              {[
                {
                  date: "09 AUG 2027",
                  title: "The age points change",
                  detail: "33rd birthday · 30 → 25 age points",
                  badge: "−5 points",
                },
                {
                  date: "30 SEP 2027",
                  title: "Current visa expiry",
                  detail: "An entered date to keep in view",
                  badge: "Personal date",
                },
                {
                  date: "02 FEB 2028",
                  title: "English evidence window ends",
                  detail: "Three years from the test date",
                  badge: "−20 points",
                },
              ].map((e, i) => (
                <motion.div
                  className="mini-event"
                  key={e.date}
                  initial={reduced ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: reduced ? 0 : 0.3,
                    delay: reduced ? 0 : i * 0.1,
                  }}
                >
                  <span className="mini-event-dot" />
                  <div>
                    <time>{e.date}</time>
                    <h4>{e.title}</h4>
                    <p>{e.detail}</p>
                  </div>
                  <span className="pill">{e.badge}</span>
                </motion.div>
              ))}
              <p className="data-caption">
                Based on today’s rules. No unconfirmed policy dates or future
                work assumptions.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="product-bottomline">
        <span>
          <span className="status-dot" /> Source-backed. Clearly explained.
        </span>
        <ArrowUpRight size={15} />
      </div>
    </div>
  );
}
