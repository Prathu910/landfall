import { describe, expect, it } from "vitest";
import { lightFallback, lightValue } from "./light-fallback";

describe("lightValue", () => {
  it("keeps the light argument of each light-dark()", () => {
    expect(lightValue("light-dark(#fff, #000)")).toBe("#fff");
    expect(lightValue("light-dark(transparent, #ece6d814)")).toBe(
      "transparent",
    );
  });
  it("handles calls inside a longer value and nested brackets", () => {
    expect(
      lightValue("0 1px light-dark(#12202c35, #000000c0), inset 0 1px 0 red"),
    ).toBe("0 1px #12202c35, inset 0 1px 0 red");
    expect(
      lightValue("light-dark(color-mix(in srgb, red 5%, blue), #000)"),
    ).toBe("color-mix(in srgb, red 5%, blue)");
  });
  it("leaves a value without light-dark() alone", () => {
    expect(lightValue("var(--ink)")).toBe("var(--ink)");
  });
});

describe("lightFallback", () => {
  it("restates only the tokens with a dark value, ignoring comments", () => {
    const css = `:root {
      /* --old: light-dark(#111, #222); */
      --ink: light-dark(#1b1a17, #ece6d8);
      --gap: 4px;
      --shadow:
        0 1px light-dark(#12202c35, #000000c0),
        inset 0 1px 0 var(--edge);
    }`;
    expect(lightFallback(css)).toEqual([
      "--ink: #1b1a17;",
      "--shadow: 0 1px #12202c35, inset 0 1px 0 var(--edge);",
    ]);
  });
});
