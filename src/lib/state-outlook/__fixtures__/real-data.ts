import { readFileSync } from "node:fs";
import path from "node:path";
import { isFederalList, isImportedList } from "../rules-guards";
import type { FederalList, ImportedList } from "../rules-types";

/** The imported lists that the 2026–27 rules reference. */
const LIST_IDS = ["wa", "sa", "qld", "nsw"];

function readJson(file: string): unknown {
  return JSON.parse(
    readFileSync(
      path.resolve(process.cwd(), "src/data/state-rules", file),
      "utf8",
    ),
  );
}

/** The checked-in state lists, validated. */
export function realLists(): Record<string, ImportedList> {
  const lists: Record<string, ImportedList> = {};
  for (const id of LIST_IDS) {
    const json = readJson(`lists/${id}.json`);
    if (!isImportedList(json)) throw new Error(`list ${id} is invalid`);
    lists[id] = json;
  }
  return lists;
}

/** The checked-in federal occupation list, validated. */
export function realFederal(): FederalList {
  const json = readJson("federal-occupations.json");
  if (!isFederalList(json)) throw new Error("federal list is invalid");
  return json;
}
