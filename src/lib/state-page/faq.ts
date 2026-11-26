import type { StateCode, StateVisa } from "../data/types";
import { formatDate, NOMINATION_POINTS } from "../migration";
import type { FaqEntry } from "../seo/json-ld";
import { joinWords } from "../state-outlook/context";
import { leastText, longDayText, monthEnd } from "../updates/format";
import { poolText, withArticle } from "./copy";
import type { StateFacts } from "./facts";
import { nominationText } from "./nominations";
import type { SelectionLine } from "./program";

const PASS_MARK = 65;
const TOP_IN_ANSWER = 3;

/** States whose own ranking system gets its own question (spec 10). */
const SCORE_QUESTIONS: Partial<Record<StateCode, string>> = {
  ACT: "Does the ACT use the Canberra Matrix?",
  VIC: "What is the Victorian Points Test?",
  TAS: "How does Tasmania rank 190 and 491 ROIs?",
};

function checkedPhrase(line: Pick<SelectionLine, "checked" | "verified">) {
  return line.verified
    ? `Checked ${formatDate(line.checked)}.`
    : `Checked ${formatDate(line.checked)}; not yet verified on the official page.`;
}

function selectionFor(facts: StateFacts, visa: StateVisa) {
  return facts.selection.find((line) => line.visa === visa);
}

function pointsFaq(facts: StateFacts, visa: StateVisa): FaqEntry {
  const { searchName, code } = facts.page;
  const day = longDayText(monthEnd(facts.asAt));
  const lowest = facts.visas[visa].lowestScore;
  const evidence =
    lowest === null
      ? `On ${day}, every ${searchName} ${visa} count of EOIs holding an invitation was under 20 for each occupation and score, so the SkillSelect data shows no points level.`
      : `On ${day}, the lowest score with a published count of EOIs holding ${withArticle(code, searchName)} ${visa} invitation was ${lowest} points (SkillSelect EOI data); counts under 20 are hidden, so lower scores can't be ruled out.`;
  const selection = selectionFor(facts, visa);
  return {
    question: `How many points do I need for ${searchName} ${visa}?`,
    answer: [
      `The federal pass mark is ${PASS_MARK} points, and a ${visa} nomination adds ${NOMINATION_POINTS[visa]} points that count towards it.`,
      evidence,
      selection ? `${selection.text} ${checkedPhrase(selection)}` : null,
    ]
      .filter((s): s is string => s !== null)
      .join(" "),
  };
}

function openFaq(facts: StateFacts): FaqEntry {
  const { searchName } = facts.page;
  const year = "2026–27";
  const parts = facts.card.visas.map(({ visa, lines }) => {
    if (lines[0]?.status === "checking") {
      return `${visa}: rules being checked; we haven't confirmed ${searchName}'s ${year} ${visa} status on the official page yet`;
    }
    const text = lines
      .map((line) => (line.who ? `${line.label} (${line.who})` : line.label))
      .join("; ");
    return `${visa}: ${text}`;
  });
  return {
    question: `Is ${searchName} 190 or 491 open in ${year}?`,
    answer: `${parts.join(". ")}. Checked ${formatDate(facts.rulesCheckedAt)} on the official program pages (${facts.card.url}).`,
  };
}

function nominationsFaq(facts: StateFacts): FaqEntry | null {
  const n = facts.nominations;
  if (!n) return null;
  const { searchName, code } = facts.page;
  const year = n.programYear.replace("-", "–");
  const latest = facts.visas["190"].latest;
  const stock =
    latest && latest.total.min > 0
      ? ` SkillSelect's month-end data is a different measure: at least ${latest.total.min.toLocaleString("en-AU")} EOIs held ${withArticle(code, searchName)} 190 invitation on ${longDayText(monthEnd(facts.asAt))}.`
      : " SkillSelect's month-end count of EOIs holding an invitation is a different measure.";
  return {
    question: `How many 190 and 491 nominations has ${searchName} made in ${year}?`,
    answer: `Home Affairs counted ${nominationText(n.byVisa["190"].text)} 190 and ${nominationText(n.byVisa["491"].text)} 491 nominations for ${searchName} from ${formatDate(n.from)} to ${formatDate(n.to)} (invitation rounds page, ${formatDate(n.roundDate)}).${stock}`,
  };
}

function occupationsFaq(facts: StateFacts, visa: StateVisa): FaqEntry | null {
  const { searchName, code } = facts.page;
  const { top, list } = facts.visas[visa];
  const named = top.rows.flatMap((row) =>
    row.latest && row.latest.min > 0
      ? [`${row.name} (${leastText(row.latest)})`]
      : [],
  );
  if (named.length === 0) return null;
  const count = top.withPublished;
  const listLine = list
    ? ` ${searchName}'s 2026–27 list has ${list.count} occupations for ${visa} (imported ${formatDate(list.checkedAt)}).`
    : "";
  return {
    question: `Which occupations hold ${searchName} ${visa} invitations?`,
    answer: `SkillSelect EOI data for ${longDayText(monthEnd(facts.asAt))} shows the highest published counts of EOIs holding ${withArticle(code, searchName)} ${visa} invitation for ${joinWords(named.slice(0, TOP_IN_ANSWER), "and")}. ${count} ${count === 1 ? "occupation" : "occupations"} had a count of 20 or more in at least one of the last 12 months. A count shows which EOIs held an invitation, not which will get one.${listLine}`,
  };
}

function poolFaq(facts: StateFacts): FaqEntry | null {
  const { searchName } = facts.page;
  const p190 = facts.visas["190"].pool;
  const p491 = facts.visas["491"].pool;
  if (p190 === null && p491 === null) return null;
  return {
    question: `How many EOIs are waiting for ${searchName} 190 and 491?`,
    answer: `On ${longDayText(monthEnd(facts.asAt))}, ${poolText(p190)} EOIs in the SkillSelect pool named ${searchName} for 190 and ${poolText(p491)} for 491 (SkillSelect EOI data). They are EOIs, not individuals: one EOI can name several states, so the states can't be added together.`,
  };
}

function scoreSystemFaq(facts: StateFacts): FaqEntry | null {
  const question = SCORE_QUESTIONS[facts.page.code];
  const line = facts.selection.find((l) => l.scoreSystem !== null);
  if (!question || !line?.scoreSystem) return null;
  return {
    question,
    answer: `${line.text} ${checkedPhrase(line)} It is separate from the federal points test. Official page: ${line.scoreSystem.url}`,
  };
}

/** Each question only when its data exists; never answered with a guess. */
export function stateFaq(facts: StateFacts): FaqEntry[] {
  return [
    pointsFaq(facts, "190"),
    pointsFaq(facts, "491"),
    openFaq(facts),
    nominationsFaq(facts),
    occupationsFaq(facts, "190"),
    occupationsFaq(facts, "491"),
    poolFaq(facts),
    scoreSystemFaq(facts),
  ].filter((entry): entry is FaqEntry => entry !== null);
}
