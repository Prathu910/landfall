"use client";
import { useState } from "react";
import { SegmentedControl, TextInput } from "@mantine/core";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUpRight, Info, Search } from "lucide-react";
import { statePrograms } from "@/data/states";
export function StateExplorer() {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const reduced = useReducedMotion();
  const filtered = statePrograms.filter(
    (s) =>
      (filter === "all" ||
        (filter === "scored"
          ? ["VIC", "ACT", "TAS"].includes(s.code)
          : ["WA", "NT"].includes(s.code))) &&
      `${s.name} ${s.code} ${s.system}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="notice">
        <Info size={17} />
        <p>
          Sourced program summaries. A state’s system is separate from federal
          points. Places, pathways and opening conditions can change; these
          summaries do not establish personal eligibility.
        </p>
      </div>
      <div className="states-controls">
        <SegmentedControl
          aria-label="Filter state programs"
          value={filter}
          onChange={setFilter}
          data={[
            { value: "all", label: "All eight" },
            { value: "scored", label: "State scoring" },
            { value: "review", label: "Needs verification" },
          ]}
        />
        <TextInput
          className="state-search"
          placeholder="Search a state or system"
          aria-label="Search a state or scoring system"
          leftSection={<Search size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>
      <p className="subtle" style={{ marginBottom: 20 }} aria-live="polite">
        {filtered.length}{" "}
        {filtered.length === 1 ? "jurisdiction" : "jurisdictions"} shown
      </p>
      <div className="states-grid">
        <AnimatePresence initial={false}>
          {filtered.map((s) => (
            <motion.article
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
              transition={{ duration: 0.2 }}
              className="state-card"
              key={s.code}
            >
              <div className="state-card-top">
                <span className="state-code">{s.code}</span>
                <h2>{s.name}</h2>
              </div>
              <span className="pill" style={{ marginBottom: 15 }}>
                {s.system}
              </span>
              <p>{s.summary}</p>
              <h3>What changes the picture</h3>
              <p>{s.considerations}</p>
              <a
                className="text-link"
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                Read the official criteria <ArrowUpRight size={14} />
              </a>
              <div className="state-footnote">{s.checked}</div>
            </motion.article>
          ))}
        </AnimatePresence>
        {!filtered.length && (
          <div className="report-empty">
            <Search size={20} />
            <p>
              No matching jurisdiction. Try the name or abbreviation, or clear
              the filter.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
