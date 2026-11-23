"use client";

import { Popover } from "@mantine/core";
import { AppearanceIcon } from "./theme-icons";
import { ThemeChoices } from "./theme-choices";
import styles from "./theme-control.module.css";

/** The header's compact appearance button and its Light / Dark / System menu. */
export function ThemeMenu({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Popover
        position="bottom-end"
        offset={10}
        width={248}
        trapFocus
        returnFocus
        closeOnEscape
        transitionProps={{ duration: 0 }}
      >
        <Popover.Target>
          <button
            type="button"
            className={styles.button}
            aria-label="Appearance"
          >
            <AppearanceIcon />
          </button>
        </Popover.Target>
        <Popover.Dropdown className={styles.popover}>
          <ThemeChoices variant="list" />
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}
