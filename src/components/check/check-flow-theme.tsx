"use client";

import { MantineThemeProvider, createTheme } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./check-controls.module.css";

const inputClasses = {
  input: styles.input,
  section: styles.inputSection,
  label: styles.label,
  description: styles.description,
  error: styles.error,
};
const checkTheme = createTheme({
  components: {
    TextInput: { defaultProps: { classNames: inputClasses } },
    NumberInput: { defaultProps: { classNames: inputClasses } },
    Textarea: { defaultProps: { classNames: inputClasses } },
    Select: {
      defaultProps: {
        classNames: {
          ...inputClasses,
          dropdown: styles.dropdown,
          option: styles.option,
          empty: styles.empty,
        },
      },
    },
    DateInput: {
      defaultProps: {
        classNames: inputClasses,
        popoverProps: { classNames: { dropdown: styles.calendar } },
      },
    },
    Button: {
      defaultProps: {
        classNames: { root: styles.button },
        radius: "xl",
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
    Checkbox: {
      defaultProps: {
        classNames: {
          root: styles.checkbox,
          input: styles.checkboxInput,
          label: styles.checkboxLabel,
          description: styles.checkboxDescription,
        },
      },
    },
    Radio: {
      defaultProps: { classNames: { radio: styles.radio } },
    },
    Alert: {
      defaultProps: {
        classNames: { root: styles.alert, message: styles.alertMessage },
      },
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
      <div className={styles.scope}>{children}</div>
    </MantineThemeProvider>
  );
}
