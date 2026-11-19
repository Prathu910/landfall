"use client";

import { Select } from "@mantine/core";
import { useMemo, useState } from "react";
import {
  TRY_IT_DEFAULT,
  TRY_IT_LOAD_FAILED,
  TRY_IT_POINTS,
  TRY_IT_ROW_LABELS,
  buildTryIt,
} from "../../lib/home/try-it";
import { occupationIndex } from "../data/occupation-index";
import { useOccupationCore } from "../data/use-occupation-core";
import { occupationPath } from "../../lib/occupation-page/slug";
import { fullReportHref } from "./try-it-href";
import styles from "./try-it.module.css";

const OCCUPATION_OPTIONS = occupationIndex
  .filter((o) => o.hasData)
  .map((o) => ({ value: o.code, label: `${o.name} · ${o.code}` }));
const POINTS_OPTIONS = TRY_IT_POINTS.map((p) => ({
  value: String(p),
  label: String(p),
}));

/** Live published 189 figures for any occupation and points total. Nothing is saved or put in the URL. */
export function TryIt({ defaultOccupation }: { defaultOccupation: string }) {
  const [code, setCode] = useState(defaultOccupation);
  const [points, setPoints] = useState(TRY_IT_DEFAULT);
  const load = useOccupationCore(code, occupationIndex);
  const pageEntry = occupationIndex.find((o) => o.code === code);
  const view = useMemo(
    () => (load.status === "ready" ? buildTryIt(load.core, points) : null),
    [load, points],
  );

  return (
    <section className={styles.card} aria-labelledby="try-it-heading">
      <h2 id="try-it-heading" className={styles.heading}>
        Try it with your occupation
      </h2>
      <div className={styles.controls}>
        <Select
          className={styles.occupation}
          label="Occupation"
          searchable
          nothingFoundMessage="No match in the published data."
          data={OCCUPATION_OPTIONS}
          value={code}
          onChange={(value) => value && setCode(value)}
          allowDeselect={false}
          size="md"
          radius="md"
          maxDropdownHeight={260}
        />
        <Select
          className={styles.points}
          label="Your points (189)"
          data={POINTS_OPTIONS}
          value={String(points)}
          onChange={(value) => value && setPoints(Number(value))}
          allowDeselect={false}
          size="md"
          radius="md"
          maxDropdownHeight={260}
        />
      </div>
      <div className={styles.results} aria-live="polite">
        {load.status === "unavailable" ? (
          <p className={styles.status}>{TRY_IT_LOAD_FAILED}</p>
        ) : !view ? (
          <p className={styles.status}>Loading published data…</p>
        ) : view.kind === "data" ? (
          <>
            <dl className={styles.rows}>
              <div className={styles.row}>
                <dt>{TRY_IT_ROW_LABELS.higher}</dt>
                <dd>{view.higher}</dd>
              </div>
              <div className={styles.row}>
                <dt>{TRY_IT_ROW_LABELS.same}</dt>
                <dd>{view.same}</dd>
              </div>
              <div className={styles.row}>
                <dt>{TRY_IT_ROW_LABELS.latestRound}</dt>
                <dd>
                  {view.latestRound}
                  <span className={styles.chip}>{view.roundStatus}</span>
                </dd>
              </div>
            </dl>
            <p className={styles.note}>
              {view.note} {view.source}
            </p>
          </>
        ) : (
          <p className={styles.status}>{view.message}</p>
        )}
      </div>
      <a className={styles.link} href={fullReportHref(code)}>
        Get the full report
      </a>
      {pageEntry && view?.kind === "data" ? (
        <a className={styles.link} href={occupationPath(pageEntry)}>
          See the {pageEntry.name} page
        </a>
      ) : null}
    </section>
  );
}
