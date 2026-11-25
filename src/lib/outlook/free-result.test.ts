import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { scenarioInput } from "./__fixtures__/scenario-input";
import { SCENARIOS } from "./__fixtures__/scenarios";
import type { ScenarioId } from "./__fixtures__/scenarios";
import { buildFreeResult } from "./free-result";
import type { FreeStamp } from "./stamp-face";
import { buildOutlookView } from "./view";
import type { OutlookViewInput } from "./view";

const KEYS = [
  "visa",
  "shape",
  "top",
  "stampWord",
  "points",
  "label",
  "ink",
] as const;
const IDS = Object.keys(SCENARIOS) as ScenarioId[];

function viewInput(id: ScenarioId): OutlookViewInput {
  const { core, detail, ...rest } = scenarioInput(id);
  return {
    ...rest,
    occupation: core
      ? { status: "ready", core, detail }
      : { status: "unavailable" },
  };
}

function pick7(card: FreeStamp): FreeStamp {
  return Object.fromEntries(KEYS.map((k) => [k, card[k]])) as FreeStamp;
}

describe("buildFreeResult", () => {
  it("matches the report's visa cards for every scenario", () => {
    let compared = 0;
    for (const id of IDS) {
      const input = viewInput(id);
      const free = buildFreeResult(input);
      const view = buildOutlookView(input);
      if (free.kind !== "stamps") continue;
      expect(view.kind, id).toBe("report");
      if (view.kind !== "report") continue;
      expect(free.stamps, id).toEqual(view.visas.map(pick7));
      expect(free.points, id).toEqual(view.points);
      expect(free.dataMonth, id).toBe(view.dataMonth);
      compared += 1;
    }
    expect(compared).toBeGreaterThan(4);
  });

  it("is points-only without an occupation core", () => {
    const input = {
      ...viewInput("strong"),
      occupation: { status: "unavailable" },
    } as const;
    const free = buildFreeResult(input);
    expect(free.kind).toBe("points-only");
    expect(free).toMatchObject({ reason: "unavailable", note: null });
  });

  it("keeps the note of a dropped occupation", () => {
    const free = buildFreeResult({
      ...viewInput("strong"),
      occupation: { status: "dropped", note: "Left SkillSelect" },
    });
    expect(free).toMatchObject({
      kind: "points-only",
      reason: "dropped",
      note: "Left SkillSelect",
    });
  });

  it("is points-only when no occupation is chosen or the load failed", () => {
    const none = viewInput("strong");
    expect(
      buildFreeResult({
        ...none,
        profile: { ...none.profile, occupation: "" },
      }),
    ).toMatchObject({ kind: "points-only", reason: "no-occupation" });
    expect(
      buildFreeResult({ ...none, occupation: { status: "load-failed" } }),
    ).toMatchObject({ kind: "points-only", reason: "load-failed" });
  });

  it("never carries captions", () => {
    for (const id of IDS) {
      const free = buildFreeResult(viewInput(id));
      if (free.kind !== "stamps") continue;
      for (const stamp of free.stamps) {
        expect(stamp).not.toHaveProperty("caption");
        expect(stamp).not.toHaveProperty("title");
        expect(stamp).not.toHaveProperty("flagText");
      }
    }
  });
});

describe("stamp-face imports", () => {
  it("reaches none of the report builder's heavy modules", () => {
    const seen = new Set<string>();
    const walk = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const text = readFileSync(file, "utf8");
      // Type-only imports are erased, so they pull in no code.
      const re = /^(?:import|export)(?! type)[^;]*?from "(\.[^"]+)";/gms;
      for (const m of text.matchAll(re)) {
        const base = resolve(dirname(file), m[1]);
        if (base.endsWith(".json")) continue;
        walk(existsSync(`${base}.ts`) ? `${base}.ts` : `${base}/index.ts`);
      }
    };
    walk(resolve(__dirname, "stamp-face.ts"));
    const names = [...seen].map((f) => basename(f, ".ts"));
    for (const heavy of [
      "wait",
      "route",
      "improve",
      "facts",
      "view",
      "evidence",
    ]) {
      expect(names).not.toContain(heavy);
    }
  });
});
