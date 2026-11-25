import {
  freeResult,
  issuePayload,
  parseEngineData,
  parseProfile,
  type EngineData,
  type Profile,
  type ReportMeta,
} from "../functions/_shared/report-engine.js";
import input from "../../src/lib/report-issue/__fixtures__/engine-input-261313.json" with { type: "json" };
import expected from "../../src/lib/report-issue/__fixtures__/payload-261313.json" with { type: "json" };

function equal(actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(
      `Expected ${b.slice(0, 400)}…, received ${a.slice(0, 400)}…`,
    );
  }
}

function fixtureData(
  change: Partial<Record<string, unknown>> = {},
): EngineData {
  const data = parseEngineData({ ...input.data, ...change });
  if (!data) throw new Error("the engine fixture data is invalid");
  return data;
}

function fixtureProfile(): Profile {
  const profile = parseProfile(input.profile);
  if (!profile) throw new Error("the engine fixture profile is invalid");
  return profile;
}

const meta: ReportMeta = input.meta;

Deno.test("issues the same payload as the site code", () => {
  const payload = issuePayload(
    fixtureData(),
    fixtureProfile(),
    input.asOf,
    meta,
  );
  equal(payload, expected);
});

Deno.test("reads the month it is given", () => {
  const data = fixtureData({
    manifest: {
      ...input.data.manifest,
      asAt: "2026-11",
      checkedAt: "2026-12-02",
    },
    core: { ...input.data.core, asAt: "2026-11" },
  });
  const payload = issuePayload(data, fixtureProfile(), input.asOf, meta);
  equal(payload.view.dataMonth, "November 2026");
  equal(payload.source, {
    ...expected.source,
    snapshotDate: "2026-11-30",
    checkedAt: "2026-12-02",
  });
});

Deno.test("gives the free stamps for the same data", () => {
  const result = freeResult(fixtureData(), fixtureProfile(), input.asOf);
  equal(result.kind, "stamps");
  if (result.kind === "stamps") equal(result.dataMonth, "October 2026");
});

Deno.test("refuses data it cannot read", () => {
  equal(parseEngineData({ ...input.data, core: { code: "261313" } }), null);
  equal(parseEngineData({ ...input.data, rules: null }), null);
  equal(parseProfile({ occupation: "261313" }), null);
});

Deno.test("refuses data for another occupation", () => {
  const profile = { ...fixtureProfile(), occupation: "254499" };
  let error: unknown;
  try {
    issuePayload(fixtureData(), profile, input.asOf, meta);
  } catch (caught) {
    error = caught;
  }
  equal(error instanceof Error, true);
});
