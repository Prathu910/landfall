"use client";

import { MantineThemeProvider, createTheme } from "@mantine/core";
import type { ReactNode } from "react";
import { formComponents, formScope, inputClasses } from "../forms/form-theme";
import styles from "./check-controls.module.css";

const checkTheme = createTheme({
  components: {
    ...formComponents,
    NumberInput: { defaultProps: { classNames: inputClasses } },
    DateInput: {
      defaultProps: {
        classNames: inputClasses,
        popoverProps: { classNames: { dropdown: styles.calendar } },
      },
    },
    SegmentedControl: {
      defaultProps: {
        classNames: {
          root: styles.segmented,
          label: styles.segmentLabel,
          indicator: styles.segmentIndicator,
          innerLabel: styles.segmentText,
        },
      },
    },
    Radio: {
      defaultProps: { classNames: { radio: styles.radio } },
    },
    Progress: {
      defaultProps: {
        classNames: { root: styles.progress, section: styles.progressFill },
      },
    },
  },
});

/** Scope the approved control styling to the check, including portal menus. */
export function CheckFlowTheme({ children }: { children: ReactNode }) {
  return (
    <MantineThemeProvider theme={checkTheme}>
      <div className={formScope}>{children}</div>
    </MantineThemeProvider>
  );
}
