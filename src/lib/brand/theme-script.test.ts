import { describe, expect, it } from "vitest";
import { LIGHT_DARK_PROBE, THEME_STORAGE_KEY } from "./theme";
import { themeScript } from "./theme-script";

type Run = {
  stored?: string | null;
  storageThrows?: boolean;
  deviceDark?: boolean;
  lightDark?: boolean;
};

/** Runs the head script against a fake window and returns the attribute it set. */
function run({
  stored = null,
  storageThrows = false,
  deviceDark = false,
  lightDark = true,
}: Run): string | undefined {
  const attributes: Record<string, string> = {};
  const window = {
    get localStorage() {
      if (storageThrows) throw new Error("blocked");
      return {
        getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null),
      };
    },
    matchMedia: (query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" && deviceDark,
    }),
    CSS: {
      supports: (property: string, value: string) =>
        property === "color" && value === LIGHT_DARK_PROBE && lightDark,
    },
  };
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => {
        attributes[name] = value;
      },
    },
  };
  new Function("window", "document", themeScript(THEME_STORAGE_KEY))(
    window,
    document,
  );
  return attributes["data-mantine-color-scheme"];
}

describe("themeScript", () => {
  it("applies a saved Light or Dark over the device", () => {
    expect(run({ stored: "dark", deviceDark: false })).toBe("dark");
    expect(run({ stored: "light", deviceDark: true })).toBe("light");
  });
  it("follows the device for System, nothing saved or an unknown value", () => {
    for (const stored of ["auto", null, "purple"]) {
      expect(run({ stored, deviceDark: true }), String(stored)).toBe("dark");
      expect(run({ stored, deviceDark: false }), String(stored)).toBe("light");
    }
  });
  it("sets nothing when storage throws, so the CSS follows the device", () => {
    expect(run({ storageThrows: true, deviceDark: true })).toBeUndefined();
  });
  it("keeps browsers without light-dark() on the light design", () => {
    expect(run({ stored: "dark", lightDark: false })).toBe("light");
    expect(run({ deviceDark: true, lightDark: false })).toBe("light");
  });
  it("quotes the key as a string literal", () => {
    expect(themeScript(THEME_STORAGE_KEY)).toContain('"migratelens-theme"');
    expect(themeScript('a"b')).toContain('"a\\"b"');
  });
});
