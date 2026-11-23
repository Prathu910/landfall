// The methodology page's source list and definitions, kept apart so the
// page file stays readable.

export type MethodSource = { name: string; description: string; url: string };

export function methodSources(dashboardUrl: string): MethodSource[] {
  return [
    {
      name: "SkillSelect EOI dashboard",
      description:
        "31 October 2026 · 189, 190 and state 491 submitted pools · twelve monthly 189 occupation totals",
      url: dashboardUrl,
    },
    {
      name: "Federal points table",
      description: "Current category values and qualifying conditions",
      url: "https://immi.homeaffairs.gov.au/supporting/Pages/Work/190-points-table.aspx",
    },
    {
      name: "SkillSelect invitation rounds",
      description: "Published round results and invitation process",
      url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds",
    },
    {
      name: "Skills assessment guidance",
      description: "Validity periods, the three-year cap and exceptions",
      url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment",
    },
    {
      name: "English evidence",
      description: "Accepted tests, score thresholds and date-dependent rules",
      url: "https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language",
    },
    {
      name: "EOI validity",
      description: "Two-year active period and keeping details up to date",
      url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/expression-of-interest/after-you-submit-your-expression-of-interest",
    },
    {
      name: "Home Affairs licensing",
      description: "Attribution and exclusions for government material",
      url: "https://www.homeaffairs.gov.au/access-and-accountability/using-our-website/copyright-and-disclaimer",
    },
  ];
}

export const METHOD_DEFINITIONS: [string, string][] = [
  [
    "EOI",
    "An Expression of Interest records interest in a skilled visa through SkillSelect. It is not a visa application.",
  ],
  [
    "Date of effect",
    "The date and time associated with an EOI’s points score for ranking purposes. It may change when the score changes. It is not necessarily the original submission date.",
  ],
  [
    "Pool snapshot",
    "A dated picture of published EOI counts. It is not a live queue and may include multiple EOIs from the same person.",
  ],
  [
    "Invitation cutoff",
    "The lowest score published for an occupation in a particular invitation round. It does not establish a future cutoff or your invitation prospects.",
  ],
  [
    "State nomination",
    "A separate selection process conducted by a state or territory. Federal points alone do not establish nomination eligibility.",
  ],
  [
    "491 and permanent residence",
    "Subclass 491 is a provisional regional visa. A later permanent residence pathway, such as subclass 191, has separate requirements.",
  ],
];
