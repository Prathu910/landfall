"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Visa } from "@/lib/data/types";
import type { PoolBar } from "@/lib/occupation-page/charts";
import styles from "./pool-tabs.module.css";

const VISAS: Visa[] = ["189", "190", "491"];

export function PoolTabs({
  pools,
  totals,
}: {
  pools: Record<Visa, PoolBar[] | null>;
  totals: Record<Visa, string | null>;
}) {
  const first = VISAS.find((v) => pools[v]) ?? "189";
  const [active, setActive] = useState<Visa>(first);
  const id = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = VISAS[(index + step + VISAS.length) % VISAS.length];
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={styles.tabs}>
      <div role="tablist" aria-label="Visa" className={styles.list}>
        {VISAS.map((visa, i) => (
          <button
            key={visa}
            ref={(el) => {
              tabRefs.current[visa] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${visa}`}
            aria-selected={active === visa}
            aria-controls={`${id}-panel-${visa}`}
            tabIndex={active === visa ? 0 : -1}
            className={styles.tab}
            onClick={() => setActive(visa)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {visa}
          </button>
        ))}
      </div>
      {VISAS.map((visa) => (
        <div
          key={visa}
          role="tabpanel"
          id={`${id}-panel-${visa}`}
          aria-labelledby={`${id}-tab-${visa}`}
          data-active={active === visa}
          className={styles.panel}
        >
          <p className={styles.printHeading}>Visa {visa}</p>
          <Panel bars={pools[visa]} total={totals[visa]} />
        </div>
      ))}
    </div>
  );
}

function Panel({
  bars,
  total,
}: {
  bars: PoolBar[] | null;
  total: string | null;
}) {
  if (!bars)
    return <p className={styles.empty}>No EOIs published for this visa.</p>;
  return (
    <>
      {total && <p className={styles.total}>{total}</p>}
      <ul className={styles.bars}>
        {bars.map((bar) => (
          <li key={bar.score} className={styles.row}>
            <span className={styles.score}>{bar.score}</span>
            <span className={styles.track}>
              <span
                className={`${styles.fill} ${bar.masked ? styles.masked : ""}`}
                style={{ width: `${Math.max(bar.share * 100, 2)}%` }}
              />
            </span>
            <span className={styles.count}>{bar.label}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
