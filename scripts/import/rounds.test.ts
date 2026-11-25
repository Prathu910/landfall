// Fixtures captured 2026-11-17 from the live SkillSelect pages, trimmed to the
// PageSchemaHiddenField input the parser reads.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RoundsFile } from "../../src/lib/data/rounds-file";
import { USER_AGENT } from "../state-lists/shared";
import {
  CURRENT_ROUNDS_URL,
  PREVIOUS_ROUNDS_URL,
  ROUND_PAGE_GAP_MS,
  fetchRoundPages,
  newestRoundDate,
  newRoundDates,
  normalizeOccupationName,
  parseCurrentRound,
  parseRoundBlock,
  parseRoundPages,
  parseRoundPagesDetailed,
} from "./rounds";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
const current = fixture("invitation-rounds.html");
const previous = fixture("previous-rounds.html");

describe("parseRoundPages", () => {
  const rounds = parseRoundPages(current, previous);
  const dates = rounds.map((r) => r.date);

  it("includes current and previous rounds, newest first", () => {
    for (const d of [
      "2026-10-15",
      "2026-06-04",
      "2025-11-13",
      "2025-08-21",
      "2024-11-07",
      "2024-09-05",
      "2023-12-18",
    ]) {
      expect(dates).toContain(d);
    }
    expect(dates).toEqual([...dates].sort().reverse());
    expect(rounds.length).toBeGreaterThan(5);
  });

  it("keeps every occupation row", () => {
    const round = rounds.find((r) => r.date === "2024-11-07");
    const row = round?.rows.find(
      (r) => normalizeOccupationName(r.occupationName) === "ictbusinessanalyst",
    );
    expect(row?.cutoff).toBe(95);
  });

  it("throws on a non-integer cut-off", () => {
    const bad = current.replace(/(Actuary.*?\\u003cp\\u003e)85/s, "$195+");
    expect(bad).not.toBe(current);
    expect(() => parseRoundPages(bad, previous)).toThrow();
  });
});

describe("parseRoundPagesDetailed", () => {
  const { rounds, skipped } = parseRoundPagesDetailed(current, previous);

  it("parses the blank-first-header 2022-23 layouts", () => {
    for (const date of ["2023-05-25", "2022-12-08", "2022-08-22"]) {
      const round = rounds.find((r) => r.date === date);
      expect(round?.rows.length).toBeGreaterThan(0);
      for (const row of round?.rows ?? []) {
        expect(Number.isInteger(row.cutoff)).toBe(true);
      }
    }
    const audiologist = rounds
      .find((r) => r.date === "2023-05-25")
      ?.rows.find((r) => r.occupationName === "Audiologist");
    expect(audiologist?.cutoff).toBe(65);
  });

  it("reports unparseable rounds instead of dropping them", () => {
    expect(skipped.length).toBeGreaterThan(0);
    for (const s of skipped) expect(s.reason.length).toBeGreaterThan(0);
    const parsed = new Set(rounds.map((r) => r.date));
    for (const s of skipped) expect(parsed.has(s.date)).toBe(false);
    expect(rounds.length + skipped.length).toBe(21);
  });

  it("skips the unit-group layout (Subclass | Occupation ID) with a reason", () => {
    const unitGroupRounds = [
      "2021-10-29",
      "2021-07-26",
      "2021-04-21",
      "2021-01-21",
      "2020-10-21",
      "2020-09-11",
      "2020-08-11",
    ];
    for (const date of unitGroupRounds) {
      expect(skipped.find((s) => s.date === date)?.reason).toMatch(
        /Occupation ID/,
      );
    }
    expect(skipped.map((s) => s.date).sort()).toEqual(
      [...unitGroupRounds, "2022-10-06"].sort(),
    );
  });

  it("never reads a 4-digit unit group or a 491 cell as a 189 cut-off", () => {
    for (const round of rounds) {
      for (const row of round.rows) {
        expect(row.occupationName).not.toMatch(/^\d+$/);
      }
    }
  });
});

