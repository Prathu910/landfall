import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SHELL_PALETTE } from "./palette";
import { SITE_VIEWPORT } from "./viewport";

const globals = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const header = readFileSync(
  new URL("../../components/site-header.module.css", import.meta.url),
  "utf8",
);

// The site is light only, so browsers must not force a dark version of it.
describe("SITE_VIEWPORT", () => {
  it("declares a light-only colour scheme", () => {
    expect(SITE_VIEWPORT.colorScheme).toBe("light");
    const root = /^:root \{[^}]*\}/m.exec(globals)?.[0] ?? "";
    expect(root).toMatch(/\n\s*color-scheme: light;/);
  });

  it("tints the browser bar to match the white site header", () => {
    expect(SITE_VIEWPORT.themeColor).toBe(SHELL_PALETTE.paper);
    expect(header).toMatch(/\.header \{[^}]*background: var\(--brand-paper\);/);
  });
});
