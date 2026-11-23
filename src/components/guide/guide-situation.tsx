"use client";
import { Select } from "@mantine/core";
import type { StateCode } from "@/lib/data/types";
import { STATE_ORDER } from "@/lib/occupation-page/states";
import { STATE_NAMES } from "@/lib/state-outlook/context";
import { GuideSegments } from "./guide-segments";
import { setGuideAnswers, useGuideAnswers } from "./guide-store";
import styles from "./guide-controls.module.css";

const STATE_OPTIONS = STATE_ORDER.map((code) => ({
  value: code,
  label: STATE_NAMES[code],
}));

/** "Where are you now?": offshore, or in Australia with the state. */
export function GuideSituation({ withState = true }: { withState?: boolean }) {
  const { situation, state } = useGuideAnswers();
  return (
    <div className={styles.situation}>
      <GuideSegments
        label="Where are you now?"
        value={situation}
        onChange={(value) =>
          setGuideAnswers({ situation: value as "offshore" | "onshore" })
        }
        data={[
          { value: "offshore", label: "Outside Australia" },
          { value: "onshore", label: "In Australia" },
        ]}
      />
      {withState && situation === "onshore" && (
        <Select
          label="Which state or territory do you live in?"
          placeholder="Choose a state"
          data={STATE_OPTIONS}
          value={state}
          onChange={(value) =>
            setGuideAnswers({ state: (value as StateCode | null) ?? null })
          }
          comboboxProps={{ withinPortal: false }}
        />
      )}
    </div>
  );
}
