import { STATE_NAMES } from "../state-outlook/context";
import type { FaqEntry } from "../seo/json-ld";
import {
  aboutText,
  dayText,
  formatLongMonth,
  formatNumber,
  intervalText,
  longDayText,
  minimumText,
  monthEnd,
  rangeText,
} from "./format";
import {
  cutoffBounds,
  noRoundText,
  occupationsText,
  round189Total,
  roundsNewestFirst,
} from "./round-view";
import { stateLeader } from "./state-view";
import type { DataSection, RecapFacts, RoundSection } from "./types";

type Round = { date: string; section: RoundSection };

const MAX_FACT_QUESTIONS = 4;

const ADVICE: FaqEntry = {
  question: "Is this migration advice?",
  answer:
    "No. It is general information from published government data. MigrateLens is not a registered migration agent. For advice on your situation, find a registered migration agent at mara.gov.au.",
};

function latestRound(month: string, [round, earlier]: Round[]): FaqEntry {
  const { date, section } = round;
  const total = formatNumber(round189Total(section));
  const listed = occupationsText(section.occupations.length);
  const before = earlier
    ? `An earlier round on ${longDayText(earlier.date)} invited ${formatNumber(round189Total(earlier.section))} EOIs.`
    : section.previousRound
      ? `The round before it was on ${longDayText(section.previousRound.date)}.`
      : null;
  return {
    question: `When was the latest 189 round in ${month}?`,
    answer: [
      `${longDayText(date)}. Home Affairs invited ${total} EOIs for the 189 visa across ${listed}.`,
      before,
    ]
      .filter((s): s is string => s !== null)
      .join(" "),
  };
}

/** One real example: the spotlight if the round listed it, else the first card pick. */
function exampleRow(section: RoundSection, data: DataSection | null) {
  const listed = section.occupations.filter((o) => o.code !== null);
  const wanted = [data?.spotlight.code, section.cardPicks[0]?.code];
  for (const code of wanted) {
    const row = listed.find((o) => o.code === code);
    if (row) return row;
  }
  return listed[0] ?? section.occupations[0];
}

function exampleSentence(section: RoundSection, data: DataSection | null) {
  const row = exampleRow(section, data);
  const previous = section.previousRound;
  const before = previous
    ? row.previousCutoff !== null
      ? ` (${row.previousCutoff} in the ${dayText(previous.date)} round)`
      : ` (not listed in the ${dayText(previous.date)} round)`
    : "";
  const tieBreak = row.tieBreak
    ? `, with a tie-break date of ${dayText(row.tieBreak)}`
    : "";
  return `For ${row.name} it was ${row.cutoff}${before}${tieBreak}.`;
}

function lowestScore(
  month: string,
  { section }: Round,
  data: DataSection | null,
): FaqEntry {
  const { lowest, highest } = cutoffBounds(section);
  const spread =
    lowest.score === highest
      ? `${highest} points for every occupation listed.`
      : `It depends on the occupation: from ${lowest.score} to ${highest} points. ${occupationsText(lowest.occupations)} had ${lowest.score} as ${lowest.occupations === 1 ? "its" : "their"} lowest score invited.`;
  return {
    question: `What was the lowest score invited for 189 in ${month}?`,
    answer: `${spread} ${exampleSentence(section, data)}`,
  };
}

function notListedQuestion(facts: RecapFacts): FaqEntry | null {
  const data = facts.data;
  const round = data?.notable189?.round;
  const row = data?.largePoolsNotListed[0];
  if (!round || !row) return null;
  const { name, roundsNotListed: count, lastListed } = row;
  const before = count - 1;
  const earlier =
    before === 0
      ? ""
      : `, or in the ${before === 1 ? "round" : `${before} rounds`} before it`;
  const history = lastListed
    ? `No. ${name} wasn't listed in the ${dayText(round)} round${earlier}. It was last listed on ${dayText(lastListed.date)}, at ${lastListed.cutoff} points.`
    : `No. None of the ${formatNumber(count)} rounds in our data, up to ${dayText(round)}, listed ${name}.`;
  return {
    question: `Was ${name} invited in the ${longDayText(round)} 189 round?`,
    answer: `${history} On ${dayText(monthEnd(facts.month))} its 189 pool held ${formatNumber(row.pool)} EOIs.`,
  };
}

/** Asked only when one state's floor is above every other state's range (spec 6.4). */
function stateMostQuestion(facts: RecapFacts): FaqEntry | null {
  const leader = facts.data && stateLeader(facts.data.states["190"]);
  if (!leader?.strictlyMost) return null;
  return {
    question: `Which state gave the most 190 invitations in ${formatLongMonth(facts.month)}?`,
    answer: `${STATE_NAMES[leader.state]}: at least ${formatNumber(leader.floor)} EOIs held a 190 invitation from it on ${dayText(monthEnd(facts.month))}. These are minimums: the data hides counts under 20 for each occupation.`,
  };
}

function poolQuestion(facts: RecapFacts, data: DataSection): FaqEntry {
  const pool = data.national["189"].submitted.current;
  const about = aboutText(pool);
  const size = about
    ? `About ${about.slice("about ".length)} (${rangeText(pool)}) EOIs were in the 189 pool across all occupations.`
    : `The 189 pool held ${intervalText(pool)} EOIs across all occupations.`;
  const range =
    pool.min === pool.max
      ? ""
      : " The range comes from counts under 20 that the data hides for each occupation.";
  return {
    question: `How many EOIs were in the 189 pool on ${longDayText(monthEnd(facts.month))}?`,
    answer: `${size}${range} One person can hold several EOIs.`,
  };
}

function invited190Question(facts: RecapFacts, data: DataSection): FaqEntry {
  const minimum = minimumText(data.national["190"].invited.current);
  const figure = minimum.charAt(0).toUpperCase() + minimum.slice(1);
  return {
    question: `How many EOIs held a 190 invitation on ${longDayText(monthEnd(facts.month))}?`,
    answer: `${figure}, across all states and occupations. It is a minimum: EOIs that already lodged a visa application are no longer counted, and counts under 20 are hidden.`,
  };
}

/** 3–5 questions generated from the month's facts, ending with the advice disclaimer. */
export function recapFaq(facts: RecapFacts): FaqEntry[] {
  const month = formatLongMonth(facts.month);
  const rounds = roundsNewestFirst(facts);
  const data = facts.data;
  const noRound: FaqEntry | null =
    rounds.length === 0 && data
      ? {
          question: `Was there a 189 round in ${month}?`,
          answer: `${noRoundText(facts)}.`,
        }
      : null;
  const candidates = [
    rounds.length > 0 ? latestRound(month, rounds) : null,
    rounds.length > 0 ? lowestScore(month, rounds[0], data) : null,
    noRound,
    notListedQuestion(facts),
    stateMostQuestion(facts),
    data ? poolQuestion(facts, data) : null,
    data ? invited190Question(facts, data) : null,
  ].filter((entry): entry is FaqEntry => entry !== null);
  return [...candidates.slice(0, MAX_FACT_QUESTIONS), ADVICE];
}
