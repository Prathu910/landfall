import type { CSSProperties } from "react";
import { labelName, stampName } from "@/lib/outlook/labels";
import type { OutlookLabel } from "@/lib/outlook/labels";
import styles from "./label-chip.module.css";

/** A label in its outlook colours; `short` uses the stamp's shorter name. */
export function LabelChip({
  label,
  short = false,
}: {
  label: OutlookLabel;
  short?: boolean;
}) {
  const colours = {
    "--chip-bg": `var(--label-${label}-bg)`,
    "--chip-ink": `var(--label-${label}-ink)`,
  } as CSSProperties;
  return (
    <span className={styles.chip} style={colours}>
      {short ? stampName(label) : labelName(label)}
    </span>
  );
}
