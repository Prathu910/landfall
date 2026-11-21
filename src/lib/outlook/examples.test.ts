import { describe, expect, it } from "vitest";
import { SAMPLE_AS_OF } from "../sample";
import { scenarioInput } from "./__fixtures__/scenario-input";
import { EXAMPLES } from "./examples";
import { checkRead } from "./read-contract";
import { buildOutlookView } from "./view";
import type { ReportOutlookView } from "./view";

function reportFor(id: (typeof EXAMPLES)[number]["id"], asOf?: string) {
  const { core, detail, ...rest } = scenarioInput(id);
  if (!core) throw new Error(`${id} has no core`);
  const view = buildOutlookView({
    ...rest,
    asOf: asOf ?? rest.asOf,
    occupation: { status: "ready", core, detail },
  });
  if (view.kind !== "report") throw new Error(`${id} is ${view.kind}`);
  return view satisfies ReportOutlookView;
}

// Task 10's table: a data refresh that moves a stamp must be reviewed.
const STAMPS = {
  strong: { kind: "single", visa: "189", label: "very-strong" },
  middle: { kind: "single", visa: "189", label: "competitive" },
  notinv: { kind: "single", visa: "190", state: "NT", label: "competitive" },
  none: { kind: "combined", label: "not-invited" },
} as const;

describe("sample examples", () => {
  it("names the four tabs in order", () => {
    expect(EXAMPLES.map((e) => e.tab)).toEqual([
      "Strong",
      "In the middle",
      "189 closed",
      "Nothing suits",
    ]);
  });

  it.each(EXAMPLES)("$tab: stamp matches the reviewed table", ({ id }) => {
    expect(reportFor(id).stamp).toMatchObject(STAMPS[id]);
  });

  it.each(EXAMPLES)(
    "$tab: same stamp at the sample's pinned date",
    ({ id }) => {
      expect(reportFor(id, SAMPLE_AS_OF).stamp).toMatchObject(STAMPS[id]);
    },
  );

  it.each(EXAMPLES)("$tab: template read passes checkRead", ({ id }) => {
    for (const asOf of [undefined, SAMPLE_AS_OF]) {
      const view = reportFor(id, asOf);
      expect(checkRead(view.templateRead, view.facts)).toEqual({ ok: true });
    }
  });
});
