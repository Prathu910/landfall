"use client";

import Link from "next/link";
import { TextInput } from "@mantine/core";
import { Search, ArrowUpRight, X } from "lucide-react";
import { useState } from "react";
import styles from "./occupation-search.module.css";

export type IndexItem = {
  code: string;
  name: string;
  hasData: boolean;
  path: string;
};

function Row({ item }: { item: IndexItem }) {
  return (
    <li className={styles.row}>
      {item.hasData ? (
        <Link href={item.path} className={styles.link}>
          <span>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.code}>ANZSCO {item.code}</span>
          </span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      ) : (
        <span className={styles.unavailable}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.code}>ANZSCO {item.code}</span>
          <span className={styles.none}>
            No published data in this snapshot
          </span>
        </span>
      )}
    </li>
  );
}

/** A–Z occupation list with a name-or-code filter. */
export function OccupationSearch({ items }: { items: IndexItem[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.code.includes(q),
      )
    : items;
  const letters = [...new Set(shown.map((i) => i.name[0].toUpperCase()))];
  return (
    <div className={styles.root}>
      <div className={styles.searchBox}>
        <TextInput
          id="occupation-filter"
          label="Find your occupation"
          description="Search by occupation name or six-digit ANZSCO code."
          type="search"
          placeholder="e.g. Software Engineer or 261313"
          classNames={{
            input: styles.input,
            label: styles.label,
            description: styles.hint,
          }}
          leftSection={<Search size={21} aria-hidden="true" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          size="lg"
          rightSectionPointerEvents="auto"
          rightSectionWidth={52}
          rightSection={
            query ? (
              <button
                type="button"
                className={styles.clear}
                onClick={() => setQuery("")}
                aria-label="Clear occupation search"
              >
                <X size={18} />
              </button>
            ) : null
          }
        />
      </div>
      <div className={styles.resultsHead}>
        <p className={styles.count} role="status" aria-live="polite">
          {shown.length} {shown.length === 1 ? "occupation" : "occupations"}
          {q ? " found" : " · A–Z"}
        </p>
        <span className={styles.hint}>Official ANZSCO occupation names</span>
      </div>
      {!shown.length && (
        <div className={styles.empty}>
          <h2>No occupation matches “{query.trim()}”.</h2>
          <p>Try a shorter name or check the six-digit ANZSCO code.</p>
          <button type="button" onClick={() => setQuery("")}>
            Show all occupations
          </button>
        </div>
      )}
      {!q && (
        <nav className={styles.alphabet} aria-label="Jump to occupation letter">
          {letters.map((letter) => (
            <a key={letter} href={`#letter-${letter}`}>
              {letter}
            </a>
          ))}
        </nav>
      )}
      {letters.map((letter) => (
        <section key={letter} aria-labelledby={`letter-${letter}`}>
          <h2 id={`letter-${letter}`} className={styles.letter}>
            {letter}
          </h2>
          <ul className={styles.list}>
            {shown
              .filter((i) => i.name[0].toUpperCase() === letter)
              .map((i) => (
                <Row key={i.code} item={i} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
