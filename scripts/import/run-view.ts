import type { MonthKey, ProfileAttribute } from "../../src/lib/data/types";
import {
  DASHBOARD_PAGE_URL,
  QLIK_TABLE_OBJECT,
  VISA_NAMES,
} from "./qlik-constants";
import { asAtSerial, type QlikSession } from "./qlik-client";
import { encodeRaw, type RawViewFile } from "./raw-store";
import {
  ALL_TOGGLES,
  assertWithinGuardrail,
  FIELD_NAMES,
  FILTER_FIELDS,
  type DetailField,
  type ViewDefinition,
} from "./views";

type PartitionKey = ViewDefinition["partitionBy"][number];

function partitionField(key: PartitionKey): string {
  if (key === "score") return FIELD_NAMES.points.field;
  return FIELD_NAMES[key].field;
}

/**
 * Score is numeric: the engine accepts a text match on it but selects nothing,
 * which leaves the table unfiltered. Verified live on 17 Nov 2026.
 */
function partitionValue(
  key: PartitionKey,
  value: string,
): { text?: string; number?: number } {
  return key === "score" ? { number: Number(value) } : { text: value };
}

function combinations(
  keys: PartitionKey[],
  values: Record<string, string[]>,
): Record<string, string>[] {
  let combos: Record<string, string>[] = [{}];
  for (const key of keys) {
    const options = values[key];
    if (!options?.length) throw new Error(`no partition values for "${key}"`);
    combos = combos.flatMap((combo) =>
      options.map((value) => ({ ...combo, [key]: value })),
    );
  }
  return combos;
}

export async function runView(
  session: QlikSession,
  view: ViewDefinition,
  asAt: MonthKey,
  partitionValues: Record<string, string[]>,
): Promise<RawViewFile> {
  assertWithinGuardrail(view);
  const variants: (ProfileAttribute | undefined)[] = view.attributeVariants ?? [
    undefined,
  ];
  const visaTexts = view.visas.map((visa) => VISA_NAMES[visa]);
  const parts: RawViewFile["parts"] = [];

  for (const combo of combinations(view.partitionBy, partitionValues)) {
    for (const variant of variants) {
      for (const field of FILTER_FIELDS) await session.clear(field);

      const shown: DetailField[] = variant
        ? [...view.shown, variant]
        : view.shown;
      const on = new Set(shown.map((field) => FIELD_NAMES[field].toggle));
      for (const toggle of ALL_TOGGLES) {
        await session.setToggle(toggle, on.has(toggle));
      }

      await session.select(
        "Visa Type",
        visaTexts.map((text) => ({ text })),
      );
      await session.select(
        "EOI Status",
        view.statuses.map((text) => ({ text })),
      );
      await session.select("As At Month", [{ number: asAtSerial(asAt) }]);
      for (const [key, value] of Object.entries(combo)) {
        await session.select(partitionField(key as PartitionKey), [
          partitionValue(key as PartitionKey, value),
        ]);
      }

      const { header, rows } = await session.readTable(QLIK_TABLE_OBJECT);
      parts.push({
        partition: variant ? { ...combo, attribute: variant } : combo,
        table: encodeRaw(header, rows),
      });
    }
  }

  return {
    viewId: view.id,
    asAt,
    fetchedAt: new Date().toISOString(),
    source: DASHBOARD_PAGE_URL,
    selections: {
      "Visa Type": visaTexts,
      "EOI Status": view.statuses,
      "As At Month": [asAt],
    },
    parts,
  };
}
