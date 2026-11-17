import { describe, expect, it } from "vitest";
import { profileDetailFixture } from "./__fixtures__/occupation";
import { similarProfileInvited } from "./similar-profile";

describe("similarProfileInvited", () => {
  it("returns per-month national figures with the latest month", () => {
    const r = similarProfileInvited(
      profileDetailFixture,
      "189",
      "english",
      "superior",
      { kind: "national", months: 2 },
    );
    expect(r?.perMonth).toEqual([
      { asAt: "2026-09", invitedAtLeast: { min: 0, max: 19 } },
      { asAt: "2026-10", invitedAtLeast: { min: 30, max: 30 } },
    ]);
    expect(r?.latest).toEqual({ min: 30, max: 30 });
  });

  it("returns the latest state figure only", () => {
    expect(
      similarProfileInvited(
        profileDetailFixture,
        "189",
        "english",
        "superior",
        { kind: "state", visa: "190", state: "VIC" },
      ),
    ).toEqual({ latest: { min: 25, max: 25 } });
  });

  it("returns undefined when the attribute or value was not imported", () => {
    const national = { kind: "national" } as const;
    expect(
      similarProfileInvited(
        profileDetailFixture,
        "189",
        "partnerSkills",
        "x",
        national,
      ),
    ).toBeUndefined();
    expect(
      similarProfileInvited(
        profileDetailFixture,
        "189",
        "english",
        "nope",
        national,
      ),
    ).toBeUndefined();
  });
});
