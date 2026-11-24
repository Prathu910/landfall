import { describe, expect, it } from "vitest";
import { BANNED_COPY, formatLongMonth } from "../report/copy";
import { droppedNote, droppedSince } from "./dropped";

const live = { code: "1", name: "A", hasData: true };
const gone = { ...live, lastAsAt: "2026-10", lastCheckedAt: "2026-11-17" };

describe("dropped occupations", () => {
  it("names the month after the last published one", () => {
    expect(droppedSince(gone)).toBe("2026-11");
    expect(droppedSince({ ...gone, lastAsAt: "2026-12" })).toBe("2027-01");
    expect(droppedSince(live)).toBeNull();
  });

  it("words the note, or gives none", () => {
    expect(droppedNote(gone)).toBe(
      "Not in the SkillSelect data since November 2026",
    );
    expect(droppedNote(live)).toBeNull();
    expect(BANNED_COPY.test(droppedNote(gone)!)).toBe(false);
  });

  it("spells every month in full", () => {
    expect(formatLongMonth("2026-01")).toBe("January 2026");
    expect(formatLongMonth("2026-12")).toBe("December 2026");
  });
});
