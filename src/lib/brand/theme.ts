/**
 * The reader's theme choice. Mantine stores it in localStorage under this key
 * ("light" | "dark" | "auto") and its head script applies it before paint.
 */
export const THEME_STORAGE_KEY = "migratelens-theme";

export const THEME_CHOICES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "System" },
] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number]["value"];
export type ResolvedTheme = "light" | "dark";

/** "auto" follows the device; an explicit choice wins over it. */
export function resolveTheme(
  choice: ThemeChoice,
  deviceDark: boolean,
): ResolvedTheme {
  if (choice === "auto") return deviceDark ? "dark" : "light";
  return choice;
}

/** What "System" means right now, shown beside it. */
export function deviceThemeNote(deviceDark: boolean): string {
  return deviceDark ? "Dark now" : "Light now";
}

/**
 * The feature test for `light-dark()` (Safari 17.5, Chrome 123, Firefox
 * 120). Browsers without it get only the light design: the head script, the
 * Mantine provider and the `@supports not` block in globals.css all use it.
 */
export const LIGHT_DARK_PROBE = "light-dark(#000, #fff)";
