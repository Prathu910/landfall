import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  calculatePoints,
  emptyProfile,
  formatDate,
  localToday,
  NOMINATION_POINTS,
  sampleProfile,
  type Profile,
} from "./migration";

// An ICT occupation, so Professional Year points can apply.
const complete = (overrides: Partial<Profile> = {}): Profile => ({
  ...sampleProfile,
  occupation: "261111",
  assessmentDate: "2026-01-01",
  ...overrides,
});
const points = (profile: Profile, key: string, date = "2026-11-17") =>
  calculatePoints(profile, date).categories.find(
    (category) => category.key === key,
  )?.points;

describe("federal points estimate", () => {
  it("scores the sample at 90 before conditional nomination", () => {
    const result = calculatePoints(sampleProfile, "2026-11-17");
    expect(result.base).toBe(90);
    expect(result.subclass190).toBe(95);
    expect(result.subclass491).toBe(105);
  });

  it("adds exactly NOMINATION_POINTS for the 190 and 491", () => {
    const result = calculatePoints(sampleProfile, "2026-11-17");
    expect(result.subclass190 - result.base).toBe(NOMINATION_POINTS["190"]);
    expect(result.subclass491 - result.base).toBe(NOMINATION_POINTS["491"]);
    const invalid = calculatePoints(sampleProfile, "not a date");
    expect(invalid.subclass190).toBe(NOMINATION_POINTS["190"]);
    expect(invalid.subclass491).toBe(NOMINATION_POINTS["491"]);
  });

  it("changes age points on the 33rd birthday", () => {
    const profile = complete({ dob: "1993-11-18" });
    expect(points(profile, "age", "2026-11-17")).toBe(30);
    expect(points(profile, "age", "2026-11-18")).toBe(25);
  });

  it("ends modeled age eligibility on the 45th birthday", () => {
    const profile = complete({ dob: "1981-11-18" });
    expect(calculatePoints(profile, "2026-11-17").eligible).toBe(true);
    expect(calculatePoints(profile, "2026-11-18").eligible).toBe(false);
    expect(points(profile, "age", "2026-11-18")).toBe(0);
  });

  it("names each reason the modeled eligibility fails, and none when it holds", () => {
    const check = (overrides: Partial<Profile>) =>
      calculatePoints(complete(overrides), "2026-11-18").ineligibleReasons;
    expect(check({})).toEqual([]);
    expect(check({ dob: "1979-06-01" })).toEqual(["age 45 or over"]);
    expect(check({ dob: "2010-01-01" })).toEqual(["age under 18"]);
    expect(check({ englishDate: "2023-11-17" })).toEqual([
      "English test expired",
    ]);
    expect(check({ assessmentDate: "2023-11-17" })).toEqual([
      "skills assessment expired",
    ]);
    expect(check({ dob: "1979-06-01", englishDate: "2023-11-17" })).toEqual([
      "age 45 or over",
      "English test expired",
    ]);
    // Unknown is not a failure: the reasons list only what failed.
    expect(calculatePoints(sampleProfile, "2026-11-18")).toMatchObject({
      eligible: null,
      ineligibleReasons: [],
    });
  });

  it("names the date fields that leave eligibility unknown (ruling P32)", () => {
    const unchecked = (overrides: Partial<Profile>) =>
      calculatePoints(complete(overrides), "2026-11-18").uncheckedDates;
    expect(unchecked({})).toEqual([]);
    expect(unchecked({ englishDate: "" })).toEqual(["englishDate"]);
    expect(unchecked({ englishDate: "2027-01-01" })).toEqual(["englishDate"]);
    expect(unchecked({ assessmentDate: "" })).toEqual(["assessmentDate"]);
    expect(unchecked({ assessmentExpiry: "2029-02-31" })).toEqual([
      "assessmentExpiry",
    ]);
    expect(unchecked({ englishDate: "", assessmentDate: "" })).toEqual([
      "englishDate",
      "assessmentDate",
    ]);
    // Without an English level there is no test date to ask for yet.
    expect(unchecked({ english: "unknown", englishDate: "" })).toEqual([]);
  });

  it("caps combined employment at 20 and uses threshold years", () => {
    expect(
      points(complete({ overseasYears: 8, australianYears: 8 }), "employment"),
    ).toBe(20);
    expect(
      points(complete({ overseasYears: 3, australianYears: 1 }), "employment"),
    ).toBe(10);
    expect(
      points(complete({ overseasYears: 2, australianYears: 0 }), "employment"),
    ).toBe(0);
  });

  it("records unanswered essentials without silently claiming eligibility", () => {
    const result = calculatePoints(emptyProfile, "2026-11-17");
    expect(result.base).toBe(0);
    expect(result.missing).toEqual(
      expect.arrayContaining([
        "Date of birth",
        "English proficiency",
        "Highest qualification",
        "Partner status",
      ]),
    );
    expect(result.eligible).toBeNull();
  });

  it("uses only the highest qualification while adding independent study categories", () => {
    const profile = complete({
      qualification: "doctorate",
      ausStudy: true,
      regionalStudy: true,
      specialistEducation: true,
    });
    expect(points(profile, "qualification")).toBe(20);
    expect(points(profile, "australian-study")).toBe(5);
    expect(points(profile, "regional-study")).toBe(5);
    expect(points(profile, "specialist-education")).toBe(10);
    expect(
      points(
        complete({ ausStudy: false, regionalStudy: true }),
        "regional-study",
      ),
    ).toBe(0);
  });

  it("removes English points at three calendar years and fails modeled eligibility", () => {
    const profile = complete({ englishDate: "2023-11-17" });
    const result = calculatePoints(profile, "2026-11-17");
    expect(points(profile, "english")).toBe(0);
    expect(result.eligible).toBe(false);
    expect(result.warnings.join(" ")).toMatch(/English.*expired/i);
  });

  it("warns for missing evidence dates while preserving self-reported points", () => {
    const result = calculatePoints(
      complete({ englishDate: "", assessmentDate: "" }),
      "2026-11-17",
    );
    expect(result.base).toBe(90);
    expect(result.eligible).toBeNull();
    expect(result.warnings.join(" ")).toMatch(/self.reported/i);
  });

  it("keeps English evidence status unknown without a test date even when assessment is current", () => {
    const result = calculatePoints(complete({ englishDate: "" }), "2026-11-17");
    expect(result.base).toBe(90);
    expect(result.eligible).toBeNull();
  });

  it("bounds invalid employment counts without producing non-finite points", () => {
    expect(
      points(
        complete({ overseasYears: -3, australianYears: Number.NaN }),
        "employment",
      ),
    ).toBe(0);
    expect(
      points(
        complete({
          overseasYears: Number.POSITIVE_INFINITY,
          australianYears: -1,
        }),
        "employment",
      ),
    ).toBe(0);
    const result = calculatePoints(
      complete({ overseasYears: 99, australianYears: 99 }),
      "2026-11-17",
    );
    expect(
      result.categories.find((category) => category.key === "employment")
        ?.points,
    ).toBe(20);
    expect(result.warnings.join(" ")).toMatch(/employment.*0.*10/i);
  });

  it.each([
    [0.99, 0, 0],
    [1, 0, 5],
    [2.99, 0, 5],
    [3, 0, 10],
    [5, 0, 15],
    [8, 0, 20],
    [0, 4.99, 5],
    [0, 5, 10],
    [0, 8, 15],
  ])(
    "scores %s Australian and %s overseas years at %s points",
    (australianYears, overseasYears, expected) => {
      expect(
        points(complete({ australianYears, overseasYears }), "employment"),
      ).toBe(expected);
    },
  );

  it("keeps evidence points and modeled checks valid the day before expiry", () => {
    const profile = complete({
      englishDate: "2023-11-18",
      assessmentDate: "2023-11-18",
      professionalYear: true,
      professionalYearDate: "2022-11-18",
    });
    expect(calculatePoints(profile, "2026-11-17").eligible).toBe(true);
    expect(points(profile, "english")).toBe(20);
    expect(points(profile, "professional-year")).toBe(5);
    expect(calculatePoints(profile, "2026-11-18").eligible).toBe(false);
    expect(points(profile, "professional-year", "2026-11-18")).toBe(0);
  });

  it("caps skills assessment validity at three years or the earlier letter expiry", () => {
    const capped = complete({
      assessmentDate: "2023-11-17",
      assessmentExpiry: "2030-01-01",
    });
    expect(calculatePoints(capped, "2026-11-17").eligible).toBe(false);
    const earlier = complete({
      assessmentDate: "2026-01-01",
      assessmentExpiry: "2026-11-16",
    });
    expect(calculatePoints(earlier, "2026-11-17").eligible).toBe(false);
  });

  it("restricts Professional Year to supported occupations and a four-year window", () => {
    expect(
      points(
        complete({
          professionalYear: true,
          professionalYearDate: "2025-01-01",
        }),
        "professional-year",
      ),
    ).toBe(5);
    expect(
      points(
        complete({
          professionalYear: true,
          occupation: "254499",
          professionalYearDate: "2025-01-01",
        }),
        "professional-year",
      ),
    ).toBe(0);
    expect(
      points(
        complete({
          professionalYear: true,
          professionalYearDate: "2022-11-17",
        }),
        "professional-year",
      ),
    ).toBe(0);
    expect(
      points(
        complete({
          professionalYear: true,
          occupation: "233211",
          professionalYearDate: "",
        }),
        "professional-year",
      ),
    ).toBe(5);
    expect(
      points(
        complete({
          professionalYear: true,
          occupation: "221111",
          professionalYearDate: "",
        }),
        "professional-year",
      ),
    ).toBe(5);
  });

  it("preserves confirmed Professional Year claims for Other with an explicit verification warning", () => {
    const profile = complete({
      occupation: "other",
      professionalYear: true,
      professionalYearDate: "2025-01-01",
    });
    const result = calculatePoints(profile, "2026-11-17");
    expect(points(profile, "professional-year")).toBe(5);
    expect(result.warnings.join(" ")).toMatch(
      /professional year.*self.reported.*occupation.*program.*not verified/i,
    );
    expect(
      buildTimeline(profile, "2026-11-17").find((event) =>
        event.title.includes("Professional Year"),
      ),
    ).toMatchObject({ date: "2029-01-01", delta: -5 });
    expect(
      points(
        { ...profile, professionalYearDate: "2022-11-17" },
        "professional-year",
      ),
    ).toBe(0);
    expect(
      points({ ...profile, occupation: "254499" }, "professional-year"),
    ).toBe(0);
  });

  it("warns about entered onshore visa and EOI expiry on or before the calculation date", () => {
    const result = calculatePoints(
      complete({
        onshore: true,
        visaExpiry: "2026-11-17",
        eoiDate: "2024-11-17",
      }),
      "2026-11-17",
    );
    expect(result.warnings.join(" ")).toMatch(
      /entered visa expiry date.*on or before/i,
    );
    expect(result.warnings.join(" ")).toMatch(/EOI.*two.year.*ended/i);
    expect(result.warnings.join(" ")).not.toMatch(/unlawful/i);
    const offshore = calculatePoints(
      complete({
        onshore: false,
        visaExpiry: "2020-01-01",
        eoiDate: "2024-01-01",
      }),
      "2026-11-17",
    );
    expect(offshore.warnings.join(" ")).not.toMatch(
      /entered visa expiry date/i,
    );
    expect(offshore.warnings.join(" ")).toMatch(/EOI.*two.year.*ended/i);
    const future = calculatePoints(
      complete({
        onshore: true,
        visaExpiry: "2026-11-18",
        eoiDate: "2024-11-18",
      }),
      "2026-11-17",
    );
    expect(future.warnings.join(" ")).not.toMatch(
      /entered visa expiry date|EOI.*ended/i,
    );
  });

  it("removes community language points after supplied expiry", () => {
    expect(
      points(
        complete({
          communityLanguage: true,
          communityLanguageExpiry: "2026-11-17",
        }),
        "community-language",
      ),
    ).toBe(0);
    expect(
      points(
        complete({
          communityLanguage: true,
          communityLanguageExpiry: "2027-01-01",
        }),
        "community-language",
      ),
    ).toBe(5);
  });

  it("rejects rolled-over dates and future evidence dates", () => {
    expect(
      calculatePoints(complete({ dob: "1994-02-31" }), "2026-11-17").missing,
    ).toContain("Date of birth");
    expect(points(complete({ englishDate: "2027-01-01" }), "english")).toBe(0);
    expect(calculatePoints(complete(), "2026-02-31").eligible).toBeNull();
  });
});

