import { describe, expect, it } from "vitest";
import type { TimelineEvent } from "../migration";
import { BANNED_COPY } from "./copy";
import { buildWhatCouldChange } from "./what-could-change";

const event = (date: string, title: string, delta?: number): TimelineEvent => ({
  date,
  title,
  description: "",
  kind: delta && delta < 0 ? "loss" : "gain",
  ...(delta !== undefined ? { delta } : {}),
});

const events = [
  event("2026-01-01", "Past gain", 5),
  event("2027-03-01", "Birthday", -5),
  event("2027-06-01", "No delta"),
  event("2027-07-01", "Zero", 0),
  event("2027-09-01", "Work year", 5),
  event("2028-01-01", "Third", 10),
];

describe("buildWhatCouldChange", () => {
  it("takes the next two future events with a delta, then the two largest positive scenarios", () => {
    const items = buildWhatCouldChange(
      events,
      [
        { label: "Superior English", delta: 10 },
        { label: "Partner skills", delta: 5 },
        { label: "Worse", delta: -5 },
        { label: "Professional Year", delta: 5 },
        { label: "Nothing", delta: 0 },
      ],
      "2026-11-17",
    );
    expect(items).toEqual([
      {
        label: "Birthday",
        effect: "−5",
        delta: -5,
        date: "2027-03-01",
        href: "#timeline",
      },
      {
        label: "Work year",
        effect: "+5",
        delta: 5,
        date: "2027-09-01",
        href: "#timeline",
      },
      {
        label: "Superior English",
        effect: "+10",
        delta: 10,
        date: null,
        href: "#scenarios",
      },
      {
        label: "Partner skills",
        effect: "+5",
        delta: 5,
        date: null,
        href: "#scenarios",
      },
    ]);
    expect(JSON.stringify(items)).not.toMatch(BANNED_COPY);
  });

  it("returns nothing when nothing applies", () => {
    expect(buildWhatCouldChange([], [], "2026-11-17")).toEqual([]);
  });
});
