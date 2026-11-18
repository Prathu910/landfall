import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildRawFixture,
  fixtureInput,
  fixtureSkippedRounds,
  HEADERS,
  NURSE,
  SOFTWARE_ENGINEER,
  writeFixtureView,
} from "./generate-fixture";
import { generate, writeGenerated } from "./generate";
import { VISA_NAMES } from "./qlik-constants";

function generateFixture() {
  return generate({ ...fixtureInput, rawRoot: buildRawFixture() });
}

describe("generate", () => {
  it("builds one core per occupation with pool, history and 189 rounds", () => {
    const data = generateFixture();
    expect(data.cores.map((core) => core.code)).toEqual(["254499", "261313"]);

    const engineer = data.cores[1];
    expect(engineer).toMatchObject({
      schemaVersion: 2,
      snapshotId: "skillselect-2026-10-31",
      asAt: "2026-10",
      code: "261313",
      name: "Software Engineer",
      group: null,
    });
    expect(engineer.pool).toEqual({
      "189": {
        total: "150",
        byScore: { "85": "100", "90": "<20", "95": "50" },
      },
    });
    // Every fetched month has a key for every visa; {} means no rows (zero).
    expect(engineer.statusHistory).toEqual({
      "189": {
        "2026-09": { SUBMITTED: "140" },
        "2026-10": { SUBMITTED: "150", INVITED: "<20", LODGED: "119" },
      },
      "190": { "2026-09": {}, "2026-10": {} },
      "491": { "2026-09": {}, "2026-10": {} },
    });
    expect(engineer.invitedByScore).toEqual({
      "189": { "2026-09": {}, "2026-10": { "100": "<20" } },
      "190": { "2026-09": {}, "2026-10": {} },
      "491": { "2026-09": {}, "2026-10": {} },
    });
    expect(engineer.rounds189).toEqual([
      { date: "2026-10-15", cutoff: 95 },
      { date: "2026-06-04", cutoff: null },
    ]);
  });

  it("keeps state pools and multi-month state invitations, ANY separate", () => {
    const nurse = generateFixture().cores[0];
    expect(nurse.pool["190"]).toEqual({
      total: "<20",
      byScore: { "95": "<20" },
    });
    expect(nurse.statePool).toEqual({
      "190": { VIC: { "95": "<20" }, ANY: { "90": "7" } },
    });
    // Only the VIC partition was fetched in this fixture.
    expect(nurse.stateInvited).toEqual({
      "190": {
        VIC: { "2026-09": { "90": "25" }, "2026-10": { "95": "<20" } },
      },
      "491": { VIC: { "2026-09": {}, "2026-10": {} } },
    });
    expect(nurse.rounds189).toEqual([
      { date: "2026-10-15", cutoff: null },
      { date: "2026-06-04", cutoff: 65 },
    ]);
  });

  it("splits cohorts and profile slices into the detail file", () => {
    const [nurse, engineer] = generateFixture().details;
    expect(nurse).toEqual({
      schemaVersion: 2,
      snapshotId: "skillselect-2026-10-31",
      asAt: "2026-10",
      code: "254499",
      cohorts: { "189": { "2025-02": { SUBMITTED: "142", INVITED: "175" } } },
      cohortsByScore: {
        "189": { "90": { "2025-02": "40" } },
        "190": { "95": { "2025-02": "<20" } },
      },
      invitedProfile: {
        "189": {
          english: {
            "2026-09": { "20": "12" },
            "2026-10": { "20": "1500", "10": "<20" },
          },
        },
        "190": { english: { "2026-09": {}, "2026-10": {} } },
        "491": { english: { "2026-09": {}, "2026-10": {} } },
      },
      invitedProfileState: {
        "190": { VIC: { english: { "20": "<20" } } },
        "491": { VIC: { english: {} } },
      },
    });
    // 11/2023 is the first of the 36 submitted months to 10/2026; 10/2023 is dropped.
    expect(engineer.invitedProfile["189"]).toEqual({
      english: { "2026-09": {}, "2026-10": {} },
    });
    expect(engineer.cohorts).toEqual({
      "189": { "2023-11": { LODGED: "<20" } },
    });
  });

  it("writes the manifest, index and all-occupation rounds", () => {
    const data = generateFixture();
    expect(data.manifest).toMatchObject({
      schemaVersion: 1,
      snapshotId: "skillselect-2026-10-31",
      asAt: "2026-10",
      checkedAt: "2026-11-17",
      importVersion: "test-1",
      roundsUnmatched: ["Chef"],
      occupations: [
        {
          code: "254499",
          name: "Registered Nurses nec",
          group: null,
          hasData: true,
          totals: { "189": "40", "190": "<20" },
        },
        {
          code: "261313",
          name: "Software Engineer",
          group: null,
          hasData: true,
          totals: { "189": "150" },
        },
      ],
    });
    expect(data.manifest.sources.dashboard).toMatch(/^https:\/\//);
    expect(data.index).toEqual([
      { code: "254499", name: "Registered Nurses nec", hasData: true },
      { code: "261313", name: "Software Engineer", hasData: true },
    ]);
    expect(data.rounds).toEqual({
      rounds: [
        {
          date: "2026-10-15",
          rows: [
            { name: "Software Engineer", code: "261313", cutoff: 95 },
            { name: "Chef", code: null, cutoff: 90 },
          ],
        },
        {
          date: "2026-06-04",
          rows: [
            { name: "Registered Nurses (nec)", code: "254499", cutoff: 65 },
          ],
        },
      ],
      skipped: fixtureSkippedRounds,
    });
    expect(data.newestRawMonth).toBe("2026-10");
  });

  it("keeps a month key for a covered month with no rows, and none for an unfetched month", () => {
    const rawRoot = buildRawFixture();
    // August: status-history fetched with no rows for either occupation;
    // invited-by-score not fetched at all.
    writeFixtureView(rawRoot, "status-history", "2026-08", [
      {
        header: HEADERS.byOccupation,
        rows: [
          ["08/2026", VISA_NAMES["189"], "233211 Civil Engineer", "HOLD", "3"],
        ],
      },
    ]);
    const nurse = generate({ ...fixtureInput, rawRoot }).cores[0];
    expect(nurse.statusHistory["189"]?.["2026-08"]).toEqual({});
    expect(nurse.statusHistory["491"]?.["2026-08"]).toEqual({});
    expect(nurse.invitedByScore["189"]).not.toHaveProperty("2026-08");
    expect(Object.keys(nurse.statusHistory["189"] ?? {})).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });

  it("omits occupations seen only in older months (R9)", () => {
    const rawRoot = buildRawFixture();
    writeFixtureView(rawRoot, "status-history", "2026-09", [
      {
        header: HEADERS.byOccupation,
        rows: [
          ["09/2026", VISA_NAMES["189"], SOFTWARE_ENGINEER, "SUBMITTED", "140"],
          ["09/2026", VISA_NAMES["189"], NURSE, "SUBMITTED", "60"],
          ["09/2026", VISA_NAMES["189"], "233211 Civil Engineer", "HOLD", "3"],
          // A renumbered code keeping its name must not clash in round matching.
          [
            "09/2026",
            VISA_NAMES["189"],
            "261399 Software Engineer",
            "HOLD",
            "4",
          ],
        ],
      },
    ]);
    const data = generate({ ...fixtureInput, rawRoot });
    const codes = ["254499", "261313"];
    expect(data.index.map((entry) => entry.code)).toEqual(codes);
    expect(data.cores.map((core) => core.code)).toEqual(codes);
    expect(data.details.map((detail) => detail.code)).toEqual(codes);
    expect(data.manifest.occupations.map((entry) => entry.code)).toEqual(codes);
    expect(data.cores[1].rounds189[0]).toEqual({
      date: "2026-10-15",
      cutoff: 95,
    });
  });

  it("ignores raw months after asAt", () => {
    const rawRoot = buildRawFixture();
    writeFixtureView(rawRoot, "status-history", "2026-11", [
      {
        header: HEADERS.byOccupation,
        rows: [["11/2026", VISA_NAMES["189"], NURSE, "SUBMITTED", "1"]],
      },
    ]);
    const data = generate({ ...fixtureInput, rawRoot });
    expect(Object.keys(data.cores[0].statusHistory["189"]!)).toEqual([
      "2026-09",
      "2026-10",
    ]);
    expect(data.newestRawMonth).toBe("2026-11");
  });

  it("fails loudly when a view is missing for asAt", () => {
    const rawRoot = buildRawFixture();
    expect(() =>
      generate({ ...fixtureInput, rawRoot, asAt: "2026-09" }),
    ).toThrow(/pool-by-score.*2026-09/);
  });

  it("fails loudly when a table's column titles change", () => {
    const rawRoot = buildRawFixture();
    writeFixtureView(rawRoot, "pool-by-score", "2026-10", [
      {
        header: [
          "As At Month",
          "Visa Type",
          "Occupation",
          "EOI Status",
          "Score Band",
          "Count EOIs",
        ],
        rows: [],
      },
    ]);
    expect(() => generate({ ...fixtureInput, rawRoot })).toThrow(
      /pool-by-score 2026-10.*column 5.*"Score Band"/,
    );
  });

  it("fails loudly when a table has an unexpected number of columns", () => {
    const rawRoot = buildRawFixture();
    writeFixtureView(rawRoot, "status-history", "2026-10", [
      { header: HEADERS.byScore, rows: [] },
    ]);
    expect(() => generate({ ...fixtureInput, rawRoot })).toThrow(
      /status-history 2026-10.*expected 5 columns/,
    );
  });

  it("fails loudly on an unknown visa, a bad count or a stray month", () => {
    const cases: [string[], RegExp][] = [
      [
        ["10/2026", "491FML Family Sponsored", NURSE, "SUBMITTED", "3"],
        /unknown visa "491FML Family Sponsored"/,
      ],
      [
        ["10/2026", VISA_NAMES["189"], NURSE, "SUBMITTED", "-"],
        /invalid count "-"/,
      ],
      [
        ["09/2026", VISA_NAMES["189"], NURSE, "SUBMITTED", "3"],
        /As At Month "09\/2026" does not match 2026-10/,
      ],
    ];
    for (const [row, message] of cases) {
      const rawRoot = buildRawFixture();
      writeFixtureView(rawRoot, "status-history", "2026-10", [
        { header: HEADERS.byOccupation, rows: [row] },
      ]);
      expect(() => generate({ ...fixtureInput, rawRoot })).toThrow(message);
    }
  });

  it("rejects state partitions outside the named states and ANY", () => {
    const rawRoot = buildRawFixture();
    writeFixtureView(rawRoot, "state-pool", "2026-10", [
      { partition: { state: "AUSTRADE" }, header: HEADERS.byScore, rows: [] },
    ]);
    expect(() => generate({ ...fixtureInput, rawRoot })).toThrow(
      /state-pool 2026-10.*state "AUSTRADE"/,
    );
  });
});

describe("writeGenerated", () => {
  function seedTarget(): string {
    const outRoot = mkdtempSync(join(tmpdir(), "generate-out-"));
    mkdirSync(join(outRoot, "occupations"));
    writeFileSync(join(outRoot, "manifest.json"), "old manifest");
    writeFileSync(join(outRoot, "occupation-index.json"), "old index");
    writeFileSync(join(outRoot, "rounds.json"), "old rounds");
    writeFileSync(join(outRoot, "occupations", "999999.json"), "stale");
    writeFileSync(join(outRoot, "states.ts"), "hand-sourced");
    return outRoot;
  }

  function snapshot(dir: string): Record<string, string> {
    const files: Record<string, string> = {};
    for (const entry of readdirSync(dir, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (entry.isFile()) {
        const path = join(entry.parentPath, entry.name);
        files[path.slice(dir.length)] = readFileSync(path, "utf8");
      }
    }
    return files;
  }

  it("replaces the generated files and the occupations folder", () => {
    const outRoot = seedTarget();
    const data = generateFixture();
    writeGenerated(outRoot, data);

    expect(readdirSync(outRoot).sort()).toEqual([
      "manifest.json",
      "occupation-index.json",
      "occupations",
      "rounds-meta.json",
      "rounds.json",
      "states.ts",
    ]);
    expect(readdirSync(join(outRoot, "occupations")).sort()).toEqual([
      "254499.detail.json",
      "254499.json",
      "261313.detail.json",
      "261313.json",
    ]);
    const read = (path: string): unknown =>
      JSON.parse(readFileSync(join(outRoot, path), "utf8"));
    expect(read("manifest.json")).toEqual(data.manifest);
    expect(read("occupation-index.json")).toEqual(data.index);
    expect(read("rounds.json")).toEqual(data.rounds);
    expect(read("rounds-meta.json")).toEqual({ skipped: data.rounds.skipped });
    expect(read("occupations/261313.json")).toEqual(data.cores[1]);
    expect(read("occupations/254499.detail.json")).toEqual(data.details[0]);
    expect(readFileSync(join(outRoot, "states.ts"), "utf8")).toBe(
      "hand-sourced",
    );
  });

  it("leaves the target untouched when serialising fails partway (Review Focus 4)", () => {
    const outRoot = seedTarget();
    const before = snapshot(outRoot);
    let calls = 0;
    const serialize = (value: unknown): string => {
      calls += 1;
      if (calls === 3) throw new Error("disk full");
      return JSON.stringify(value);
    };

    expect(() =>
      writeGenerated(outRoot, generateFixture(), { serialize }),
    ).toThrow("disk full");
    expect(calls).toBe(3);
    expect(snapshot(outRoot)).toEqual(before);
    expect(readdirSync(outRoot).sort()).toEqual([
      "manifest.json",
      "occupation-index.json",
      "occupations",
      "rounds.json",
      "states.ts",
    ]);
  });

  it("creates the target folders on first write", () => {
    const outRoot = join(mkdtempSync(join(tmpdir(), "generate-out-")), "data");
    writeGenerated(outRoot, generateFixture());
    expect(existsSync(join(outRoot, "occupations", "261313.json"))).toBe(true);
  });
});
