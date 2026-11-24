"use client";

import { useMantineColorScheme } from "@mantine/core";
import { useSyncExternalStore } from "react";
import { resolveTheme, type ThemeChoice } from "@/lib/brand/theme";

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

  function choose(next: ThemeChoice) {
    if (resolveTheme(next, deviceDark) !== resolved) easeThemeSwitch();
    setColorScheme(next);
  }

  return { choice: colorScheme, deviceDark, choose };
}
