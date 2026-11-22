"use client";

import { Select } from "@mantine/core";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { TRY_IT_DEFAULT, type TryItView } from "@/lib/home/try-it";
import { fullReportHref } from "@/components/home/try-it-href";
import styles from "./occupation-check.module.css";

type PointPreview = {
  points: number;
  view:
    | Pick<
        Extract<TryItView, { kind: "data" }>,
        "kind" | "higher" | "same" | "note" | "source"
      >
    | Extract<TryItView, { kind: "none" }>;
};

/** One occupation's precomputed preview; no occupation dataset is sent to the browser. */
export function OccupationCheck({
  code,
  name,
  previews,
}: {
  code: string;
  name: string;
  previews: PointPreview[];
}) {
  const [points, setPoints] = useState(TRY_IT_DEFAULT);
  const view = previews.find((preview) => preview.points === points)?.view;
  return (
    <section className={styles.card} aria-labelledby="occupation-check-heading">
      <p className={styles.eyebrow}>YOUR NEXT STEP</p>
      <h2 id="occupation-check-heading">Put your points in context.</h2>
      <p className={styles.occupation}>
        {name}
        <span>ANZSCO {code}</span>
      </p>
      <Select
        label="Your points · visa 189"
        description="A quick look at the national EOI pool."
        data={previews.map(({ points }) => ({
          value: String(points),
          label: `${points} points`,
        }))}
        value={String(points)}
        onChange={(value) => value && setPoints(Number(value))}
        allowDeselect={false}
        size="md"
        maxDropdownHeight={240}
        classNames={{
          input: styles.input,
          label: styles.label,
          description: styles.description,
          option: styles.option,
        }}
      />
      <div className={styles.results} aria-live="polite" aria-atomic="true">
        {view?.kind === "data" ? (
          <>
            <dl>
              <div>
                <dt>EOIs above {points} points</dt>
                <dd>{view.higher}</dd>
              </div>
              <div>
                <dt>EOIs at {points} points</dt>
                <dd>{view.same}</dd>
              </div>
            </dl>
            <p className={styles.note}>
              {view.note} {view.source}
            </p>
          </>
        ) : (
          <p>{view?.message ?? "No published 189 data for this occupation."}</p>
        )}
      </div>
      <a href={fullReportHref(code)} className={styles.cta}>
        Check my points, free <ArrowUpRight size={19} aria-hidden="true" />
      </a>
      <p className={styles.description}>
        Occupation prefilled. Calculate your points and explore all three visas
        in your report.
      </p>
    </section>
  );
}
