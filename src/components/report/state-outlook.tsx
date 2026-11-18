"use client";
import { SegmentedControl } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StateVisa } from "../../lib/data/types";
import type { Group } from "../../lib/state-outlook/outlook";
import type { StatePanel, Tile } from "../../lib/state-outlook/view";
import { Reveal } from "../reveal";
import { StatePanelView } from "./state-panel";
import { StateTile } from "./state-tile";
import styles from "./state-outlook.module.css";

export type AnyStateTile = { label: string; fragment: string; note: string };

type Props = {
  subtitle: string;
  summaryByVisa: Record<StateVisa, string>;
  tilesByVisa: Record<StateVisa, Tile[]>;
  panelsByVisa: Record<StateVisa, StatePanel[]>;
  anyStateByVisa: Record<StateVisa, AnyStateTile>;
  defaultVisa: StateVisa;
};

const VISAS: StateVisa[] = ["190", "491"];

function visaFromHash(hash: string): StateVisa | null {
  const match = /^#state-(?:outlook-)?(190|491)(?:-|$)/.exec(hash);
  return match ? (match[1] as StateVisa) : null;
}

/** Opens the targeted panel (if any), scrolls to it and moves focus there. */
function reveal(hash: string) {
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  if (target instanceof HTMLDetailsElement) {
    target.open = true;
    target.querySelector("summary")?.focus({ preventScroll: true });
  }
  target.scrollIntoView({ block: "start" });
}

export function StateOutlook({
  subtitle,
  summaryByVisa,
  tilesByVisa,
  panelsByVisa,
  anyStateByVisa,
  defaultVisa,
}: Props) {
  const [visa, setVisa] = useState<StateVisa>(defaultVisa);

  const frame = useRef(0);

  const goTo = useCallback((hash: string) => {
    const wanted = visaFromHash(hash);
    if (wanted) setVisa(wanted);
    // Wait a frame so a newly selected visa is displayed before scrolling.
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => reveal(hash));
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (visaFromHash(location.hash)) goTo(location.hash);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      cancelAnimationFrame(frame.current);
    };
  }, [goTo]);

  return (
    <section id="state-outlook" className={styles.section}>
      <Reveal>
        <h2 className={styles.h2}>State outlook</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.control}>
          <SegmentedControl
            aria-label="Visa for the state outlook"
            value={visa}
            onChange={(value) => setVisa(value as StateVisa)}
            data={VISAS.map((v) => ({ value: v, label: `Subclass ${v}` }))}
          />
        </div>
        {VISAS.map((v) => (
          <VisaBlock
            key={v}
            visa={v}
            shown={v === visa}
            summary={summaryByVisa[v]}
            tiles={tilesByVisa[v]}
            panels={panelsByVisa[v]}
            anyState={anyStateByVisa[v]}
            onOpen={(href) => {
              history.replaceState(null, "", href);
              goTo(href);
            }}
          />
        ))}
      </Reveal>
    </section>
  );
}

function VisaBlock(props: {
  visa: StateVisa;
  shown: boolean;
  summary: string;
  tiles: Tile[];
  panels: StatePanel[];
  anyState: AnyStateTile;
  onOpen: (href: string) => void;
}) {
  const { visa, shown, summary, tiles, panels, anyState, onOpen } = props;
  const labels = new Map<string, string>(
    panels.map((p) => [p.id, p.groupLabel]),
  );
  const groups = new Map<string, Group>(
    tiles.map((t) => [t.href.slice(1), t.group]),
  );
  return (
    <div
      id={`state-outlook-${visa}`}
      className={`${styles.visa} ${shown ? "" : styles.offScreen}`}
    >
      <h3 className={styles.h3}>Subclass {visa}</h3>
      <p className={styles.summary}>{summary}</p>
      <div className={styles.grid}>
        {tiles.map((tile) => (
          <StateTile
            key={tile.href}
            tile={tile}
            groupLabel={labels.get(tile.href.slice(1)) ?? ""}
            onOpen={onOpen}
          />
        ))}
      </div>
      <div className={styles.any}>
        <b>{anyState.label}</b>
        <span>{anyState.fragment}</span>
        <span className={styles.anyNote}>{anyState.note}</span>
      </div>
      <div className={styles.panels}>
        {panels.map((panel) => (
          <StatePanelView
            key={panel.id}
            panel={panel}
            group={groups.get(panel.id) ?? "unverified"}
          />
        ))}
      </div>
    </div>
  );
}
