import { PASS_MARK } from "../../data/guide/points-table";
import type { MonthKey } from "../data/types";
import { formatMonth } from "../report/copy";
import type { StateFacts } from "./facts";
import type { StatePageView } from "./view";

/** The state page's fixed method notes and section headings (split from view.ts). */

export function method(
  facts: StateFacts,
  recapMonths: readonly MonthKey[],
): StatePageView["method"] {
  const recap = recapMonths.includes(facts.asAt)
    ? {
        text: `${formatMonth(facts.asAt)} monthly update`,
        href: `/updates/${facts.asAt}/`,
      }
    : { text: "Monthly updates", href: "/updates/" };
  return {
    notes: [
      "Month-end stock, not new invitations: an EOI stays in the count from the day it is invited until it lodges a visa application or the invitation lapses, so the months overlap and are never added together.",
      'SkillSelect hides every count under 20 for an occupation and score. Hidden counts are drawn hatched and may be zero; each figure here is a lower bound ("at least"), plus the hidden range.',
      "Counts are EOIs, not individuals. One EOI can name several states, so states are never added to each other, and EOIs whose state is not recorded are never added to a state.",
      "Home Affairs' nominations table is a different measure, for the program year to date; it is shown beside the SkillSelect data and never reconciled with it.",
      'State rules are read by hand from official pages and dated. "Rules being checked" means our check has not yet confirmed a rule on the official page.',
    ],
    links: [
      { text: "How to read the pool", href: "/methodology/#pool" },
      { text: "Sources and limits", href: "/methodology/#sources" },
      recap,
      { text: "190 guide", href: "/guide/190/" },
      { text: "491 guide", href: "/guide/491/" },
      { text: "Glossary: EOI", href: "/guide/glossary/#eoi" },
      { text: "Glossary: “<20”", href: "/guide/glossary/#masked-count" },
      { text: "Glossary: invited", href: "/guide/glossary/#invited" },
    ],
  };
}

export function sectionTitles(
  name: string,
  withA: string,
  programYear: string,
): StatePageView["titles"] {
  return {
    glance: `${name} 190 and 491 in numbers`,
    months: `EOIs holding ${name} invitations, month by month`,
    points: {
      title: `Points of EOIs holding ${name} invitations`,
      lead: `The scores of EOIs holding ${withA} 190 or 491 invitation on the last day of the data month. The federal pass mark is ${PASS_MARK}; scores include the nomination points.`,
    },
    occupations: {
      title: `Which occupations hold ${name} invitations?`,
      lead: `Occupations with a published count (20 or more at some score) of EOIs holding ${withA} invitation in the last 12 months, highest first. A count shows which EOIs held an invitation, not which will get one.`,
      listLink: `Is your occupation on ${name}'s list? Open its occupation page`,
    },
    program: `${name}'s ${programYear} program`,
    faq: `${name} 190 and 491 questions`,
  };
}
