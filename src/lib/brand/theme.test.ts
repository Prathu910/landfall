import { describe, expect, it } from "vitest";
import {
  deviceThemeNote,
  resolveTheme,
  THEME_CHOICES,
  THEME_STORAGE_KEY,
} from "./theme";

describe("resolveTheme", () => {
  it("follows the device when the reader has not chosen", () => {
    expect(resolveTheme("auto", true)).toBe("dark");
    expect(resolveTheme("auto", false)).toBe("light");
  });
  it("lets an explicit choice win over the device", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("theme choices", () => {
  it("offers Light, Dark and System, stored as Mantine's values", () => {
    expect(THEME_CHOICES.map((c) => c.label)).toEqual([
      "Light",
      "Dark",
      "System",
    ]);
    expect(THEME_CHOICES.map((c) => c.value)).toEqual([
      "light",
      "dark",
      "auto",
    ]);
    expect(THEME_STORAGE_KEY).toBe("migratelens-theme");
  });
  it("says what System resolves to now", () => {
    expect(deviceThemeNote(true)).toBe("Dark now");
    expect(deviceThemeNote(false)).toBe("Light now");
  });
});
