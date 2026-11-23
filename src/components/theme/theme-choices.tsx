"use client";

import { useId } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  deviceThemeNote,
  THEME_CHOICES,
  type ThemeChoice,
} from "@/lib/brand/theme";
import { useThemeChoice } from "./use-theme-choice";
import styles from "./theme-control.module.css";

const ICONS: Record<ThemeChoice, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
};

/**
 * Light, Dark and System as native radios: a list in the header menu, a
 * three-part switch in the phone menu. The choice applies at once.
 */
export function ThemeChoices({ variant }: { variant: "list" | "segmented" }) {
  const { choice, deviceDark, choose } = useThemeChoice();
  const titleId = useId();
  const name = useId();
  const note = deviceThemeNote(deviceDark);
  const segmented = variant === "segmented";
  return (
    <div className={segmented ? styles.segmentedBlock : undefined}>
      <div className={styles.heading}>
        <span id={titleId} className={styles.title}>
          Appearance
        </span>
        {segmented ? <small className={styles.note}>{note}</small> : null}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        className={segmented ? styles.segmented : styles.list}
      >
        {THEME_CHOICES.map(({ value, label }) => {
          const Icon = ICONS[value];
          return (
            <label key={value} className={styles.choice}>
              <input
                type="radio"
                name={name}
                value={value}
                checked={choice === value}
                // Mantine's focus trap starts on the current choice.
                data-autofocus={choice === value || undefined}
                onChange={() => choose(value)}
              />
              {segmented ? (
                <Icon size={16} aria-hidden />
              ) : (
                <span className={styles.dot} aria-hidden />
              )}
              {label}
              {!segmented && value === "auto" ? (
                <small className={styles.note}>{note}</small>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
