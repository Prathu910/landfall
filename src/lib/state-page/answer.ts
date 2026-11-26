import { formatDate } from "../migration";
import { leastText, longDayText, monthEnd } from "../updates/format";
import { figureText, hasFloor, withArticle } from "./copy";
import type { StateFacts } from "./facts";
import { nominationText } from "./nominations";

function evidenceSentence(facts: StateFacts): string {
  const { code, searchName } = facts.page;
  const day = longDayText(monthEnd(facts.asAt));
  const a = withArticle(code, searchName);
  const v190 = facts.visas["190"].latest;
  const v491 = facts.visas["491"].latest;
  if (hasFloor(v190) && hasFloor(v491)) {
    return `On ${day}, SkillSelect data showed ${figureText(v190)} EOIs holding ${a} 190 invitation and ${figureText(v491)} holding ${a} 491 invitation.`;
  }
  if (hasFloor(v190) || hasFloor(v491)) {
    const [shown, other] = hasFloor(v190)
      ? (["190", "491"] as const)
      : (["491", "190"] as const);
    const otherCell = facts.visas[other].latest;
    return `On ${day}, SkillSelect data showed ${figureText(facts.visas[shown].latest)} EOIs holding ${a} ${shown} invitation; ${searchName} ${other} counts were ${figureText(otherCell)}.`;
  }
  return `On ${day}, every SkillSelect count of EOIs holding ${a} 190 or 491 invitation was ${figureText(v190)}.`;
}

function pointsSentence(facts: StateFacts): string {
  const visa = facts.visas["190"].lowestScore !== null ? "190" : "491";
  const { lowestScore, top } = facts.visas[visa];
  if (lowestScore === null) {
    return `Every ${facts.page.searchName} 190 and 491 count was under 20 for each occupation and score, so no points level can be read from them.`;
  }
  const leader = top.rows[0];
  const leaderText =
    leader?.latest && leader.latest.min > 0
      ? `, and ${leader.name} had the highest published count (${leastText(leader.latest)})`
      : "";
  return `The lowest score with a published ${visa} count was ${lowestScore} points${leaderText}.`;
}

function nominationsSentence(facts: StateFacts): string | null {
  const n = facts.nominations;
  if (!n) return null;
  const from = formatDate(n.from).replace(/ \d{4}$/, "");
  return `Home Affairs counted ${nominationText(n.byVisa["190"].text)} ${facts.page.searchName} 190 and ${nominationText(n.byVisa["491"].text)} 491 nominations from ${from} to ${formatDate(n.to)}, a different measure.`;
}

/** The page's opening: two or three dated sentences, every number from the facts. */
export function stateAnswer(facts: StateFacts): string[] {
  return [
    evidenceSentence(facts),
    pointsSentence(facts),
    nominationsSentence(facts),
  ].filter((s): s is string => s !== null);
}

/** The source line under the answer. */
export function stateSourceLine(facts: StateFacts): string {
  const n = facts.nominations;
  const data = `Source: SkillSelect EOI data, Department of Home Affairs, as at ${formatDate(monthEnd(facts.asAt))}, checked ${formatDate(facts.manifest.checkedAt)}`;
  return n
    ? `${data}; nominations from the invitation rounds page of ${formatDate(n.roundDate)}.`
    : `${data}.`;
}
