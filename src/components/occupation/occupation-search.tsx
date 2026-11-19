"use client";

import Link from "next/link";
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
          {item.name} <span className={styles.code}>{item.code}</span>
        </Link>
      ) : (
        <span>
          {item.name} <span className={styles.code}>{item.code}</span>{" "}
          <span className={styles.none}>No published data</span>
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
    <div>
      <label className={styles.label} htmlFor="occupation-filter">
        Find an occupation by name or code
      </label>
      <input
        id="occupation-filter"
        type="search"
        className={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <p className={styles.count} role="status">
        {shown.length} {shown.length === 1 ? "occupation" : "occupations"}
      </p>
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
