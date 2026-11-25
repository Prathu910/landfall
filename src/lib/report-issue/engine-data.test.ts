import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { frozenDetail } from "../data/__fixtures__/frozen-2026-10";
import { parseEngineData } from "./engine-data";
import type { RawEngineData } from "./engine-data";

const fixture = JSON.parse(
  readFileSync(
    "src/lib/report-issue/__fixtures__/engine-input-261313.json",
    "utf8",
  ),
) as { data: RawEngineData };

const raw = (change: Partial<RawEngineData> = {}): RawEngineData => ({
  ...fixture.data,
  ...change,
});

describe("parseEngineData", () => {
  it("accepts the engine fixture", () => {
    expect(parseEngineData(raw())).not.toBeNull();
  });

  it("accepts the state rules the site serves (public/data/state-rules.json)", () => {
    const served: unknown = JSON.parse(JSON.stringify(stateRuleData));
    expect(parseEngineData(raw({ rules: served }))?.rules).toEqual(
      stateRuleData,
    );
  });

  it("accepts a missing detail as null only", () => {
    expect(parseEngineData(raw({ detail: null }))?.detail).toBeNull();
    expect(parseEngineData(raw({ detail: undefined }))).toBeNull();
  });

  it("refuses a detail for another occupation", () => {
    expect(parseEngineData(raw({ detail: frozenDetail("254499") }))).toBeNull();
  });

  it("refuses a broken manifest, index, core or rules", () => {
    const rules = fixture.data.rules as Record<string, unknown>;
    const broken: Partial<RawEngineData>[] = [
      { manifest: { asAt: "2026-10" } },
      { index: [{ code: "261313" }] },
      { core: { code: "261313" } },
      { rules: { ...rules, rules: [] } },
      { rules: { ...rules, lists: { wa: { listId: "wa" } } } },
      { rules: { ...rules, federal: { entries: {} } } },
    ];
    for (const change of broken) {
      expect(parseEngineData(raw(change))).toBeNull();
    }
  });

  it("accepts an unreadable federal list as null, as the site does", () => {
    const rules = fixture.data.rules as Record<string, unknown>;
    expect(
      parseEngineData(raw({ rules: { ...rules, federal: null } })),
    ).not.toBeNull();
  });
});
