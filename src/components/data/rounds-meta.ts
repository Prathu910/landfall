import meta from "../../data/rounds-meta.json";

export type SkippedRound = { date: string; reason: string };

function isSkippedRounds(value: unknown): value is SkippedRound[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SkippedRound).date === "string" &&
        typeof (item as SkippedRound).reason === "string",
    )
  );
}

function readSkipped(value: { skipped: unknown }): SkippedRound[] {
  if (!isSkippedRounds(value.skipped)) {
    throw new Error(
      "src/data/rounds-meta.json is not { skipped: {date, reason}[] }",
    );
  }
  return value.skipped;
}

/** 189 rounds the parser skipped; they are absent from every cut-off history, never "not listed". */
export const skippedRounds: SkippedRound[] = readSkipped(meta);