describe("parseRoundBlock", () => {
  const table = (...rows: string[]) =>
    `<table>${rows.map((row) => `<tr>${row}</tr>`).join("")}</table>`;
  const visa189Only = table(
    "<th>Visa subclass</th><th>Total EOIs Invited</th>",
    "<td>Skilled Independent visa (subclass 189)</td><td>100</td>",
  );

  it("requires an explicit 189 column", () => {
    const block = table(
      "<th>Occupation</th><th>Subclass 189/491</th>",
      "<td>Actuary</td><td>85</td>",
    );
    expect(() => parseRoundBlock("2026-01-01", block)).toThrow(/189 column/);
  });

  it("reads Minimum points score only when the round lists 189 alone", () => {
    const occupations = table(
      "<th>Occupation*</th><th>Minimum points score</th>",
      "<td>Actuary</td><td>85</td>",
    );
    expect(parseRoundBlock("2026-01-01", visa189Only + occupations)).toEqual({
      round: {
        date: "2026-01-01",
        totals: [
          {
            subclass: "189",
            label: "Skilled Independent visa (subclass 189)",
            invited: 100,
          },
        ],
        tieBreak: null,
        rows: [{ occupationName: "Actuary", cutoff: 85, tieBreak: null }],
        nominations: null,
      },
      misprints: [],
    });
    expect(() => parseRoundBlock("2026-01-01", occupations)).toThrow(
      /189 column/,
    );
  });

  it("maps two-row group headers by colspan", () => {
    const block = table(
      '<th></th><th>189</th><th colspan="3">491</th>',
      "<th>Occupation</th><th>All</th><th>Offshore</th><th>Onshore</th><th>Other</th>",
      "<td>Actuary</td><td>90</td><td>65</td><td>60</td><td>70</td>",
    );
    expect(parseRoundBlock("2026-01-01", block)).toEqual({
      round: {
        date: "2026-01-01",
        totals: null,
        tieBreak: null,
        rows: [{ occupationName: "Actuary", cutoff: 90, tieBreak: null }],
        nominations: null,
      },
      misprints: [],
    });
  });

  it("throws when the group header spans a different number of columns", () => {
    const block = table(
      '<th></th><th colspan="2">189</th><th colspan="3">491</th>',
      "<th>Occupation</th><th>Offshore</th><th>Onshore</th><th>Offshore</th><th>Onshore</th>",
      "<td>Actuary</td><td>90</td><td>95</td><td>65</td><td>60</td>",
    );
    expect(() => parseRoundBlock("2026-01-01", block)).toThrow(/spans 6/);
  });
});

describe("round totals, tie-break dates and nominations", () => {
  const pages = parseRoundPagesDetailed(current, previous);
  const round = (date: string) => {
    const found = pages.rounds.find((r) => r.date === date);
    if (!found) throw new Error(`no round ${date}`);
    return found;
  };

  it("reads the current round's totals, row tie-breaks and nominations", () => {
    const oct = round("2026-10-15");
    expect(oct.totals).toEqual([
      {
        subclass: "189",
        label: "Skilled Independent visa (subclass 189)",
        invited: 20000,
      },
    ]);
    expect(oct.tieBreak).toBeNull();
    expect(oct.rows.find((r) => r.occupationName === "Actuary")).toEqual({
      occupationName: "Actuary",
      cutoff: 85,
      tieBreak: "2026-09-03",
    });
    // Two rows print a three-digit year ("13/10/206", "01/07/206"): stored
    // as no date, never guessed.
    const undated = oct.rows.filter((r) => r.tieBreak === null);
    expect(undated.map((r) => r.occupationName)).toEqual([
      "Environmental Manager",
      "Forester",
    ]);
    expect(pages.misprints.filter((m) => m.date === "2026-10-15")).toEqual([
      { date: "2026-10-15", where: "Environmental Manager", text: "13/10/206" },
      { date: "2026-10-15", where: "Forester", text: "01/07/206" },
    ]);
    expect(pages.misprints).toHaveLength(2);
    expect(oct.nominations).toEqual({
      programYear: "2026-27",
      from: "2026-07-01",
      to: "2026-09-30",
      byVisa: {
        "190": {
          ACT: "<5",
          NSW: "11",
          NT: "188",
          QLD: "7",
          SA: "0",
          TAS: "271",
          VIC: "0",
          WA: "17",
        },
        "491": {
          ACT: "<5",
          NSW: "0",
          NT: "208",
          QLD: "<5",
          SA: "0",
          TAS: "96",
          VIC: "0",
          WA: "120",
        },
      },
    });
  });

  it("reads a previous round's totals and round-level tie-break", () => {
    const jun = round("2026-06-04");
    expect(jun.totals?.[0].invited).toBe(10000);
    expect(jun.tieBreak).toBe("2026-04-24");
    expect(jun.rows.every((r) => r.tieBreak === null)).toBe(true);
    expect(jun.nominations).toBeNull();
    expect(pages.rounds).toHaveLength(13); // unchanged
  });

  it("keeps every subclass row and decodes the dash in its label", () => {
    expect(round("2025-11-13").totals).toEqual([
      {
        subclass: "189",
        label: "Skilled Independent visa (subclass 189)",
        invited: 10000,
      },
      {
        subclass: "491",
        label:
          "Skilled Work Regional (Provisional) visa (subclass 491) – Family Sponsored",
        invited: 300,
      },
    ]);
    // "Total EOIs invited" (lower case) on 13 June 2024.
    expect(round("2024-06-13").totals?.[0].invited).toBe(5292);
  });

  it("stores no tie-break when the page gives only a month and year", () => {
    // "11/2025", "12/2022" and "15/2024" (as published) name no day.
    for (const date of ["2025-11-13", "2024-11-07", "2024-06-13"]) {
      expect(round(date).tieBreak, date).toBeNull();
    }
  });

  it("gives null totals to rounds whose table has no Total EOIs Invited column", () => {
    const withTotals = pages.rounds.filter((r) => r.totals !== null);
    expect(withTotals.map((r) => r.date)).toEqual([
      "2026-10-15",
      "2026-06-04",
      "2025-11-13",
      "2025-08-21",
      "2024-11-07",
      "2024-09-05",
      "2024-06-13",
    ]);
    expect(round("2023-12-18").totals).toBeNull();
    expect(round("2023-12-18").tieBreak).toBeNull();
  });

  it("throws on a total that isn't a count", () => {
    const bad = current.replace(
      "\\u003e20,000\\u003c",
      "\\u003e20,000+\\u003c",
    );
    expect(bad).not.toBe(current);
    expect(() => parseRoundPagesDetailed(bad, previous)).toThrow(
      /total invited/,
    );
  });

  it("throws on a tie-break that isn't a date", () => {
    const bad = current.replace("03/09/2026", "early September");
    expect(bad).not.toBe(current);
    expect(() => parseRoundPagesDetailed(bad, previous)).toThrow(/tie-break/);
  });

  it("stops when the nominations table loses a state column", () => {
    const bad = current.replace("\\u003eWA\\u003c/th", "\\u003e\\u003c/th");
    expect(bad).not.toBe(current);
    expect(() => parseRoundPagesDetailed(bad, previous)).toThrow(
      /Official page schema changed/,
    );
  });

  it("stops when a nominations value isn't published text it knows", () => {
    const bad = current.replace("\\u003e271\\u003c", "\\u003emany\\u003c");
    expect(bad).not.toBe(current);
    expect(() => parseRoundPagesDetailed(bad, previous)).toThrow(
      /Official page schema changed/,
    );
  });
});

