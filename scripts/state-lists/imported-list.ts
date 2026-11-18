import type { ImportedList } from "../../src/lib/state-outlook/rules-types";
import { isImportedList } from "../../src/lib/state-outlook/rules-guards";
import { writeJsonFile } from "./shared";

/** A page change that silently drops rows would mark occupations unlisted. */
export function assertListSize(list: ImportedList, minCodes: number): void {
  const count = Object.keys(list.entries).length;
  if (count < minCodes) {
    throw new Error(
      `Only ${count} occupations in the ${list.listId} list (expected at least ${minCodes}); review the source`,
    );
  }
}

export function writeImportedList(path: string, list: ImportedList): void {
  const listId = list.listId;
  if (!isImportedList(list)) {
    throw new Error(`${listId} list failed validation; not written`);
  }
  writeJsonFile(path, list);
}
