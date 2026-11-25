import type { OccupationCore } from "../data/types";

export type BeatItem = {
  icon: "queue" | "wait" | "states" | "points" | "inbox";
  title: string;
  text: string;
};
export type BeatFact = { value: number; label: string };
export type CheckoutBeats = { items: BeatItem[]; facts: BeatFact[] };

type Input = {
  occupationName: string;
  points: number;
  core: OccupationCore;
  /** From the occupation index, never a literal. */
  occupationsWithData: number;
  /** The states and territories in the state rule data. */
  stateCount: number;
};

/** "9,464", "fewer than 20" for a masked count, or nothing when unpublished. */
function poolWords(core: OccupationCore): string {
  const total = core.pool["189"]?.total;
  if (!total) return "";
  if (total === "<20") return "fewer than 20 ";
  const n = Number(total);
  return Number.isFinite(n) ? `${n.toLocaleString("en-AU")} ` : "";
}

/** Every as-at month the record holds: the history the report reads. */
function historyMonths(core: OccupationCore): number {
  const counts = Object.values(core.statusHistory).map(
    (months) => Object.keys(months ?? {}).length,
  );
  return Math.max(0, ...counts);
}

/**
 * The checkout's build-up (paid-report-3.html, part 2 A): what the report
 * covers for this reader, and the published data it reads. Counts come from
 * the reader's own occupation record; there is no fixed number here.
 */
export function checkoutBeats(input: Input): CheckoutBeats {
  const { occupationName, points, core } = input;
  const rounds = core.rounds189.length;
  return {
    items: [
      {
        icon: "queue",
        title: "Your place in the 189 queue",
        text: `Among ${poolWords(core)}${occupationName} EOIs, how many score above your ${points}, and how many sit at it.`,
      },
      {
        icon: "wait",
        title: "Your estimated wait",
        text:
          rounds > 0
            ? `From the last ${rounds} invitation rounds, labelled as an estimate.`
            : "From recent invitation rounds, labelled as an estimate.",
      },
      {
        icon: "states",
        title: `190 and 491 in all ${input.stateCount} states`,
        text: "Each state's invitations at your score, and its rules checked against you.",
      },
      {
        icon: "points",
        title: "Your fastest ways to more points",
        text: "English, NAATI CCL, Professional Year, partner skills, and the dates you'd lose points.",
      },
      {
        icon: "inbox",
        title: "PDF in your inbox, and a private link",
        text: "Read it online for 12 months, print it, share it with your agent.",
      },
    ],
    facts: [
      { value: historyMonths(core), label: "months of SkillSelect data" },
      { value: input.occupationsWithData, label: "occupations" },
      { value: rounds, label: "189 rounds read" },
      { value: input.stateCount, label: "state programs" },
    ],
  };
}
