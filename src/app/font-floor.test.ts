import { describe, expect, it } from "vitest";
import { findSmallFontSizes } from "./font-floor";

const css = (source: string) => findSmallFontSizes(source, "css");
const tsx = (source: string) => findSmallFontSizes(source, "tsx");

describe("findSmallFontSizes (css)", () => {
  it("catches px and rem font-size under the floor", () => {
    expect(css("a{font-size:11px}")).toHaveLength(1);
    expect(css("a { font-size: 0.7rem; }")).toHaveLength(1);
    expect(css("a { font-size: 12px; }")).toEqual([]);
    expect(css("a { font-size: 0.75rem; }")).toEqual([]);
  });

  it("checks every length inside clamp()", () => {
    expect(css("a { font-size: clamp(0.6rem, 2vw, 1rem); }")).toHaveLength(1);
    expect(css("a { font-size: clamp(14px, 2vw, 20px); }")).toEqual([]);
  });

  it("catches the font shorthand but not keywords or line-height", () => {
    expect(css("a { font: 600 11px/1.2 Inter; }")).toHaveLength(1);
    expect(css("a { font: 600 14px/10px Inter; }")).toEqual([]);
    expect(css("a { font: inherit; }")).toEqual([]);
  });

  it("catches two declarations on one line and values split over lines", () => {
    expect(css("a{font-size:11px}b{font-size:9px}")).toHaveLength(2);
    expect(css("a {\n  font-size:\n    10px;\n}")).toEqual([
      { line: 3, value: "10px" },
    ]);
  });

  it("reports the line of each hit and ignores comments", () => {
    expect(css("a{}\n\nb{font-size:8px}")).toEqual([{ line: 3, value: "8px" }]);
    expect(css("/* font-size: 8px */ a{}")).toEqual([]);
  });
});

describe("findSmallFontSizes (tsx)", () => {
  it("catches JSX, object and SVG attribute forms", () => {
    expect(tsx("<text fontSize={10} />")).toHaveLength(1);
    expect(tsx("const s = { fontSize: 10 };")).toHaveLength(1);
    expect(tsx('<text font-size="10" />')).toHaveLength(1);
    expect(tsx('<text fontSize="11" />')).toHaveLength(1);
    expect(tsx("<text fontSize={12} />")).toEqual([]);
  });

  it("respects units on string values", () => {
    expect(tsx('const s = { fontSize: "0.7rem" };')).toHaveLength(1);
    expect(tsx('const s = { fontSize: "1rem" };')).toEqual([]);
    expect(tsx('const s = { fontSize: "11px" };')).toHaveLength(1);
  });

  it("skips non-literal values", () => {
    expect(tsx("<text fontSize={size} />")).toEqual([]);
  });
});
