import type { Viewport } from "next";
import { SHELL_PALETTE, SHELL_PALETTE_DARK } from "./palette";

/** The browser bar runs into the sticky header: white by day, night card at night. */
export const THEME_COLOR = {
  light: SHELL_PALETTE.paper,
  dark: SHELL_PALETTE_DARK.paper,
} as const;

/**
 * Light and dark (founder decision, 23 Nov 2026, superseding "only light").
 * The browser follows the device until the reader picks a theme in the
 * header; then the theme control rewrites both theme-color tags.
 */
export const SITE_VIEWPORT = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
} as const satisfies Viewport;
