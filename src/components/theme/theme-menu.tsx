"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AppearanceIcon } from "./theme-icons";
import { ThemeChoices } from "./theme-choices";
import styles from "./theme-control.module.css";

/**
 * The header's compact appearance button and its Light / Dark / System menu.
 * Hand-built rather than Mantine's Popover, which put about 5 KB gzipped of
 * positioning code on routes that had no other popover. It keeps the
 * Popover's behaviour: focus moves to the current choice and stays in the
 * menu, and Escape or a click outside closes it and returns focus.
 */
export function ThemeMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = root.current?.querySelector<HTMLElement>("[role=dialog]");
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) return;
    // The choices are one radio group, so the trap has a single stop.
    if (event.key === "Tab" && event.target !== button.current)
      event.preventDefault();
    if (event.key === "Escape") {
      setOpen(false);
      button.current?.focus();
    }
  }

  return (
    <div
      ref={root}
      className={`${styles.anchor} ${className ?? ""}`}
      onKeyDown={onKeyDown}
    >
      <button
        ref={button}
        type="button"
        className={styles.button}
        aria-label="Appearance"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(!open)}
      >
        <AppearanceIcon />
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Appearance"
          className={styles.popover}
        >
          <ThemeChoices variant="list" />
        </div>
      ) : null}
    </div>
  );
}
