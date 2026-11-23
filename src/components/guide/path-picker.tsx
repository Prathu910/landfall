"use client";
import Link from "next/link";
import { occupationIndex } from "@/components/data/occupation-index";
import { stateRuleData } from "@/components/data/state-rule-data";
import { FormTheme } from "@/components/forms/form-theme-provider";
import { pathFit, type PickerSituation } from "@/lib/guide/path-fit";
import { pickerView } from "@/lib/guide/picker-view";
import { GuideOccupationSelect } from "./guide-occupation-select";
import { GuideSituation } from "./guide-situation";
import { useGuideAnswers, useOccupationFromUrl } from "./guide-store";
import { StateFitTable } from "./state-fit-table";
import styles from "./path-picker.module.css";

/** "Which path fits you?": visas and state lists for one occupation and situation. */
export function PathPicker() {
  useOccupationFromUrl();
  const { occupation, situation, state } = useGuideAnswers();
  const entry = occupationIndex.find((e) => e.code === occupation);
  const where: PickerSituation | null =
    situation === "offshore"
      ? { kind: "offshore" }
      : state
        ? { kind: "onshore", state }
        : null;
  const fit = entry && where ? pathFit(entry.code, where, stateRuleData) : null;
  const view = fit && entry && where ? pickerView(fit, entry, where) : null;
  return (
    <FormTheme>
      <div className={styles.picker}>
        <div className={styles.controls}>
          <GuideSituation />
          <GuideOccupationSelect />
        </div>
        <div className={styles.result} aria-live="polite">
          {!view ? (
            <p className={styles.empty}>
              {entry && !where
                ? "Choose the state you live in to see which state lists fit you."
                : "Choose your occupation to see which visas it can use and which states list it."}
            </p>
          ) : (
            <>
              <p className={styles.resultHeading}>{view.name}</p>
              <ul className={styles.stamps} aria-label="Home Affairs list">
                {view.visas.map((v) => (
                  <li
                    key={v.visa}
                    className={styles.stamp}
                    data-status={v.status}
                  >
                    <span className={styles.stampVisa}>{v.visa}</span>
                    <span className={styles.stampText}>{v.text}</span>
                  </li>
                ))}
              </ul>
              <ul className={styles.lines}>
                {view.stateLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {fit && <StateFitTable states={fit.states} />}
              <p className={styles.note}>
                A list entry is one rule, not a finding that you can apply.
                States add residence, work and other criteria, and most select
                competitively.{" "}
                <Link href="/states/">See each state’s program</Link>.
              </p>
              <div className={styles.links}>
                <Link className={styles.primary} href={view.checkHref}>
                  Check my points for this occupation{" "}
                  <span aria-hidden="true">→</span>
                </Link>
                {view.occupationHref && (
                  <Link href={view.occupationHref}>
                    See its published EOIs and invitations
                  </Link>
                )}
                {view.guideLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.text}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </FormTheme>
  );
}
