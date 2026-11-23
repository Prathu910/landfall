import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { statePrograms } from "../../data/states";
import type { StateRuleData } from "../report/state-outlook-view";
import type {
  Cohort,
  ProgramStatus,
  Stream,
  Verification,
} from "../state-outlook/rules-types";
import { buildStateCards } from "./state-cards";

const SOURCE = "https://example.gov.au/";

function stream(
  status: ProgramStatus,
  cohorts: Cohort[],
  verification: Verification = "verified",
): Stream {
  const sourced = <T>(value: T) => ({
    value,
    source: SOURCE,
    checkedAt: "2026-11-17",
    verification,
  });
  return {
    id: `s-${status}-${cohorts.join("-")}`,
    name: "Stream",
    cohorts: sourced(cohorts),
    status: sourced(status),
    occupations: sourced({ kind: "list" as const, listId: "sa" }),
    requirements: [],
  };
}

function data(streams190: Stream[], streams491: Stream[]): StateRuleData {
  const selectionSystem = {
    value: "Ranked",
    source: SOURCE,
    checkedAt: "2026-11-17",
    verification: "verified" as const,
  };
  return {
    rules: {
      programYear: "2026-27",
      rules: [
        { state: "SA", visa: "190", selectionSystem, streams: streams190 },
        { state: "SA", visa: "491", selectionSystem, streams: streams491 },
      ],
    },
    lists: {
      sa: {
        listId: "sa",
        source: SOURCE,
        checkedAt: "2026-11-18",
        entries: {},
      },
    },
    federal: null,
  };
}

const SA = statePrograms.filter((p) => p.code === "SA");

describe("buildStateCards", () => {
  it("lists the eight jurisdictions in the occupation pages' order", () => {
    const cards = buildStateCards(statePrograms, stateRuleData);
    expect(cards.map((c) => c.code)).toEqual([
      "NSW",
      "VIC",
      "QLD",
      "WA",
      "SA",
      "ACT",
      "TAS",
      "NT",
    ]);
    expect(cards[0].anchor).toBe("nsw");
  });

  it("splits a visa into who it is open to and who it is restricted to", () => {
    const [card] = buildStateCards(
      SA,
      data(
        [
          stream("open", ["offshore"]),
          stream("restricted", ["living-in-state"]),
        ],
        [stream("closed", ["offshore"])],
      ),
    );
    expect(card.visas).toEqual([
      {
        visa: "190",
        lines: [
          { status: "open", label: "Open", who: "Offshore" },
          {
            status: "restricted",
            label: "Open with restrictions",
            who: "Living in SA only",
          },
        ],
      },
      {
        visa: "491",
        lines: [{ status: "closed", label: "Closed in 2026–27", who: null }],
      },
    ]);
  });

  it("says rules are being checked when no stream is verified", () => {
    const [card] = buildStateCards(
      SA,
      data(
        [stream("open", ["offshore"], "secondary")],
        [stream("closed", ["offshore"], "secondary")],
      ),
    );
    for (const visa of card.visas) {
      expect(visa.lines).toEqual([
        { status: "checking", label: "Rules being checked", who: null },
      ]);
    }
  });

  it("never calls a visa closed while an unverified stream could be open", () => {
    const [card] = buildStateCards(
      SA,
      data(
        [
          stream("closed", ["offshore"]),
          stream("open", ["offshore"], "secondary"),
        ],
        [],
      ),
    );
    expect(card.visas[0].lines[0].status).toBe("checking");
    expect(card.visas[1].lines[0].status).toBe("checking");
  });

  it("names the imported occupation list, or says the rules are being checked", () => {
    const cards = buildStateCards(statePrograms, stateRuleData);
    const list = (code: string) =>
      cards.find((c) => c.code === code)!.occupationList;
    for (const code of ["NSW", "QLD", "SA", "WA"]) {
      expect(list(code)).toEqual({
        checked: true,
        text: "2026–27 list imported, checked 18 Nov 2026",
      });
    }
    for (const code of ["VIC", "ACT", "TAS", "NT"]) {
      expect(list(code)).toEqual({
        checked: false,
        text: "Rules being checked",
      });
    }
  });

  it("reads the real 2026–27 rules for NSW and VIC", () => {
    const cards = buildStateCards(statePrograms, stateRuleData);
    const nsw = cards.find((c) => c.code === "NSW")!;
    expect(nsw.visas[0].lines).toEqual([
      {
        status: "open",
        label: "Open",
        who: "Living in NSW, elsewhere in Australia or offshore",
      },
    ]);
    expect(nsw.visas[1].lines[0].label).toBe("Closed in 2026–27");
    const vic = cards.find((c) => c.code === "VIC")!;
    expect(vic.visas.map((v) => v.lines[0].label)).toEqual([
      "Rules being checked",
      "Rules being checked",
    ]);
    expect(vic.system).toBe("Victorian Points Test");
    expect(vic.url).toMatch(/^https:\/\//);
    expect(vic.checked).toBe("Summary checked 17 Nov 2026");
    expect(cards.find((c) => c.code === "WA")!.checked).toBe(
      "Program structure reviewed · current criteria not fully audited",
    );
  });
});
