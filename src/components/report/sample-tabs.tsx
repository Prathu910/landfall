"use client";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { occupationIndex } from "@/components/data/occupation-index";
import type { ReportPayload } from "@/lib/report-issue/payload";
import type { OccupationEvidence } from "@/lib/report-evidence";
import type { ReportOccupation } from "../data/report-occupation";
import { ReportView } from "./report-renderer";
import styles from "./sample-tabs.module.css";

export type SampleExample = {
  id: string;
  tab: string;
  occupation: ReportOccupation;
  /** Built at build time: the client only shows it. */
  payload: ReportPayload;
};

type Props = {
  examples: SampleExample[];
  fixedComparisons: OccupationEvidence[];
};

/**
 * The four example reports as tabs. The choice lives in memory only, and only
 * the selected report is mounted, so printing prints that example alone.
 */
export function SampleTabs({ examples, fixedComparisons }: Props) {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = examples[selected];

  function move(to: number) {
    setSelected(to);
    tabRefs.current[to]?.focus();
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = examples.length - 1;
    const target: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in target)) return;
    event.preventDefault();
    move(target[event.key]);
  }

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Example reports">
        {examples.map((example, index) => (
          <button
            key={example.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`sample-tab-${example.id}`}
            aria-selected={index === selected}
            aria-controls={`sample-panel-${example.id}`}
            tabIndex={index === selected ? 0 : -1}
            className={styles.tab}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {example.tab}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`sample-panel-${current.id}`}
        aria-labelledby={`sample-tab-${current.id}`}
        tabIndex={0}
      >
        <ReportView
          key={current.id}
          payload={current.payload}
          mode="sample"
          occupation={current.occupation}
          comparisonIndex={occupationIndex}
          fixedComparisons={fixedComparisons}
        />
      </div>
    </>
  );
}
