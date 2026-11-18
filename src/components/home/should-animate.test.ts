import { describe, expect, it } from "vitest";
import { shouldAnimate } from "./should-animate";

describe("shouldAnimate", () => {
  it("never animates when the viewer asks for reduced motion", () => {
    expect(shouldAnimate(true, true)).toBe(false);
    expect(shouldAnimate(true, false)).toBe(false);
  });

  it("waits until the stage has been in view", () => {
    expect(shouldAnimate(false, false)).toBe(false);
  });

  it("animates once in view with motion allowed", () => {
    expect(shouldAnimate(false, true)).toBe(true);
  });
});
