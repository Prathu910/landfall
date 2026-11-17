import { describe, expect, it } from "vitest";
import { profileDetailFixture } from "./__fixtures__/occupation";
import { similarProfileInvited } from "./similar-profile";

describe("similarProfileInvited", () => {
  const national = (months?: number) => ({ kind: "national", months }) as const;

  it("returns per-month national figures, zero where a covered month has no row", () => {
    const r = similarProfileInvited(
      profileDetailFixture,
      "189",
      "english",
      "20",
      national(3),
    );
    expect(r?.perMonth).toEqual([
      { asAt: "2026-08", invitedAtLeast: { min: 12, max: 12 } },
      { asAt: "2026-09", invitedAtLeast: { min: 0, max: 19 } },
      { asAt: "2026-10", invitedAtLeast: { min: 0, max: 0 } },
    ]);
    expect(r?.notPublished).toEqual([]);
  });

  it("takes latest from the as-at month only", () => {
    const english = similarProfileInvited(
      profileDetailFixture,
      "189",
      "english",
      "20",
      national(),
    );
    expect(english?.latest).toEqual({ min: 0, max: 0 });
    // professionalYear was not fetched for 2026-10: no latest figure.
    const year = similarProfileInvited(
      profileDetailFixture,
      "189",
      "professionalYear",
      "N",
      national(),
    );
    expect(year?.latest).toBeUndefined();
    expect(year?.perMonth?.at(-1)).toEqual({
      asAt: "2026-09",
      invitedAtLeast: { min: 35, max: 35 },
    });
  });

  it("reports uncovered months as not published", () => {
    const r = similarProfileInvited(
      profileDetailFixture,
      "189",
      "english",
      "10",
      national(4),
    );
    expect(r?.notPublished).toEqual(["2026-07"]);
    expect(r?.perMonth?.map((m) => m.asAt)).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });

  it("returns the latest state figure only, zero for an absent value", () => {
    const vic = { kind: "state", visa: "190", state: "VIC" } as const;
    expect(
      similarProfileInvited(profileDetailFixture, "189", "english", "20", vic),
    ).toEqual({ latest: { min: 25, max: 25 } });
    expect(
      similarProfileInvited(profileDetailFixture, "189", "english", "10", vic),
    ).toEqual({ latest: { min: 0, max: 0 } });
  });

  it("returns undefined when the attribute or state was not imported", () => {
    expect(
      similarProfileInvited(
        profileDetailFixture,
        "189",
        "partnerSkills",
        "5",
        national(),
      ),
    ).toBeUndefined();
    expect(
      similarProfileInvited(profileDetailFixture, "189", "english", "20", {
        kind: "state",
        visa: "190",
        state: "NSW",
      }),
    ).toBeUndefined();
  });
});
