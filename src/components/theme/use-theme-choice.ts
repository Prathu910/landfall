"use client";

import { useMantineColorScheme } from "@mantine/core";
import { useEffect, useSyncExternalStore } from "react";
import { THEME_COLOR } from "@/lib/brand/viewport";
import {
  resolveTheme,
  type ResolvedTheme,
  type ThemeChoice,
} from "@/lib/brand/theme";

const DEVICE_DARK = "(prefers-color-scheme: dark)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** Long enough for the 200ms colour ease and the guilloche's delayed wake. */
const SWITCH_MS = 650;
let switchTimer: number | undefined;

function subscribeDevice(onChange: () => void) {
  const query = window.matchMedia(DEVICE_DARK);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const deviceIsDark = () => window.matchMedia(DEVICE_DARK).matches;
const serverDevice = () => false;

/** The class that eases colours during a switch; never under reduced motion. */
function easeThemeSwitch() {
  if (window.matchMedia(REDUCED_MOTION).matches) return;
  const root = document.documentElement;
  root.classList.add("theme-switching");
  window.clearTimeout(switchTimer);
  switchTimer = window.setTimeout(
    () => root.classList.remove("theme-switching"),
    SWITCH_MS,
  );
}

/**
 * The browser bar follows the device through the media-tagged theme-color
 * tags; a manual choice that differs from the device overrides both.
 */
function syncThemeColor(forced: ResolvedTheme | null) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const own = meta.getAttribute("media")?.includes("dark")
      ? THEME_COLOR.dark
      : THEME_COLOR.light;
    meta.setAttribute("content", forced ? THEME_COLOR[forced] : own);
  });
}

export function useThemeChoice() {
  // keepTransitions: our own class eases the switch (or skips it under
  // reduced motion) instead of Mantine's blanket transition kill.
  const { colorScheme, setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });
  const deviceDark = useSyncExternalStore(
    subscribeDevice,
    deviceIsDark,
    serverDevice,
  );
  const resolved = resolveTheme(colorScheme, deviceDark);

  useEffect(() => {
    syncThemeColor(colorScheme === "auto" ? null : resolved);
  }, [colorScheme, resolved]);

  function choose(next: ThemeChoice) {
    if (resolveTheme(next, deviceDark) !== resolved) easeThemeSwitch();
    setColorScheme(next);
  }

  return { choice: colorScheme, deviceDark, choose };
}
