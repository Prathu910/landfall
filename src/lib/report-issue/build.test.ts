import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  frozenCore,
  frozenDetail,
  frozenIndex,
  frozenManifest,
} from "../data/__fixtures__/frozen-2026-10";
import { reportSource } from "../data/report-source";
import { parseProfile } from "../profile-guard";
import { buildOutlookView } from "../outlook/view";
import { scenarioInput, AS_OF } from "../outlook/__fixtures__/scenario-input";
import { buildStateOutlookView } from "../report/state-outlook-view";
import { ReportBuildError, buildReportPayload } from "./build";
import type { ReportSource } from "../data/report-source";
import { parseEngineData } from "./engine-data";
import type { RawEngineData } from "./engine-data";
import type { ReportMeta } from "./payload";

const source: ReportSource = {
  snapshotDate: "2026-10-31",
  checkedAt: "2026-11-01",
  dashboardUrl: "https://example.test/d",
  roundsUrl: "https://example.test/r",
  previousRoundsUrl: "https://example.test/p",
};

function input(id: "strong" | "nodata" = "strong") {
  const s = scenarioInput(id);
  return { ...s, source, meta: null };
}

describe("buildReportPayload", () => {
  it("builds the same view as buildOutlookView", () => {
    const i = input();
    const payload = buildReportPayload(i);
    const view = buildOutlookView({
      profile: i.profile,
      asOf: i.asOf,
      rules: i.rules,
      occupation: { status: "ready", core: i.core!, detail: i.detail },
    });
    expect(view.kind).toBe("report");
    expect(payload.view).toEqual(view);
    expect(payload.asOf).toBe(AS_OF);
    expect(payload.schema).toBe(1);
  });

  it("includes the state outlook the evidence section shows", () => {
    const i = input();
    const payload = buildReportPayload(i);
    expect(payload.stateOutlook).toEqual(
      buildStateOutlookView({
        core: i.core!,
        profile: i.profile,
        asOf: i.asOf,
        points: payload.view.points,
        data: i.rules,
      }),
    );
  });

  it("refuses an occupation without a core", () => {
    let error: unknown;
    try {
      buildReportPayload(input("nodata"));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ReportBuildError);
    expect((error as ReportBuildError).reason).toBe("no-core");
  });

  it("survives JSON", () => {
    const meta = {
      reportNo: "ML-0001",
      version: 1,
      issuedAt: "2026-11-25T00:00:00.000Z",
      correctableUntil: "2026-12-25T00:00:00.000Z",
      revisionsLeft: 2,
    };
    const payload = buildReportPayload({ ...input(), meta });
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
});

// The engine fixture: one fixed input (the frozen 2026-10 Software Engineer
// core and the rules as they were when written) and the payload the site code
// builds from it. supabase/tests/report_engine_test.ts checks that the Deno
// bundle issues the same payload. Rewrite both with UPDATE_FIXTURES=1.
const FIXTURES = "src/lib/report-issue/__fixtures__";
const INPUT_FILE = `${FIXTURES}/engine-input-261313.json`;
const PAYLOAD_FILE = `${FIXTURES}/payload-261313.json`;
const ENGINE_META: ReportMeta = {
  reportNo: "ML-0042",
  version: 1,
  issuedAt: "2026-11-21T03:00:00.000Z",
  correctableUntil: "2026-12-21T03:00:00.000Z",
  revisionsLeft: 2,
};

type EngineInput = {
  profile: unknown;
  asOf: string;
  meta: ReportMeta;
  data: RawEngineData;
};

function freshEngineInput(): EngineInput {
  const s = scenarioInput("notinv");
  return {
    profile: s.profile,
    asOf: s.asOf,
    meta: ENGINE_META,
    data: {
      manifest: frozenManifest(),
      index: frozenIndex(),
      rules: s.rules,
      core: frozenCore("261313"),
      detail: frozenDetail("261313"),
    },
  };
}

/** What /check/ passes the builder: the source dates to the manifest's month. */
function sitePayload(input: EngineInput) {
  const data = parseEngineData(input.data);
  const profile = parseProfile(input.profile);
  if (!data || !profile) throw new Error("the engine fixture is invalid");
  return buildReportPayload({
    profile,
    asOf: input.asOf,
    core: data.core,
    detail: data.detail,
    rules: data.rules,
    source: reportSource(data.manifest.asAt, data.manifest),
    meta: input.meta,
  });
}

const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(file, "utf8"));
// The input is compact (about 0.5 MB); the payload is indented so its diffs read.
const writeJson = (file: string, value: unknown, indent?: number) =>
  writeFileSync(file, `${JSON.stringify(value, null, indent)}\n`);

describe("the engine fixture", () => {
  it("matches the committed engine fixture", () => {
    if (process.env.UPDATE_FIXTURES === "1") {
      const fresh = freshEngineInput();
      writeJson(INPUT_FILE, fresh);
      writeJson(PAYLOAD_FILE, sitePayload(fresh), 2);
    }
    const input = readJson(INPUT_FILE) as EngineInput;
    expect(input.data.core).toEqual(frozenCore("261313"));
    expect(input.profile).toEqual(scenarioInput("notinv").profile);
    const payload = sitePayload(input);
    expect(readJson(PAYLOAD_FILE)).toEqual(JSON.parse(JSON.stringify(payload)));
  });
});
