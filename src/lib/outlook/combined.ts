import type { Visa } from "../data/types";
import { ageRule, blockerOf, expiredItems, expiredPhrase } from "./eligibility";
import type { ProfileOutlook } from "./evaluate-profile";
import type { Improve } from "./improve";
import { MIN_POINTS } from "./label-189";
import { LABEL_RANK } from "./labels";
import type { OutlookLabel } from "./labels";
import { capital, joinAnd, moveLabel } from "./phrases";

/**
 * Copy for the combined stamp (no visa Competitive or better), worded from
 * the three actual labels so the headline and wait never contradict the
 * visa cards below them.
 */

type Row = { visa: Visa; label: OutlookLabel };
type Group = { visas: Visa[]; label: OutlookLabel; text: string };

function rows(o: ProfileOutlook): Row[] {
  return [
    { visa: "189", label: o.v189.label },
    { visa: "190", label: o.v190?.label ?? "no-data" },
    { visa: "491", label: o.v491?.label ?? "no-data" },
  ];
}

/** Visas sharing a text read as one group, best label first, then visa order. */
function grouped(o: ProfileOutlook, textOf: (row: Row) => string): Group[] {
  const groups: Group[] = [];
  for (const row of rows(o)) {
    const text = textOf(row);
    const same = groups.find((g) => g.text === text);
    if (same) same.visas.push(row.visa);
    else groups.push({ visas: [row.visa], label: row.label, text });
  }
  const rank = (g: Group) => LABEL_RANK.indexOf(g.label);
  return groups.sort((a, b) => rank(a) - rank(b));
}

function clause(o: ProfileOutlook, row: Row, many: boolean): string {
  const is = many ? "are" : "is";
  const isnt = many ? "aren't" : "isn't";
  switch (row.label) {
    case "long-wait":
      return `${is} a long wait at your points`;
    case "not-invited":
      return `${isnt} inviting your occupation`;
    case "not-open":
      return `${isnt} open to you`;
    case "not-eligible":
      return row.visa === "189"
        ? `needs ${MIN_POINTS - o.points.base} more points`
        : `${isnt} open to you yet`;
    default:
      return many ? "have no published data" : "has no published data";
  }
}

/** "190 and 491 are a long wait at your points, while 189 isn't inviting your occupation." */
function labelSentence(o: ProfileOutlook): string {
  const groups = grouped(o, (row) => clause(o, row, false));
  const said = groups.map((g) => {
    const many = g.visas.length > 1;
    return `${joinAnd(g.visas)} ${clause(o, { visa: g.visas[0], label: g.label }, many)}`;
  });
  const [lead, ...rest] = said;
  const tail = rest.length > 0 ? `, while ${joinAnd(rest)}` : "";
  return `${capital(lead)}${tail}.`;
}

/** The h1 for a combined long-wait or not-eligible stamp. */
export function combinedH1(o: ProfileOutlook): string {
  const reasons = o.points.ineligibleReasons;
  if (o.v189.label === "not-eligible") {
    const blocker = blockerOf(o.points);
    if (blocker === "age") return `189, 190 and 491 all ${ageRule(reasons)}.`;
    if (blocker === "expired") {
      const many = expiredItems(reasons).length > 1;
      const verb = many ? "have" : "has";
      const one = many ? "valid ones" : "a valid one";
      return `${capital(expiredPhrase(reasons))} ${verb} expired, and 189, 190 and 491 all need ${one}.`;
    }
  }
  if (rows(o).every((r) => r.label === "long-wait")) {
    return "Every visa is a long wait at your points right now.";
  }
  return labelSentence(o);
}

function waitPhrase(row: Row): string {
  switch (row.label) {
    case "long-wait":
      return "unlikely without more points";
    case "not-invited":
      return row.visa === "189"
        ? "no invitations to measure"
        : "no recent invitations";
    case "not-open":
      return "not open to you";
    case "not-eligible":
      return row.visa === "189"
        ? `not possible until you reach ${MIN_POINTS}`
        : "not possible yet";
    default:
      return "no data to estimate from";
  }
}

/** The estimated wait for a combined stamp, or null when one sentence covers it. */
export function combinedWait(o: ProfileOutlook): string | null {
  const reasons = o.points.ineligibleReasons;
  const { label } = o.stamp;
  if (o.v189.label === "not-eligible" && label === "not-eligible") {
    const blocker = blockerOf(o.points);
    if (blocker === "age") {
      return reasons.includes("age under 18")
        ? "Not possible until you're 18, and points can't change that."
        : "Not possible at 45 or over, and points can't change that.";
    }
    if (blocker === "expired") {
      const items = expiredItems(reasons);
      const act = items.includes("English test")
        ? "retake your English test"
        : "renew your skills assessment";
      const both = items.length > 1 ? " and renew your skills assessment" : "";
      const one =
        items.length > 1
          ? "valid ones are basic requirements"
          : "a valid one is a basic requirement";
      return `Not possible until you ${act}${both}: ${one}, not a points question.`;
    }
  }
  // Not invited keeps the spec 6.5 text ("No 189 invitations to measure.").
  if (label === "not-open") {
    return "None of the three visas is open to you, so there's no wait to measure.";
  }
  if (label !== "long-wait" && label !== "not-eligible") return null;
  const groups = grouped(o, waitPhrase);
  if (groups.length === 1) return `${capital(groups[0].text)}.`;
  return groups.map((g) => `${joinAnd(g.visas)}: ${g.text}.`).join(" ");
}

/**
 * What reaching 65 means for 189. It opens 189 only when 189 is inviting the
 * occupation; otherwise the reader can submit an EOI, but nothing more
 * (ruling R34).
 */
function openerOutcome(after: OutlookLabel): string {
  const submit = ", so you can submit an EOI, though";
  if (after === "not-invited")
    return `${submit} 189 isn't inviting your occupation.`;
  if (after === "no-data") {
    return `${submit} there isn't enough published 189 data to read your position.`;
  }
  return ", which opens 189.";
}

/** The best-route line for a combined stamp when 189 isn't eligible yet. */
export function notEligibleBest(o: ProfileOutlook, improve: Improve): string {
  const reasons = o.points.ineligibleReasons;
  const blocker = blockerOf(o.points);
  if (blocker === "age")
    return `None: 189, 190 and 491 all ${ageRule(reasons)}.`;
  const opener = improve.opener;
  if (opener) {
    const reach = `None yet. ${capital(moveLabel(opener))} would take you to ${opener.to.points} points`;
    return `${reach}${openerOutcome(opener.to.label)}`;
  }
  if (blocker === "expired") {
    return `None yet. Renew ${expiredPhrase(reasons)} first: it's a basic requirement.`;
  }
  return `None yet. You need ${MIN_POINTS - o.points.base} more points to reach ${MIN_POINTS}.`;
}

/** The fact line when a basic requirement, not points, closes every visa. */
export function blockerFact(reasons: string[]): string {
  const closed =
    "you can't be invited for 189, 190 or 491, whatever your points";
  if (reasons.includes("age under 18")) return `Under 18 ${closed}.`;
  if (reasons.includes("age 45 or over")) return `At 45 or over ${closed}.`;
  return `Without a valid ${expiredItems(reasons).join(" or ")} ${closed}.`;
}
