import { describe, expect, it } from "vitest";
import {
  deadlineLines,
  deadlinePosition,
  routeAria,
  stepX,
  wrapText,
} from "./route-geometry";
import type { Route, RouteDeadline } from "./route";

const deadline: RouteDeadline = {
  date: "9 Aug 2027",
  title: "Your 33rd birthday, 9 Aug 2027: −5",
  sub: "",
  afterStep: 1,
};

describe("route geometry", () => {
  it("places a deadline halfway past its step, never beyond the last", () => {
    expect(deadlinePosition(deadline, 4)).toBe(1.5);
    expect(deadlinePosition({ ...deadline, afterStep: 3 }, 4)).toBe(3);
  });

  it("spreads steps between the margins", () => {
    expect(stepX(0, 3, 300, 50)).toBe(50);
    expect(stepX(2, 3, 300, 50)).toBe(250);
    expect(stepX(0, 1, 300, 50)).toBe(150);
  });

  it("splits a deadline title into name and date", () => {
    expect(deadlineLines(deadline)).toEqual([
      "Your 33rd birthday",
      "9 Aug 2027: −5",
    ]);
    expect(deadlineLines({ ...deadline, title: "Expires" })).toEqual([
      "Expires",
      "9 Aug 2027",
    ]);
  });

  it("wraps words greedily", () => {
    expect(wrapText("one two three four", 8)).toEqual([
      "one two",
      "three",
      "four",
    ]);
    expect(wrapText("unbreakable", 4)).toEqual(["unbreakable"]);
  });

  it("describes steps and deadlines for screen readers", () => {
    const route: Route = {
      steps: [
        { title: "Book test", sub: "", points: null, label: null },
        { title: "Lodge EOI", sub: "", points: 85, label: "strong" },
      ],
      deadlines: [deadline],
    };
    const aria = routeAria(route);
    expect(aria).toContain("1. Book test; 2. Lodge EOI, 85 points, Strong.");
    expect(aria).toContain("Your 33rd birthday");
  });
});
