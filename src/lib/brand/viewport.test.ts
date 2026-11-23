import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SHELL_PALETTE, SHELL_PALETTE_DARK } from "./palette";
import { SITE_VIEWPORT } from "./viewport";

const globals = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const header = readFileSync(
  new URL("../../components/site-header.module.css", import.meta.url),
  "utf8",
);

describe("SITE_VIEWPORT", () => {
  it("supports light and dark, following the device by default", () => {
    expect(SITE_VIEWPORT.colorScheme).toBe("light dark");
    const root = /^:root \{[^}]*\}/m.exec(globals)?.[0] ?? "";
    expect(root).toMatch(/\n\s*color-scheme: light dark;/);
    expect(globals).toMatch(
      /:root\[data-mantine-color-scheme="dark"\] \{\s*color-scheme: dark;/,
    );
  });

  it("tints the browser bar to match the site header in each scheme", () => {
    expect(SITE_VIEWPORT.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: SHELL_PALETTE.paper },
      {
        media: "(prefers-color-scheme: dark)",
        color: SHELL_PALETTE_DARK.paper,
      },
    ]);
    expect(header).toMatch(/\.header \{[^}]*background: var\(--brand-paper\);/);
  });
});
