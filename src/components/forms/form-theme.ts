import type { MantineThemeComponents } from "@mantine/core";
import styles from "./form-controls.module.css";

export const inputClasses = {
  input: styles.input,
  section: styles.inputSection,
  label: styles.label,
  description: styles.description,
  error: styles.error,
};

/** Mantine defaults for the approved controls, shared by the check and /feedback/. */
export const formComponents: MantineThemeComponents = {
  TextInput: { defaultProps: { classNames: inputClasses } },
  Textarea: { defaultProps: { classNames: inputClasses } },
  NativeSelect: { defaultProps: { classNames: inputClasses } },
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
  Button: {
    defaultProps: { classNames: { root: styles.button }, radius: "xl" },
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
  Alert: {
    defaultProps: {
      classNames: { root: styles.alert, message: styles.alertMessage },
    },
  },
};

/** The class that scopes the controls' tokens; wrap portals' parents in it. */
export const formScope = styles.scope;
