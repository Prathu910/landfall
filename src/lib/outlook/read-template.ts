import { DEADLINE } from "./facts";
import { MIN_POINTS } from "./label-189";
import { lowerFirst, theStateName } from "./phrases";
import type { ReportFacts } from "./read-contract";

type Visa = ReportFacts["visas"][number];
type Change = ReportFacts["changes"][number];

const MAX_WORDS = 110;
const SUITS = ["Very strong", "Strong", "Competitive"];

function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

function gains(facts: ReportFacts): Change[] {
  return facts.changes.filter((c) => c.toPoints > c.fromPoints);
}

function losses(facts: ReportFacts): Change[] {
  return facts.changes.filter((c) => c.toPoints <= c.fromPoints);
}

/** The state visa to mention beside 189: competitive or better, 190 first on a tie. */
function stateBackup(facts: ReportFacts): Visa | null {
  const named = facts.visas
    .slice(1)
    .filter((v) => v.state !== null && SUITS.includes(v.label));
  named.sort((a, b) => SUITS.indexOf(a.label) - SUITS.indexOf(b.label));
  return named[0] ?? null;
}

function gainSentence(facts: ReportFacts, change: Change): string {
  const added = change.toPoints - change.fromPoints;
  const v189 = facts.visas[0];
  if (change.toLabel === v189.label && v189.label === "Not currently invited") {
    return `${change.title} would take you to ${change.toPoints}, and 189 would still be ${change.toLabel}.`;
  }
  return `Your biggest jump is ${change.title}: it adds ${added} points and puts you at ${change.toPoints}, which reads as ${change.toLabel} for 189.`;
}

function lossSentence(change: Change): string {
  const when = `${change.title} in ${change.month}`;
  if (change.toPoints === change.fromPoints) {
    return `Watch your dates: ${lowerFirst(when)}.`;
  }
  return `Watch your dates: ${lowerFirst(when)}, which leaves you at ${change.toPoints} points (${change.toLabel}).`;
}

/** For combined stamps, whose route steps are short actions. */
function nextSteps(facts: ReportFacts): string | null {
  if (facts.stamp.state !== null || facts.stamp.visa === "189") return null;
  const steps = facts.route
    .filter((s) => !s.startsWith(DEADLINE))
    .filter((s) => !s.startsWith("Today") && !s.startsWith("EOI submitted"))
    .map(lowerFirst);
  if (steps.length === 0) return null;
  return `Next steps: ${steps.slice(0, -1).join(", ")}${steps.length > 1 ? " and " : ""}${steps[steps.length - 1]}.`;
}

function lead189(facts: ReportFacts, lodged: boolean): string[] {
  const v189 = facts.visas[0];
  const first = gains(facts)[0];
  const backup = stateBackup(facts);
  const sentences: string[] = [];
  if (v189.label === "Very strong") {
    sentences.push(
      "You don't need more points. Submit your EOI now and get your documents ready: once you're invited, you have 60 days to lodge.",
    );
  } else if (lodged) {
    sentences.push(
      `Your EOI is already in the 189 queue at ${v189.points} points, which reads as ${v189.label}.`,
    );
  } else {
    sentences.push(`At ${v189.points} points you're ${v189.label} for 189.`);
  }
  if (first) sentences.push(gainSentence(facts, first));
  if (first && lodged) {
    sentences.push("Updating your EOI resets your date of effect to that day.");
  }
  if (backup) {
    sentences.push(
      `With nomination you'd have ${backup.points} points for ${backup.visa} in ${theStateName(backup.state ?? "")}, which is ${backup.label}.`,
    );
  }
  return sentences;
}

function leadState(facts: ReportFacts): string[] {
  const [v189, ...states] = facts.visas;
  const stamped = states.find((v) => v.visa === facts.stamp.visa) ?? states[0];
  const first = gains(facts)[0];
  const sentences: string[] = [];
  if (v189.label === "Not currently invited") {
    sentences.push(
      `More points won't fix this while 189 isn't inviting your occupation. ${v189.caption}`,
    );
  } else if (v189.label === "Not eligible yet") {
    sentences.push(v189.caption);
  } else {
    sentences.push(`For 189, ${lowerFirst(v189.caption)}`);
  }
  sentences.push(
    `Your way in now is ${stamped.visa} in ${theStateName(stamped.state ?? "")}: with nomination you'd have ${stamped.points} points. ${stamped.caption}`,
  );
  if (first) sentences.push(gainSentence(facts, first));
  return sentences;
}

function leadCombined(facts: ReportFacts): string[] {
  const [v189, v190] = facts.visas;
  const { label } = facts.stamp;
  if (label === "Not enough data" || label === "Too few to count") {
    const pass = v189.points >= MIN_POINTS ? "above" : "under";
    return [
      `There isn't enough published data to compare you with other EOIs for ${facts.occupation}.`,
      `Your ${v189.points} points are ${pass} the ${MIN_POINTS} pass mark.`,
      v190.caption,
      "With so little data, whether a state wants your skills may matter more than your score.",
    ];
  }
  if (label === "Not currently invited") {
    return [
      `Your points aren't the problem: no visa is inviting ${facts.occupation} right now.`,
      v189.caption,
      "Keep your EOI in, because it costs nothing and rounds can change.",
    ];
  }
  const first = gains(facts)[0];
  return [
    `None of the three visas is Competitive or better at your ${v189.points} points.`,
    v189.caption,
    ...(first ? [gainSentence(facts, first)] : []),
  ];
}

function leadSentences(facts: ReportFacts): string[] {
  const lodged = facts.route[0]?.startsWith("EOI submitted") ?? false;
  if (facts.stamp.visa === "189") return lead189(facts, lodged);
  if (facts.stamp.state !== null) return leadState(facts);
  return leadCombined(facts);
}

/**
 * The deterministic "Our read" (spec 6.9): used for samples, when AI is off,
 * slow or fails, and in tests. It quotes only the facts, so it always passes
 * checkRead. Optional sentences are added while the read stays short enough.
 */
export function readTemplate(facts: ReportFacts): string {
  const [loss] = losses(facts);
  const optional = [
    loss ? lossSentence(loss) : null,
    nextSteps(facts),
    `Estimated wait: ${facts.wait}`,
    `This read uses published SkillSelect figures up to ${facts.dataMonth}.`,
  ].filter((s): s is string => s !== null);
  let text = leadSentences(facts).join(" ");
  for (const sentence of optional) {
    const next = `${text} ${sentence}`;
    if (wordCount(next) <= MAX_WORDS) text = next;
  }
  return text;
}
