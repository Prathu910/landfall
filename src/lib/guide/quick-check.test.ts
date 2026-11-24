import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { ageOnDate } from "../migration";
import {
  EMPTY_ANSWERS,
  type QuickAnswers,
  quickCheck,
  quickProfile,
} from "./quick-check";

const AS_OF = "2026-11-23";
const { federal } = stateRuleData;
const READY: QuickAnswers = {
  ...EMPTY_ANSWERS,
  occupation: "254499",
  age: "25-32",
  english: "superior",
  qualification: "bachelor",
  overseasYears: 3,
  partner: "single",
  assessment: "positive",
};

const check = (answers: QuickAnswers, id: string, visa?: string) =>
  quickCheck(answers, AS_OF, federal).checks.find(
    (c) => c.id === id && (visa === undefined || c.visa === visa),
  );

describe("quickProfile", () => {
  it("turns an age band into a date of birth inside that band", () => {
    for (const [band, age] of [
      ["18-24", 18],
      ["25-32", 25],
      ["33-39", 33],
      ["40-44", 40],
      ["45-plus", 45],
    ] as const) {
      const profile = quickProfile({ ...READY, age: band }, AS_OF);
      expect(ageOnDate(profile.dob, AS_OF)).toBe(age);
    }
  });
  it("leaves unanswered questions unanswered", () => {
    const profile = quickProfile(EMPTY_ANSWERS, AS_OF);
    expect(profile.dob).toBe("");
    expect(profile.english).toBe("unknown");
    expect(profile.partner).toBe("unknown");
  });
});

describe("quickCheck points", () => {
  it("scores the answers with the site's points calculation", () => {
    // Age 30, Superior 20, bachelor 15, 3 years overseas 5, single 10.
    expect(quickCheck(READY, AS_OF, federal).points).toEqual({
      "189": 80,
      "190": 85,
      "491": 95,
    });
  });
  it("gives Professional Year points only for a qualifying occupation", () => {
    const withPY = { ...READY, professionalYear: true };
    expect(quickCheck(withPY, AS_OF, federal).points["189"]).toBe(80);
    expect(
      quickCheck({ ...withPY, occupation: "261313" }, AS_OF, federal).points[
        "189"
      ],
    ).toBe(85);
  });
});

describe("quickCheck basic requirements", () => {
  it("meets every basic for all three visas with a strong profile", () => {
    const result = quickCheck(READY, AS_OF, federal);
    expect(result.visasMeetingBasics).toEqual(["189", "190", "491"]);
    expect(result.checks.every((c) => c.status === "met")).toBe(true);
  });

  it("fails age at 45 or over and leaves no visa", () => {
    const answers = { ...READY, age: "45-plus" as const };
    expect(check(answers, "age")?.status).toBe("not-met");
    expect(quickCheck(answers, AS_OF, federal).visasMeetingBasics).toEqual([]);
  });

  it("marks a missing English test or assessment as not yet, not failed", () => {
    const answers = {
      ...READY,
      english: "not-yet" as const,
      assessment: "not-yet" as const,
    };
    expect(check(answers, "english")?.status).toBe("not-yet");
    expect(check(answers, "assessment")?.status).toBe("not-yet");
  });

  it("checks the occupation against each visa's Home Affairs list", () => {
    const answers = { ...READY, occupation: "121212" };
    expect(check(answers, "occupation", "189")?.status).toBe("not-met");
    expect(check(answers, "occupation", "190")?.status).toBe("met");
    expect(quickCheck(answers, AS_OF, federal).visasMeetingBasics).toEqual([
      "190",
      "491",
    ]);
  });

  it("counts nomination points toward 65 for 190 and 491", () => {
    // 60: age 30, competent 0, bachelor 15, 3 years overseas 5, single 10.
    const answers = { ...READY, english: "competent" as const };
    const result = quickCheck(answers, AS_OF, federal);
    expect(result.points["189"]).toBe(60);
    expect(check(answers, "points", "189")?.status).toBe("not-met");
    expect(check(answers, "points", "190")?.status).toBe("met");
    expect(result.visasMeetingBasics).toEqual(["190", "491"]);
  });

  it("treats an unanswered question as unknown and meets no visa", () => {
    const result = quickCheck(EMPTY_ANSWERS, AS_OF, federal);
    expect(result.answered).toBe(false);
    expect(quickCheck(READY, AS_OF, federal).answered).toBe(true);
    expect(result.checks.every((c) => c.status === "unknown")).toBe(true);
    expect(result.visasMeetingBasics).toEqual([]);
  });

  it("leaves the occupation unknown when the federal list can't be read", () => {
    const result = quickCheck(READY, AS_OF, null);
    expect(
      result.checks.filter((c) => c.id === "occupation").map((c) => c.status),
    ).toEqual(["unknown", "unknown", "unknown"]);
    expect(result.visasMeetingBasics).toEqual([]);
  });

  it("cites an official source for every check", () => {
    for (const c of quickCheck(READY, AS_OF, federal).checks) {
      expect(c.source).toMatch(/^https:\/\/immi\.homeaffairs\.gov\.au\//);
    }
  });
});
