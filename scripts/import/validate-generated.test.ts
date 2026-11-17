import { describe, expect, it } from "vitest";
import type { Manifest } from "../../src/lib/data/types";
import { generate, type GeneratedData } from "./generate";
import {
  buildRawFixture,
  fixtureInput,
  HEADERS,
  NURSE,
  SOFTWARE_ENGINEER,
  writeFixtureView,
} from "./generate-fixture";
import { VISA_NAMES } from "./qlik-constants";
import { validateGenerated } from "./validate-generated";

function valid(): GeneratedData {
  return generate({ ...fixtureInput, rawRoot: buildRawFixture() });
}

function previousManifest(overrides: Partial<Manifest> = {}): Manifest {
  return { ...valid().manifest, ...overrides };
}

describe("validateGenerated", () => {
  it("accepts the generated fixture", () => {
    expect(validateGenerated(valid(), null)).toEqual([]);
    expect(validateGenerated(valid(), previousManifest())).toEqual([]);
  });

  it("reports a SUBMITTED total outside the score-row sums, naming code and visa", () => {
    const rawRoot = buildRawFixture();
    const m = "10/2026";
    const v189 = VISA_NAMES["189"];
    writeFixtureView(rawRoot, "status-history", "2026-10", [
      {
        header: HEADERS.byOccupation,
        rows: [
          [m, v189, SOFTWARE_ENGINEER, "SUBMITTED", "500"],
          [m, v189, SOFTWARE_ENGINEER, "INVITED", "<20"],
          [m, v189, SOFTWARE_ENGINEER, "LODGED", "119"],
          [m, v189, NURSE, "SUBMITTED", "40"],
          [m, v189, NURSE, "INVITED", "2730"],
          [m, VISA_NAMES["190"], NURSE, "SUBMITTED", "<20"],
        ],
      },
    ]);
    const issues = validateGenerated(
      generate({ ...fixtureInput, rawRoot }),
      null,
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/261313/);
    expect(issues[0]).toMatch(/189/);
    expect(issues[0]).toMatch(/SUBMITTED 500.*150–169/);
  });

  it("reports INVITED outside the invited score-row sums for any month", () => {
    const data = valid();
    data.cores[0].statusHistory["189"]!["2026-09"].INVITED = "40";
    const issues = validateGenerated(data, null);
    expect(issues).toEqual([
      "254499 visa 189 2026-09: INVITED 40 is outside the invited score-row sum 0–0",
    ]);
  });

  it("reports records that fail the schema guards", () => {
    const data = valid();
    data.cores[1].pool["189"]!.byScore["85"] = "12.5";
    data.details[0].cohorts["189"]!["2025-02"].CLOSED = "n/a";
    const issues = validateGenerated(data, null);
    expect(issues).toContain("261313: core record fails the schema guard");
    expect(issues).toContain("254499: detail record fails the schema guard");
  });

  it("reports duplicate occupation codes and records out of step with the index", () => {
    const data = valid();
    data.index.push({ ...data.index[0] });
    data.details.pop();
    const issues = validateGenerated(data, null);
    expect(issues).toContain("Duplicate occupation code 254499 in the index");
    expect(issues).toContain("261313: missing detail record");
  });

  it("reports records from another snapshot", () => {
    const data = valid();
    data.cores[0].snapshotId = "skillselect-2026-09-30";
    expect(validateGenerated(data, null)).toContain(
      "254499: core snapshot skillselect-2026-09-30 does not match skillselect-2026-10-31",
    );
  });

  it("reports an occupation count more than 10% below the previous snapshot", () => {
    const occupations = valid().manifest.occupations;
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...occupations[0],
      code: String(100000 + i),
    }));
    const issues = validateGenerated(
      valid(),
      previousManifest({ occupations: many }),
    );
    expect(issues).toEqual([
      "Occupation count fell from 20 to 2 (more than 10%)",
    ]);
    const same = many.slice(0, 2);
    expect(
      validateGenerated(valid(), previousManifest({ occupations: same })),
    ).toEqual([]);
  });

  it("reports a drop when the asAt tables lose codes that older months still hold (R9)", () => {
    const extra = Array.from(
      { length: 20 },
      (_, i) => `1000${10 + i} Test Occupation ${i}`,
    );
    const baseRows = (m: string, submitted: Record<string, string>) =>
      Object.entries(submitted).map(([occupation, count]) => [
        m,
        VISA_NAMES["189"],
        occupation,
        "SUBMITTED",
        count,
      ]);
    const october = [
      ...baseRows("10/2026", { [SOFTWARE_ENGINEER]: "150", [NURSE]: "40" }),
      ["10/2026", VISA_NAMES["189"], SOFTWARE_ENGINEER, "INVITED", "<20"],
      ["10/2026", VISA_NAMES["189"], SOFTWARE_ENGINEER, "LODGED", "119"],
      ["10/2026", VISA_NAMES["189"], NURSE, "INVITED", "2730"],
      ["10/2026", VISA_NAMES["190"], NURSE, "SUBMITTED", "<20"],
    ];
    const extraRows = (m: string) =>
      extra.map((occupation) => [
        m,
        VISA_NAMES["189"],
        occupation,
        "HOLD",
        "3",
      ]);

    const previousRoot = buildRawFixture();
    writeFixtureView(previousRoot, "status-history", "2026-10", [
      {
        header: HEADERS.byOccupation,
        rows: [...october, ...extraRows("10/2026")],
      },
    ]);
    const previous = generate({ ...fixtureInput, rawRoot: previousRoot });
    expect(previous.manifest.occupations).toHaveLength(22);

    const currentRoot = buildRawFixture();
    writeFixtureView(currentRoot, "status-history", "2026-09", [
      {
        header: HEADERS.byOccupation,
        rows: [
          ...baseRows("09/2026", { [SOFTWARE_ENGINEER]: "140", [NURSE]: "60" }),
          ...extraRows("09/2026"),
        ],
      },
    ]);
    const current = generate({ ...fixtureInput, rawRoot: currentRoot });
    expect(validateGenerated(current, previous.manifest)).toEqual([
      "Occupation count fell from 22 to 2 (more than 10%)",
    ]);
  });

  it("reports an asAt older than the previous snapshot or the newest raw month", () => {
    expect(
      validateGenerated(valid(), previousManifest({ asAt: "2026-11" })),
    ).toEqual(["asAt 2026-10 is older than the previous snapshot 2026-11"]);
    const data = valid();
    data.newestRawMonth = "2026-11";
    expect(validateGenerated(data, null)).toEqual([
      "asAt 2026-10 is older than the newest raw month 2026-11",
    ]);
  });

  it("reports core and detail files over their size limits", () => {
    const data = valid();
    const big: Record<string, string> = {};
    for (let score = 0; score < 6000; score++) big[String(score)] = "<20";
    data.cores[0].statePool = { "190": { VIC: big } };
    const huge: Record<string, string> = {};
    for (let i = 0; i < 25000; i++) huge[String(i)] = "<20";
    data.details[1].invitedProfileState = {
      "190": { VIC: { english: huge } },
    };
    const issues = validateGenerated(data, null);
    expect(issues).toHaveLength(2);
    expect(issues[0]).toMatch(/^254499: core file is \d+ bytes, over 51200$/);
    expect(issues[1]).toMatch(
      /^261313: detail file is \d+ bytes, over 256000$/,
    );
  });
});
