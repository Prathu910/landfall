import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { LogoMark } from "./logo";
import {
  faviconSvg,
  MARK_COLOURS,
  MARK_PATHS,
  markSvgBody,
} from "./mark-geometry";

const read = (path: string) => readFileSync(path, "utf8");

describe("open lens identity", () => {
  it("keeps exported marks and the favicon in sync with shared geometry", () => {
    expect(read("src/app/icon.svg")).toBe(faviconSvg());
    for (const [file, colour] of [
      ["mark-ink.svg", MARK_COLOURS.ink],
      ["mark-reversed.svg", MARK_COLOURS.reversed],
    ] as const) {
      expect(read(`public/brand/${file}`)).toContain(markSvgBody(colour));
    }
  });
  it("renders the same single-ink geometry at favicon and lockup sizes", () => {
    for (const size of [16, 24, 32]) {
      const svg = renderToStaticMarkup(createElement(LogoMark, { size }));
      expect(svg).toContain(`width="${size}"`);
      for (const path of MARK_PATHS) expect(svg).toContain(`d="${path}"`);
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toContain("<title>");
    }
  });
  it("provides a text alternative when the mark is used on its own", () => {
    const svg = renderToStaticMarkup(
      createElement(LogoMark, {
        reversed: true,
        title: "MigrateLens open lens mark",
      }),
    );
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="MigrateLens open lens mark"');
    expect(svg).toContain(`<title>MigrateLens open lens mark</title>`);
    expect(svg).toContain(`stroke="${MARK_COLOURS.reversed}"`);
    expect(svg).not.toContain('aria-hidden="true"');
  });
});
