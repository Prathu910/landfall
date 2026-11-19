import type { MonthKey } from "../data/types";
import { formatMonth } from "../report/copy";

/**
 * The homepage's words. The headline, lede, doors and story are the
 * founder-approved wording (spec, "Homepage"); everything here follows the
 * report copy rules (`BANNED_COPY`) and says "points-test basics", never
 * "eligibility".
 */
export const HOME_COPY = {
  headline: "Know your points. See where they'd put you.",
  lede: "Count your points, check the points-test basics, then see the EOIs ahead of you and what happened to EOIs like yours. From official SkillSelect data, free.",
  /** Both doors open the same check; the action's arrow is drawn, not read. */
  doors: [
    {
      id: "planning",
      tag: "Not lodged an EOI yet",
      title: "Am I ready, and is it worth it?",
      body: "Your points, what could add more, and where an EOI at your score would sit today.",
      action: "Check my points",
    },
    {
      id: "lodged",
      tag: "Already lodged",
      title: "Where does my EOI stand?",
      body: "The EOIs ahead of you, the ones at your score, and what happened to EOIs lodged when yours was.",
      action: "Check where I stand",
    },
  ],
  questions: {
    heading: "Three questions the report answers",
    lede: "Each answer comes from published SkillSelect data. These are from the sample report, so you can see what yours will look like.",
    stand: {
      title: "Where do I stand?",
      body: "The 189 EOIs for your occupation with a higher score than yours, at your score, and below it.",
      link: "Open “Where you stand” in the sample report",
    },
    outcomes: {
      title: "What happened to EOIs like mine?",
      body: "EOIs submitted in the same month as yours: how many were invited, lodged a visa, are still waiting or closed.",
      link: "Open “What happened to EOIs like yours”",
    },
    states: {
      title: "Which states have evidence for me?",
      body: "Each state's nomination rules read against your answers, grouped by the evidence each state has published.",
      link: "Open the state outlook in the sample report",
    },
  },
  story: {
    label: "Why we built it",
    title: "65 points is the pass mark, not a promise.",
    body: "Reach 65 points and you'll often hear the same answer: yes, you can apply, now pay the fees, sometimes lakhs of rupees. What you rarely hear is how many EOIs are ahead of you, or how long EOIs like yours have waited. We built MigrateLens so you can see that first, from official data, before you commit to anything.",
  },
  rules: {
    heading: "Our rules",
    items: [
      "Official data, with dates and sources.",
      "No percentages or invented numbers.",
      "Your answers stay in your browser.",
      "General information, not migration advice.",
    ],
    link: "Read how we use the data",
  },
  faqHeading: "Common questions",
  finalCta: {
    heading: "See your own numbers",
    body: "Four short steps. No account, and your answers stay in your browser.",
    action: "Check my points, free",
    sample: "Or read the sample report first",
  },
} as const;

/** The hero's three trust points, dated from the snapshot's as-at month. */
export function trustLine(asAt: MonthKey): string[] {
  return [
    `SkillSelect data, as at ${formatMonth(asAt)}`,
    "No percentages",
    "Stays in your browser",
  ];
}

/** Under each sample visual, so its numbers read as an example. */
export function sampleCaption(
  occupation: string,
  visa: string,
  points: number,
): string {
  return `Example from the sample report: ${occupation}, ${visa} at ${points} points.`;
}
