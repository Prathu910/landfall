"use client";
import { Checkbox, Select } from "@mantine/core";
import { useEffect, useState } from "react";
import { FormTheme } from "@/components/forms/form-theme-provider";
import { FEES } from "@/data/guide/fees";
import type { StateCode, Visa } from "@/lib/data/types";
import { estimateCosts, formatTotal, type CostInput } from "@/lib/guide/costs";
import { localToday } from "@/lib/migration";
import { STATE_ORDER } from "@/lib/occupation-page/states";
import { STATE_NAMES } from "@/lib/state-outlook/context";
import { CostBreakdown } from "./cost-breakdown";
import { GuideSegments } from "./guide-segments";
import { GuideSituation } from "./guide-situation";
import { useGuideAnswers } from "./guide-store";
import styles from "./cost-estimator.module.css";

const COUNTS = (max: number) =>
  Array.from({ length: max + 1 }, (_, n) => ({
    value: String(n),
    label: String(n),
  }));
const BODIES = [
  ...FEES.assessingBodies.map((f) => ({ value: f.id, label: f.label })),
  { value: "", label: "Not sure yet" },
];
const TESTS = [
  ...FEES.englishTests.map((f) => ({ value: f.id, label: f.label })),
  { value: "", label: "Already have a valid result" },
];
const STATES = [
  ...STATE_ORDER.map((code) => ({ value: code, label: STATE_NAMES[code] })),
  { value: "", label: "Not chosen yet" },
];

type Choices = Omit<CostInput, "situation">;

/** The cost estimator over the hand-sourced fees (src/data/guide/fees.ts). */
export function CostEstimator({
  buildDate,
  visa = "189",
}: {
  buildDate: string;
  visa?: Visa;
}) {
  const { situation } = useGuideAnswers();
  const [asOf, setAsOf] = useState(buildDate);
  const [choices, setChoices] = useState<Choices>({
    visa,
    partner: false,
    childrenUnder18: 0,
    children18Plus: 0,
    assessingBody: null,
    englishTest: null,
    naati: false,
    state: null,
    australianPoliceCheck: false,
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the reader's local date is only known after hydration
    setAsOf(localToday());
  }, []);
  const set = (patch: Partial<Choices>) =>
    setChoices((c) => ({ ...c, ...patch }));
  const estimate = estimateCosts({ ...choices, situation }, FEES, asOf);
  return (
    <FormTheme>
      <div className={styles.estimator}>
        <div className={styles.controls}>
          <GuideSegments
            label="Visa"
            value={choices.visa}
            onChange={(v) => set({ visa: v as Visa })}
            data={[
              { value: "189", label: "189" },
              { value: "190", label: "190" },
              { value: "491", label: "491" },
            ]}
          />
          <GuideSituation withState={false} />
          <Checkbox
            label="My partner applies with me"
            checked={choices.partner}
            onChange={(e) => set({ partner: e.currentTarget.checked })}
          />
          <div className={styles.pair}>
            <Select
              label="Children under 18"
              data={COUNTS(5)}
              value={String(choices.childrenUnder18)}
              onChange={(v) => set({ childrenUnder18: Number(v ?? 0) })}
              allowDeselect={false}
              comboboxProps={{ withinPortal: false }}
            />
            <Select
              label="Children 18 or over"
              data={COUNTS(3)}
              value={String(choices.children18Plus)}
              onChange={(v) => set({ children18Plus: Number(v ?? 0) })}
              allowDeselect={false}
              comboboxProps={{ withinPortal: false }}
            />
          </div>
          <Select
            label="Skills assessing body"
            data={BODIES}
            value={choices.assessingBody ?? ""}
            onChange={(v) => set({ assessingBody: v || null })}
            allowDeselect={false}
            comboboxProps={{ withinPortal: false }}
          />
          <Select
            label="English test"
            data={TESTS}
            value={choices.englishTest ?? ""}
            onChange={(v) => set({ englishTest: v || null })}
            allowDeselect={false}
            comboboxProps={{ withinPortal: false }}
          />
          {choices.visa !== "189" && (
            <Select
              label="Nominating state or territory"
              data={STATES}
              value={choices.state ?? ""}
              onChange={(v) => set({ state: (v as StateCode) || null })}
              allowDeselect={false}
              comboboxProps={{ withinPortal: false }}
            />
          )}
          <Checkbox
            label="NAATI community language test"
            checked={choices.naati}
            onChange={(e) => set({ naati: e.currentTarget.checked })}
          />
          <Checkbox
            label="12 months or more in Australia (AFP police check)"
            checked={choices.australianPoliceCheck}
            onChange={(e) =>
              set({ australianPoliceCheck: e.currentTarget.checked })
            }
          />
        </div>
        <p className={styles.tally} aria-hidden="true">
          Priced total: {estimate.totals.map((t) => formatTotal(t)).join(" + ")}
        </p>
        <CostBreakdown estimate={estimate} feesAsAt={FEES.feesAsAt} />
      </div>
    </FormTheme>
  );
}
