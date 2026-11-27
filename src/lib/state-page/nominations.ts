import type { RoundsFile } from "../data/rounds-file";
import type { Interval, StateCode, StateVisa } from "../data/types";

/**
 * Home Affairs' state and territory nominations to date in the program
 * year: a different measure from the SkillSelect INVITED stock, printed
 * beside it and never reconciled with it.
 */
export type StateNominations = {
  programYear: string; // "2026-27"
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  /** The round whose page published the table. */
  roundDate: string;
  byVisa: Record<StateVisa, { text: string; count: Interval }>;
};

/** "<5" is published as such: 0 to 4. Digits are exact. */
export function nominationCount(text: string): Interval {
  if (text === "<5") return { min: 0, max: 4 };
  if (/^\d+$/.test(text)) return { min: Number(text), max: Number(text) };
  throw new Error(`Unexpected nominations value "${text}"`);
}

/** The newest round's table (rounds are stored newest first); null when none has one. */
export function stateNominations(
  rounds: RoundsFile,
  state: StateCode,
): StateNominations | null {
  const round = rounds.rounds.find((r) => r.nominations !== null);
  const table = round?.nominations;
  if (!round || !table) return null;
  const cell = (visa: StateVisa) => {
    const text = table.byVisa[visa][state];
    return { text, count: nominationCount(text) };
  };
  return {
    programYear: table.programYear,
    from: table.from,
    to: table.to,
    roundDate: round.date,
    byVisa: { "190": cell("190"), "491": cell("491") },
  };
}

/** "11", "fewer than 5", "0". */
export function nominationText(text: string): string {
  return text === "<5" ? "fewer than 5" : Number(text).toLocaleString("en-AU");
}
