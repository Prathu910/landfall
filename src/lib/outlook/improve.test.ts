import { describe, expect, it } from "vitest";
import { stateRules } from "../../data/state-rules/2026-27/index";
import { loadOccupationCore } from "../data/load-server";
import type { Profile } from "../migration";
import {
  realFederal,
  realLists,
} from "../state-outlook/__fixtures__/real-data";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput } from "./evaluate-profile";
import { buildImprove } from "./improve";
import type { Improve, Move } from "./improve";

const AS_OF = "2026-11-21";
const RULES = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};
const BANNED =
  /guarantee|definitely|will be invited|%|chances? of|likely to be invited|some invitations|a few/i;

function inputFor(profile: Profile, withCore = true): OutlookInput {
  return {
    profile,
    asOf: AS_OF,
    core: withCore ? loadOccupationCore(profile.occupation) : null,
    detail: null,
    rules: RULES,
  };
}

function run(id: ScenarioId, withCore = true): Improve {
  const input = inputFor(SCENARIOS[id], withCore);
  return buildImprove(input, evaluateProfile(input));
}

function move(improve: Improve, id: Move["id"]): Move {
  const found = improve.moves.find((m) => m.id === id);
  if (!found) throw new Error(`no ${id} move`);
  return found;
}

function bestIds(improve: Improve): Move["id"][] {
  return improve.moves.filter((m) => m.best).map((m) => m.id);
}

describe("buildImprove, Priya (in the middle)", () => {
  const improve = run("middle");

  it("is in improve mode with no banner", () => {
    expect(improve.mode).toBe("improve");
    expect(improve.banner).toBeNull();
  });

  it("makes Superior English the single biggest jump", () => {
    expect(bestIds(improve)).toEqual(["english-superior"]);
    expect(move(improve, "english-superior")).toMatchObject({
      from: { points: 70, label: "competitive" },
      to: { points: 80, label: "very-strong" },
      visa: "189",
      date: null,
    });
  });

  it("shows NAATI and both together", () => {
    expect(move(improve, "naati").to).toEqual({ points: 75, label: "strong" });
    expect(move(improve, "combined").to).toEqual({
      points: 85,
      label: "very-strong",
    });
  });

  it("applies the dated losses cumulatively", () => {
    expect(improve.losses.slice(0, 2)).toMatchObject([
      {
        date: "2027-03-14",
        kind: "points",
        from: { points: 70, label: "competitive" },
        to: { points: 65, label: "long-wait" },
      },
      {
        date: "2028-02-02",
        kind: "eligibility",
        from: { points: 65, label: "long-wait" },
        to: { label: "not-eligible" },
      },
    ]);
  });

  it("keeps her later skills assessment expiry as not eligible", () => {
    expect(improve.losses[2]).toMatchObject({
      date: "2028-06-10",
      kind: "eligibility",
      from: { label: "not-eligible" },
      to: { label: "not-eligible" },
    });
  });
});

describe("buildImprove, Aarav (very strong)", () => {
  const improve = run("strong");

  it("protects his points with no moves", () => {
    expect(improve.mode).toBe("protect");
    expect(improve.moves).toEqual([]);
    expect(improve.banner).toBe(
      "You're already at the top. The only risk is waiting too long.",
    );
  });

  it("lists his birthday then his English expiry", () => {
    expect(improve.losses).toMatchObject([
      {
        date: "2027-08-09",
        kind: "points",
        from: { points: 90, label: "very-strong" },
        to: { points: 85, label: "very-strong" },
      },
      {
        date: "2028-02-02",
        kind: "eligibility",
        from: { points: 85, label: "very-strong" },
        to: { points: 65, label: "not-eligible" },
      },
    ]);
  });
});

describe("buildImprove, Arjun (below 65)", () => {
  const improve = run("below");

  it("makes Superior English the biggest jump from not eligible", () => {
    expect(bestIds(improve)).toEqual(["english-superior"]);
    expect(move(improve, "english-superior")).toMatchObject({
      from: { points: 60, label: "not-eligible" },
      to: { points: 80, label: "very-strong" },
    });
  });

  it("shows Proficient English and NAATI", () => {
    expect(move(improve, "english-proficient").to).toEqual({
      points: 70,
      label: "competitive",
    });
    expect(move(improve, "naati").to).toEqual({
      points: 65,
      label: "long-wait",
    });
  });

  it("never combines two English moves", () => {
    const combined = move(improve, "combined");
    expect(combined.detail).not.toMatch(/Proficient English/);
  });

  it("dates his English expiry as an eligibility loss", () => {
    expect(improve.losses).toMatchObject([
      {
        date: "2027-09-09",
        kind: "eligibility",
        to: { label: "not-eligible" },
      },
    ]);
  });
});