describe("dated change timeline", () => {
  it("shows the 18th birthday when age points begin", () => {
    const profile = complete({ dob: "2009-11-18" });
    const timeline = buildTimeline(profile, "2026-11-17");
    expect(
      timeline.find((event) => event.title.includes("18th birthday")),
    ).toMatchObject({ date: "2027-11-18", kind: "gain", delta: 25 });
    expect(points(profile, "age", "2027-11-17")).toBe(0);
    expect(points(profile, "age", "2027-11-18")).toBe(25);
  });

  it("includes the EOI two-year expiry and assessment cap", () => {
    const timeline = buildTimeline(
      complete({
        eoiDate: "2025-02-02",
        assessmentDate: "2025-01-01",
        assessmentExpiry: "2032-01-01",
      }),
      "2026-11-17",
    );
    expect(timeline.find((event) => event.title.includes("EOI"))?.date).toBe(
      "2027-02-02",
    );
    expect(
      timeline.find((event) => event.title.includes("assessment"))?.date,
    ).toBe("2028-01-01");
  });

  it("orders events and limits them to the next three calendar years", () => {
    const timeline = buildTimeline(
      complete({
        visaExpiry: "2030-01-01",
        communityLanguage: true,
        communityLanguageExpiry: "2027-03-01",
        eoiDate: "2025-02-02",
      }),
      "2026-11-17",
    );
    expect(timeline.map((event) => event.date)).toEqual(
      timeline.map((event) => event.date).sort(),
    );
    expect(
      timeline.every(
        (event) => event.date > "2026-11-17" && event.date <= "2029-11-17",
      ),
    ).toBe(true);
    expect(timeline.some((event) => event.title.includes("Visa"))).toBe(false);
  });

  it("clamps leap-day anniversaries and includes the exact horizon", () => {
    const timeline = buildTimeline(
      complete({
        dob: "2000-02-29",
        englishDate: "2024-02-29",
        assessmentDate: "",
        eoiDate: "",
      }),
      "2024-02-29",
    );
    expect(timeline.find((event) => event.title.includes("25"))?.date).toBe(
      "2025-02-28",
    );
    expect(
      timeline.find((event) => event.title.includes("English"))?.date,
    ).toBe("2027-02-28");
    expect(buildTimeline(complete(), "2026-02-30")).toEqual([]);
  });

  it("describes birthday changes with correct deltas and omits invented employment milestones", () => {
    const timeline = buildTimeline(
      complete({ dob: "1993-11-18" }),
      "2026-11-17",
    );
    expect(timeline.find((event) => event.title.includes("33"))).toMatchObject({
      date: "2026-11-18",
      kind: "loss",
      delta: -5,
    });
    expect(timeline.some((event) => /employment/i.test(event.title))).toBe(
      false,
    );
  });
});

describe("date display helpers", () => {
  it("formats valid dates safely and refuses invalid dates", () => {
    expect(formatDate("2026-11-17")).toBe("17 Nov 2026");
    // Three-letter months like formatMonth, whatever the ICU version prints for en-GB.
    expect(formatDate("2024-09-05")).toBe("5 Sep 2024");
    expect(formatDate("2026-06-04")).toBe("4 Jun 2026");
    expect(formatDate("2025-01-01")).toBe("1 Jan 2025");
    expect(formatDate("2026-02-31")).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(localToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
