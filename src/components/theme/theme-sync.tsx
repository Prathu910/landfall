"use client";

import { useMantineColorScheme } from "@mantine/core";
import { useEffect } from "react";
import { themeColorFor } from "@/lib/brand/viewport";
import { printLight } from "./print-light";

function setThemeColor(choice: Parameters<typeof themeColorFor>[0]) {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) =>
      meta.setAttribute(
        "content",
        themeColorFor(choice, meta.getAttribute("media")),
      ),
    );
}

/**
 * Always mounted (in Providers): keeps the browser bar on the reader's
 * choice from the first load, not only while the menu is open, and prints
 * every page in the light design.
 */
export function ThemeSync() {
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    setThemeColor(colorScheme);
    return () => setThemeColor("auto");
  }, [colorScheme]);

  useEffect(() => {
    const print = printLight(document.documentElement);
    const printQuery = window.matchMedia("print");
    const onPrintQuery = (event: MediaQueryListEvent) =>
      event.matches ? print.enter() : print.leave();
    window.addEventListener("beforeprint", print.enter);
    window.addEventListener("afterprint", print.leave);
    printQuery.addEventListener("change", onPrintQuery);
    return () => {
      window.removeEventListener("beforeprint", print.enter);
      window.removeEventListener("afterprint", print.leave);
      printQuery.removeEventListener("change", onPrintQuery);
      print.leave();
    };
  }, []);

  return null;
}