describe("buildImprove, Meera (long wait)", () => {
  const improve = run("long");

  it("shows NAATI and the next overseas band", () => {
    expect(move(improve, "naati")).toMatchObject({
      from: { points: 80, label: "long-wait" },
      to: { points: 85, label: "competitive" },
    });
    expect(move(improve, "experience")).toMatchObject({
      from: { points: 80, label: "long-wait" },
      to: { points: 85, label: "competitive" },
      date: null,
    });
  });

  it("makes both together the biggest jump", () => {
    expect(bestIds(improve)).toEqual(["combined"]);
    expect(move(improve, "combined").to).toEqual({
      points: 90,
      label: "strong",
    });
  });

  it("dates her English expiry", () => {
    expect(improve.losses).toMatchObject([
      {
        date: "2028-01-10",
        kind: "eligibility",
        to: { label: "not-eligible" },
      },
    ]);
  });
});

describe("buildImprove, Rahul (189 closed)", () => {
  const improve = run("notinv");

  it("says points aren't the problem", () => {
    expect(improve.mode).toBe("points-not-problem");
    expect(improve.banner).toBe(
      "Points aren't what's holding you back. 189 needs to start listing your occupation again.",
    );
  });

  it("shows the Professional Year leaving 189 not invited", () => {
    expect(move(improve, "professional-year")).toMatchObject({
      from: { points: 85, label: "not-invited" },
      to: { points: 90, label: "not-invited" },
      visa: "189",
    });
    expect(move(improve, "professional-year").why).toMatch(
      /Not currently invited/,
    );
  });

  it("marks no move as the biggest jump", () => {
    expect(bestIds(improve)).toEqual([]);
  });

  it("dates his English expiry", () => {
    expect(improve.losses).toMatchObject([
      {
        date: "2027-06-05",
        kind: "eligibility",
        to: { label: "not-eligible" },
      },
    ]);
  });
});

describe("buildImprove, Dev (nothing suits)", () => {
  it("says no visa is inviting the occupation", () => {
    const improve = run("none");
    expect(improve.mode).toBe("points-not-problem");
    expect(improve.banner).toBe(
      "Points won't change this. No visa is inviting your occupation right now.",
    );
  });
});

describe("buildImprove, Kavya (lodged)", () => {
  const improve = run("lodged");

  it("makes Superior English the biggest jump", () => {
    expect(bestIds(improve)).toEqual(["english-superior"]);
    expect(move(improve, "english-superior")).toMatchObject({
      from: { points: 70, label: "competitive" },
      to: { points: 80, label: "very-strong" },
    });
  });

  it("shows partner skills", () => {
    expect(move(improve, "partner-skills").to).toEqual({
      points: 75,
      label: "strong",
    });
  });

  it("dates her EOI expiry", () => {
    expect(improve.losses).toMatchObject([
      {
        date: "2028-03-12",
        kind: "eoi-expiry",
        from: { points: 70, label: "competitive" },
        to: { points: 70, label: "competitive" },
      },
    ]);
  });
});

describe("buildImprove, Sana (no data)", () => {
  const improve = run("nodata", false);

  it("lists available points plainly, without labels", () => {
    expect(improve.mode).toBe("plain");
    expect(improve.moves).toEqual([]);
    expect(improve.plain).toContain("Superior English, +10. Takes you to 85.");
    expect(improve.plain).toContain("NAATI CCL test, +5. Takes you to 80.");
  });
});

describe("buildImprove copy", () => {
  it.each(Object.keys(SCENARIOS) as ScenarioId[])(
    "%s avoids banned words",
    (id) => {
      const improve = run(id);
      const text = [
        improve.banner ?? "",
        ...improve.plain,
        ...improve.moves.flatMap((m) => [m.title, m.detail, m.why]),
        ...improve.losses.flatMap((l) => [l.title, l.detail]),
      ].join(" ");
      expect(text).not.toMatch(BANNED);
    },
  );

  it("only adds losses within 2 years of asOf", () => {
    for (const id of Object.keys(SCENARIOS) as ScenarioId[]) {
      for (const loss of run(id).losses) {
        expect(loss.date <= "2028-11-21").toBe(true);
      }
    }
  });
});
