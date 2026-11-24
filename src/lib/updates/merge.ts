import type { MonthKey } from "../data/types";
import { monthOfDate } from "./dates";
import type { DataSection, RecapFacts, RoundSection } from "./types";

function base(
  existing: RecapFacts | null,
  month: MonthKey,
  today: string,
): RecapFacts {
  if (existing && existing.month !== month)
    throw new Error(`Facts file is for ${existing.month}, not ${month}`);
  return (
    existing ?? {
      schemaVersion: 1,
      month,
      firstGeneratedAt: today,
      updatedAt: today,
      rounds: {},
      data: null,
    }
  );
}

/** Adds or replaces one round's section; the data section and other rounds stay as they are. */
export function withRoundSection(
  existing: RecapFacts | null,
  month: MonthKey,
  date: string,
  section: RoundSection,
  today: string,
): RecapFacts {
  if (monthOfDate(date) !== month)
    throw new Error(`Round ${date} is not in ${month}`);
  const facts = base(existing, month, today);
  return {
    ...facts,
    updatedAt: today,
    rounds: { ...facts.rounds, [date]: section },
  };
}

/** Adds or replaces the data section; the round sections stay as they are. */
export function withDataSection(
  existing: RecapFacts | null,
  month: MonthKey,
  section: DataSection,
  today: string,
): RecapFacts {
  const facts = base(existing, month, today);
  return { ...facts, updatedAt: today, data: section };
}
