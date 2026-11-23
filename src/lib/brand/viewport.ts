import type { Viewport } from "next";
import { SHELL_PALETTE } from "./palette";

/**
 * The site is designed light only. Declaring it stops Chrome's auto-dark and
 * Samsung Internet from inverting the pages, and the theme colour matches the
 * white sticky header so the phone's browser bar runs into it.
 */
export const SITE_VIEWPORT = {
  colorScheme: "light",
  themeColor: SHELL_PALETTE.paper,
} as const satisfies Viewport;
