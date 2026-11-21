import { describe, expect, it } from "vitest";
import { calculatePoints, emptyProfile } from "../migration";
import type { Profile } from "../migration";
import { AS_OF } from "./__fixtures__/scenario-input";
import { SCENARIOS } from "./__fixtures__/scenarios";
import { buildPointsPage } from "./points-page";

function pageOf(profile: Profile, occupation = "Registered Nurses nec") {
  const points = calculatePoints(profile, AS_OF);
  return buildPointsPage({
    profile,
    points,
    occupation,
    asOf: AS_OF,
    month: "2026-10",
  });
}

describe("buildPointsPage fields", () => {
  it("lists the whole profile the reader gave", () => {
    const page = pageOf(SCENARIOS.middle);
    expect(page.fields).toEqual([
      { label: "Name", value: "Priya" },
      { label: "Occupation", value: "Registered Nurses nec (254499)" },
      { label: "Date of birth", value: "14 Mar 1994, age 32" },
      { label: "Where you are", value: "Offshore" },
      { label: "Skills assessment", value: "Valid to 10 Jun 2028" },
      { label: "English test", value: "Proficient, valid to 2 Feb 2028" },
    ]);
  });

  it("adds the EOI date only once the reader has lodged", () => {
    const fields = pageOf(SCENARIOS.lodged).fields;
    expect(fields.at(-1)).toEqual({
      label: "EOI submitted",
      value: "12 Mar 2026",
    });
  });

  it("says Not given for answers left empty", () => {
    const page = pageOf(
      { ...emptyProfile, occupation: "" },
      "No occupation chosen",
    );
    const value = (label: string) =>
      page.fields.find((f) => f.label === label)?.value;
    expect(value("Name")).toBe("Not given");
    expect(value("Date of birth")).toBe("Not given");
    expect(value("English test")).toBe("Not given");
  });
});

describe("buildPointsPage expiry", () => {
  const value = (profile: Profile, label: string) =>
    pageOf(profile).fields.find((f) => f.label === label)?.value;

  it("says expired for a skills assessment past its 3-year cap", () => {
    const profile = {
      ...SCENARIOS.middle,
      assessmentDate: "2023-05-01",
      assessmentExpiry: "",
    };
    expect(value(profile, "Skills assessment")).toBe("Expired 1 May 2026");
  });

  it("uses the earlier of the letter expiry and the 3-year cap", () => {
    const profile = { ...SCENARIOS.middle, assessmentDate: "2025-01-10" };
    expect(value(profile, "Skills assessment")).toBe("Valid to 10 Jan 2028");
  });

  it("says expired for an English test older than 3 years", () => {
    const profile = { ...SCENARIOS.middle, englishDate: "2023-02-02" };
    expect(value(profile, "English test")).toBe(
      "Proficient, expired 2 Feb 2026",
    );
  });
});

describe("buildPointsPage rows", () => {
  it("shows each scoring category with its detail, then every zero category", () => {
    const page = pageOf(SCENARIOS.middle);
    expect(page.rows).toEqual([
      { label: "Age", detail: "32", points: 30 },
      { label: "English proficiency", detail: "Proficient", points: 10 },
      { label: "Skilled employment", detail: "4 years overseas", points: 5 },
      {
        label: "Highest qualification",
        detail: "Bachelor or master's degree",
        points: 15,
      },
      { label: "Partner qualifications", detail: "Single", points: 10 },
    ]);
    expect(page.zero).toBe(
      "Australian study, Regional Australian study, Specialist education, Professional Year, Credentialled community language",
    );
  });

  it("totals 189, 190 (+5) and 491 (+15)", () => {
    expect(pageOf(SCENARIOS.middle).totals).toEqual([
      { points: 70, label: "189 Independent" },
      { points: 75, label: "190 with nomination (+5)" },
      { points: 85, label: "491 with nomination (+15)" },
    ]);
  });
});

describe("buildPointsPage passport line", () => {
  it("is two 44-character lines built from the name, code and totals", () => {
    const [first, second] = pageOf(SCENARIOS.middle).mrz;
    expect(first).toBe("P<MLNPRIYA<<REPORT<<<<<<<<<<<<<<<<<<<<<<<<<<");
    expect(second).toBe("254499<189<70<190<75<491<85<<OCT2026<<<<<<<<");
    expect(first).toHaveLength(44);
    expect(second).toHaveLength(44);
  });
});
