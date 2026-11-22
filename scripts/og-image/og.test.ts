import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { markSvg } from "./render";
import {
  MARK_COLOURS,
  MARK_VIEWBOX,
  markSvgBody,
} from "../../src/components/brand/mark-geometry";

const root = join(__dirname, "..", "..");

describe("social share image", () => {
  it("public/og.png is 1200x630", () => {
    const png = readFileSync(join(root, "public", "og.png"));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it("layout metadata references /og.png for Open Graph and Twitter", () => {
    const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
    expect(layout).toMatch(
      /openGraph:\s*{[^}]*images:\s*\[\s*{\s*url:\s*"\/og\.png"/,
    );
    expect(layout).toMatch(
      /twitter:\s*{[^}]*images:\s*\[\s*{\s*url:\s*"\/og\.png"/,
    );
    expect(layout).toContain("summary_large_image");
  });

  it("the template mark is built from the logo geometry", () => {
    const svg = markSvg();
    expect(svg).toContain(`viewBox="${MARK_VIEWBOX}"`);
    expect(svg).toContain(markSvgBody(MARK_COLOURS.reversed));
  });
});