describe("parseCurrentRound", () => {
  it("reads only the current round", () => {
    const round = parseCurrentRound(current);
    expect(round.date).toBe("2026-10-15");
    expect(round.nominations?.programYear).toBe("2026-27");
  });
});

describe("newestRoundDate", () => {
  it("reads the current round's date from the current page alone", () => {
    expect(newestRoundDate(current)).toBe("2026-10-15");
  });

  it("stops when the page has no current round date", () => {
    const undated = current.replace(
      "Invitations issued on 15 October 2026",
      "Invitations issued soon",
    );
    expect(undated).not.toBe(current);
    expect(() => newestRoundDate(undated)).toThrow(/date missing/);
  });
});

describe("newRoundDates", () => {
  const parsedFixtures = parseRoundPagesDetailed(current, previous);
  /** A stored rounds.json holding the fixture rounds up to `date`. */
  const storedUpTo = (date: string): RoundsFile => ({
    schemaVersion: 2,
    rounds: parsedFixtures.rounds
      .filter((round) => round.date <= date)
      .map((round) => ({
        date: round.date,
        totals: round.totals,
        tieBreak: round.tieBreak,
        rows: [],
        nominations: round.nominations,
      })),
    skipped: [],
  });

  it("lists the parsed dates newer than the newest stored round", () => {
    expect(newRoundDates(storedUpTo("2026-06-04"), parsedFixtures)).toEqual([
      "2026-10-15",
    ]);
    expect(newRoundDates(storedUpTo("2026-10-15"), parsedFixtures)).toEqual([]);
  });

  it("lists several new rounds oldest first", () => {
    expect(newRoundDates(storedUpTo("2025-11-13"), parsedFixtures)).toEqual([
      "2026-06-04",
      "2026-10-15",
    ]);
  });

  it("never lists an older round missing from the stored file", () => {
    const stored = storedUpTo("2026-10-15");
    stored.rounds = stored.rounds.filter((r) => r.date !== "2026-06-04");
    expect(newRoundDates(stored, parsedFixtures)).toEqual([]);
  });
});

describe("normalizeOccupationName", () => {
  it("keeps lowercase alphanumerics only", () => {
    expect(normalizeOccupationName("ICT Business Analyst (261111)")).toBe(
      "ictbusinessanalyst261111",
    );
  });
});

describe("fetchRoundPages", () => {
  it("asks for each page once, in turn, 10 s apart, with the browser User-Agent", async () => {
    let clock = 0;
    const requests: { url: string; at: number; agent: string | null }[] = [];
    const request = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      requests.push({
        url: String(input),
        at: clock,
        agent: new Headers(init?.headers).get("User-Agent"),
      });
      clock += 300;
      return new Response(`<html>${String(input)}</html>`);
    }) as typeof fetch;
    const pages = await fetchRoundPages(request, async (ms) => {
      clock += ms;
    });
    expect(requests.map((r) => r.url)).toEqual([
      CURRENT_ROUNDS_URL,
      PREVIOUS_ROUNDS_URL,
    ]);
    expect(requests[1].at - requests[0].at).toBeGreaterThanOrEqual(
      ROUND_PAGE_GAP_MS,
    );
    expect(requests.every((r) => r.agent === USER_AGENT)).toBe(true);
    expect(pages.previousHtml).toContain("previous-rounds");
  });

  it("never retries a refusal", async () => {
    let calls = 0;
    const request = (async () => {
      calls += 1;
      return new Response("no", { status: 403 });
    }) as typeof fetch;
    await expect(fetchRoundPages(request, async () => {})).rejects.toThrow(
      /HTTP 403/,
    );
    expect(calls).toBe(1);
  });
});
