import { describe, expect, it } from "vitest";
import { NOT_AVAILABLE } from "./label-189";
import {
  NOT_AVAILABLE_189,
  READ_BANNED,
  allowedNumbers,
  checkRead,
} from "./read-contract";
import type { ReportFacts } from "./read-contract";

// Priya's facts, cut down to the numbers the mockup's read uses.
const PRIYA: ReportFacts = {
  occupation: "Registered Nurses nec",
  dataMonth: "October 2026",
  situation: "189",
  lodged: false,
  stamp: { visa: "189", state: null, label: "Competitive" },
  visas: [
    {
      visa: "189",
      label: "Competitive",
      state: null,
      points: 70,
      caption: "Competitive at your points.",
    },
    {
      visa: "190",
      label: "Competitive",
      state: "New South Wales",
      points: 75,
      caption: "New South Wales invited at or below your points.",
    },
  ],
  counts: [{ name: "invited", text: "168", numbers: [168] }],
  route: [],
  wait: "Uncertain.",
  changes: [
    {
      title: "Superior English",
      fromPoints: 70,
      toPoints: 80,
      toLabel: "Very strong",
      month: null,
    },
  ],
  extraNumbers: [10, 6, 85],
};

const PRIYA_READ =
  "Your fastest win is English. A Superior score adds 10 points and puts you at 80, enough for every one of the last 6 rounds. It also lifts your NSW 190 score to 85. In October, NSW invited 168 nurses at just 80.";

function words(n: number): string {
  return Array.from({ length: n }, () => "word").join(" ");
}

describe("checkRead", () => {
  it("accepts the mockup's read for Priya", () => {
    expect(checkRead(PRIYA_READ, PRIYA)).toEqual({ ok: true });
  });

  it("rejects a number that isn't in the facts", () => {
    const text = PRIYA_READ.replace("168 nurses", "999 nurses");
    expect(checkRead(text, PRIYA)).toEqual({ ok: false, reason: "number" });
  });

  it("reads numbers with commas as one number", () => {
    const facts = {
      ...PRIYA,
      counts: [
        ...PRIYA.counts,
        { name: "tied", text: "1,841", numbers: [1841] },
      ],
    };
    const text = `${PRIYA_READ} About 1,841 EOIs sit at 70.`;
    expect(checkRead(text, facts)).toEqual({ ok: true });
    expect(checkRead(`${PRIYA_READ} About 1,842 EOIs.`, facts)).toEqual({
      ok: false,
      reason: "number",
    });
  });

  it("allows years and numbers written in the facts' month strings", () => {
    const text = `${PRIYA_READ} That was in October 2026.`;
    expect(checkRead(text, PRIYA)).toEqual({ ok: true });
    expect(checkRead(`${PRIYA_READ} That was in 2025.`, PRIYA)).toEqual({
      ok: false,
      reason: "number",
    });
  });

  it("rejects a banned phrase", () => {
    const text = PRIYA_READ.replace(
      "just 80",
      "just 80, and you will be invited",
    );
    expect(checkRead(text, PRIYA)).toEqual({ ok: false, reason: "banned" });
  });

  it.each([
    "That was on 12 March 2026.",
    "Your test expires on 2 Feb.",
    "The round on October 15 invited nurses.",
    "Since Mar 4, nothing changed.",
  ])("rejects a day-precise date: %s", (date) => {
    // The day numbers are allowed here, so only the date shape can fail it.
    const facts = {
      ...PRIYA,
      extraNumbers: [...PRIYA.extraNumbers, 2, 4, 12, 15],
    };
    expect(checkRead(`${PRIYA_READ} ${date}`, facts)).toEqual({
      ok: false,
      reason: "number",
    });
  });

  describe("off the Home Affairs 189 list", () => {
    const offList: ReportFacts = {
      ...PRIYA,
      visas: [{ ...PRIYA.visas[0], label: "Not available" }, PRIYA.visas[1]],
    };

    it.each([
      "Superior English opens 189 for you.",
      "You can then submit your 189 EOI.",
      "Submit a 189 EOI after your retake.",
    ])("rejects a read that says %s", (line) => {
      const text = `${PRIYA_READ} ${line}`;
      expect(checkRead(text, offList)).toEqual({
        ok: false,
        reason: "banned",
      });
    });

    it("allows the same wording when 189 is on the list", () => {
      const text = `${PRIYA_READ} Superior English opens 189 for you.`;
      expect(checkRead(text, PRIYA)).toEqual({ ok: true });
    });

    it("marks off-list facts with the report's own 189 name", () => {
      expect(NOT_AVAILABLE_189).toBe(NOT_AVAILABLE);
    });

    it("allows naming 189 as not available", () => {
      const text = `${PRIYA_READ} 189 isn't available for your occupation.`;
      expect(checkRead(text, offList)).toEqual({ ok: true });
    });
  });

  it("rejects a read of 30 words", () => {
    expect(checkRead(words(30), PRIYA)).toEqual({
      ok: false,
      reason: "length",
    });
  });

  it("rejects a read over 110 words", () => {
    expect(checkRead(words(111), PRIYA)).toEqual({
      ok: false,
      reason: "length",
    });
    expect(checkRead(words(110), PRIYA)).toEqual({ ok: true });
  });
});

describe("allowedNumbers", () => {
  it("collects points, counts, changes and extra numbers", () => {
    const allowed = allowedNumbers(PRIYA);
    for (const n of [70, 75, 80, 168, 10, 6, 85, 189, 190, 2026]) {
      expect(allowed.has(n)).toBe(true);
    }
    expect(allowed.has(999)).toBe(false);
  });
});

describe("READ_BANNED", () => {
  it.each([
    "This is guaranteed.",
    "Nothing guarantees it.",
    "Ten per cent of EOIs.",
    "Ten percent of EOIs.",
    "A Guarantee.",
    "You'll definitely get one.",
    "You will be invited.",
    "50% of EOIs.",
    "Your chances of success.",
    "a chance of an invite",
    "You're likely to be invited.",
    "There were some invitations.",
    "Only A few EOIs.",
  ])("bans %s", (text) => {
    expect(text).toMatch(READ_BANNED);
  });

  it.each([
    "Your best chance is Tasmania, not 189.",
    "Fewer than 20 EOIs score higher.",
    "Small numbers of invitations.",
    "You may update your EOI in March 2027.",
  ])("allows %s", (text) => {
    expect(text).not.toMatch(READ_BANNED);
  });
});
