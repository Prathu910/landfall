import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { frozenCore } from "../data/__fixtures__/frozen-2026-10";
import { BANNED_COPY } from "../report/copy";
import {
  neverListedCore,
  occasionalCore,
} from "../report/__fixtures__/scorecard";
import { dated189Sentence, invitedStates, statesSentence } from "./answer";
import { stateRows } from "./states";

const nurse = frozenCore("254499")!;
const software = frozenCore("261313")!;
const rows = stateRows("254499", nurse, stateRuleData);

describe("dated189Sentence", () => {
  it("dates the latest listed round by its own date, with the code", () => {
    expect(dated189Sentence(nurse)).toBe(
      "The latest 189 round to list Registered Nurses nec (ANZSCO 254499), on 15 Oct 2026, had a cut-off of 70 points; each of its last four rounds listed it, at 70–80 points.",
    );
  });
  it("says when it was last listed, if not in the last four rounds", () => {
    expect(dated189Sentence(software)).toBe(
      "189 hasn't listed Software Engineer (ANZSCO 261313) in its last four rounds, up to 15 Oct 2026; it was last listed on 7 Nov 2024, at 95 points.",
    );
  });
  it("counts the listed rounds when the occupation is only occasionally listed", () => {
    expect(dated189Sentence(occasionalCore)).toMatch(
      /; 189 listed it in 2 of its last four rounds, at /,
    );
    expect(dated189Sentence(neverListedCore)).toMatch(
      /hasn't listed .+ in any round we can read, up to \d{1,2} \w{3} \d{4}\.$/,
    );
  });
  it("never puts the snapshot's as-at date in front of a newer round (R9)", () => {
    // The round job adds a round before that month's pool data arrives.
    const withNewRound = {
      ...nurse,
      rounds189: [{ date: "2026-11-12", cutoff: 75 }, ...nurse.rounds189],
    };
    const text = dated189Sentence(withNewRound);
    expect(text).toMatch(
      /^The latest 189 round to list Registered Nurses nec \(ANZSCO 254499\), on 12 Nov 2026, had a cut-off of 75 points; /,
    );
    expect(text).not.toMatch(/As at/);
    const skipped = {
      ...software,
      rounds189: [{ date: "2026-11-12", cutoff: null }, ...software.rounds189],
    };
    expect(dated189Sentence(skipped)).toMatch(/, up to 12 Nov 2026; /);
    expect(dated189Sentence(skipped)).not.toMatch(/As at/);
  });
});

describe("statesSentence", () => {
  it("names the listing states and those with EOIs certainly in invited status", () => {
    const text = statesSentence(nurse, rows);
    expect(text).toMatch(
      /^For 2026–27, QLD, WA and SA list it for 190 and 491; NSW lists it for 190; as at Oct 2026, SkillSelect showed EOIs in invited status for the 190 from /,
    );
    expect(text).not.toMatch(BANNED_COPY);
  });
  it("never names a state whose published count is only '<20'", () => {
    const at = (counts: Record<string, string>) => ({ [nurse.asAt]: counts });
    const masked = {
      ...nurse,
      stateInvited: {
        "190": { VIC: at({ "80": "<20" }), NSW: at({ "80": "26" }) },
        "491": { SA: at({ "85": "<20", "90": "<20" }) },
      },
    };
    expect(invitedStates(masked, "190")).toEqual(["NSW"]);
    expect(invitedStates(masked, "491")).toEqual([]);
    expect(statesSentence(masked, rows)).toMatch(
      /EOIs in invited status for the 190 from NSW\.$/,
    );
  });
  it("is null when nothing is listed or certain", () => {
    const pending = rows.map((r) => ({ ...r, onList: "Rules being checked" }));
    expect(statesSentence({ ...nurse, stateInvited: {} }, pending)).toBeNull();
  });
});
