import { describe, expect, it } from "vitest";
import { loadOccupationCore } from "../data/load-server";
import { emptyProfile } from "../migration";
import type { Profile } from "../migration";
import { buildLosses } from "./losses";
import type { LossStart } from "./losses";

const AS_OF = "2026-11-21";
const NURSE = loadOccupationCore("254499");
const START: LossStart = { points: 80, eligible: true, label: "very-strong" };

function profile(fields: Partial<Profile>): Profile {
  return { ...emptyProfile, occupation: "254499", ...fields };
}

describe("buildLosses", () => {
  it("makes a 45th birthday within 2 years an eligibility loss", () => {
    const losses = buildLosses(
      profile({ dob: "1982-05-01" }),
      AS_OF,
      NURSE,
      START,
    );
    expect(losses).toEqual([
      {
        date: "2027-05-01",
        kind: "eligibility",
        title: "Your 45th birthday, 1 May 2027",
        detail: "You have to be under 45 when you're invited.",
        from: { points: 80, label: "very-strong" },
        to: { points: 65, label: "not-eligible" },
      },
    ]);
  });

  it("leaves out losses more than 2 years after asOf", () => {
    const losses = buildLosses(
      profile({ dob: "1982-05-01" }),
      "2024-11-21",
      NURSE,
      START,
    );
    expect(losses).toEqual([]);
  });

  it("skips a visa expiry, which changes no points", () => {
    const losses = buildLosses(
      profile({ onshore: true, visaExpiry: "2027-09-30" }),
      AS_OF,
      NURSE,
      START,
    );
    expect(losses).toEqual([]);
  });
});
