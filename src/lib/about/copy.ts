import type { LegalParagraph } from "../legal/copy";
import { SELLER } from "../orders/seller";

/**
 * The About page (audit A-P1-2, ruling R7): who runs MigrateLens, how it
 * earns, its data and editorial policy, corrections and the not-advice line.
 * Every statement repeats a fact already in docs/STRATEGY.md or on the site
 * (the homepage's "Conditions of this report", /contact/, /methodology/): no
 * names, bios, testimonials, user counts or prices. It is the Organization's
 * publishingPrinciples page (src/lib/seo/json-ld.ts).
 */
export type AboutSection = {
  /** The section's anchor, e.g. "#editorial". */
  id: string;
  heading: string;
  paragraphs: LegalParagraph[];
};

export const ABOUT_INTRO =
  "MigrateLens is an independent information site for Australian skilled migration. It compares points for the 189, 190 and 491 visas with published SkillSelect data from the Department of Home Affairs, and says plainly what that data shows.";

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: "who",
    heading: "Who runs MigrateLens",
    paragraphs: [
      `MigrateLens is run from ${SELLER.city}, ${SELLER.country}, by a skilled migrant who went through Australian skilled migration and paid an agency for a PR report that said only “you qualify, submit and hope”. MigrateLens is the frank, data-first reading that report didn’t give.`,
      "The founder doesn’t publish a name for now. Trust comes from what can be checked instead: an open methodology, a dated source for every figure and a public monthly changelog.",
    ],
  },
  {
    id: "independence",
    heading: "Independence and how MigrateLens earns",
    paragraphs: [
      "MigrateLens is not a migration agency and earns nothing from telling readers what they want to hear. The points check and its result are free, with no account or email.",
      {
        before:
          "Its income is the personal PR report, bought once with no subscription, and free for founding readers while places last. Prices come only from the checkout, and the",
        link: { href: "/terms/", text: "terms of sale" },
        after: " cover what the report is.",
      },
      "MigrateLens has no agency, referral or commission arrangements. If affiliate links are ever added, they will be marked as such where they appear.",
    ],
  },
  {
    id: "editorial",
    heading: "Data and editorial policy",
    paragraphs: [
      "Figures come only from published sources: the SkillSelect EOI dashboard and invitation rounds from Home Affairs, the Home Affairs visa and points pages, and each state and territory’s own nomination pages.",
      "SkillSelect masks counts under 20 as “<20”; MigrateLens keeps each one as a range of 0 to 19, which may be zero, and never turns it into a single number. Counts are EOIs (expressions of interest), not individuals: one person can hold several. A round that didn’t list an occupation shows “Not listed”, never a cut-off of zero.",
      "MigrateLens publishes no percentage chances. Labels, waits and other estimates are computed in code from published history and marked as estimates. If a report’s summary is worded by AI, the AI only words facts the code has already computed; it never decides a label or a number.",
      "Every fee and rule is taken by hand from the official page, with the date it was checked. Where a page couldn’t be read, the site says “Check current fee” and links the page instead of guessing.",
      {
        before: "The full method, its sources and its limits are on the",
        link: { href: "/methodology/", text: "methodology page" },
        after: ".",
      },
    ],
  },
  {
    id: "updates",
    heading: "How the data is updated",
    paragraphs: [
      "New SkillSelect data is imported each month and each new 189 round as it is published. Every data change is reviewed by the founder before it goes live, and the import keeps the published figures exactly as Home Affairs shows them.",
      {
        before: "Each month’s changes are written up in the",
        link: { href: "/updates/", text: "monthly updates" },
        after: ", the site’s public changelog.",
      },
    ],
  },
  {
    id: "corrections",
    heading: "Corrections",
    paragraphs: [
      `Found an error? Email ${SELLER.email} with the page link and what looks wrong. Confirmed errors are corrected, and the page’s updated date changes with the correction.`,
    ],
  },
  {
    id: "not-advice",
    heading: "Information, not migration advice",
    paragraphs: [
      {
        before:
          "MigrateLens gives general information from published data. It is not a registered migration agent and doesn’t give migration advice. For advice on your own case, find a registered migration agent on the",
        link: { href: "https://www.mara.gov.au/", text: "OMARA register" },
        after: ", or talk to a lawyer.",
      },
    ],
  },
];

/** The page's text, for copy checks. */
export function aboutText(): string[] {
  const text = (p: LegalParagraph) =>
    typeof p === "string" ? p : `${p.before} ${p.link.text}${p.after}`;
  return [
    ABOUT_INTRO,
    ...ABOUT_SECTIONS.flatMap((s) => [s.heading, ...s.paragraphs.map(text)]),
  ];
}
