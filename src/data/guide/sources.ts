// The official pages the PR guide cites, read on GUIDE_CHECKED_AT (research:
// docs/research/pr-guide-2026-11.md). One constant per page, used everywhere.
export const GUIDE_CHECKED_AT = "2026-11-23";

const HA = "https://immi.homeaffairs.gov.au";
const LISTING = `${HA}/visas/getting-a-visa/visa-listing`;

export const SOURCES = {
  visa189: `${LISTING}/skilled-independent-189/points-tested`,
  visa190: `${LISTING}/skilled-nominated-190`,
  visa491: `${LISTING}/skilled-work-regional-provisional-491/application`,
  visa191: `${LISTING}/skilled-regional-191/regional-provisional`,
  pointsTable: `${LISTING}/skilled-independent-189/points-table`,
  pointsTable190: `${LISTING}/skilled-nominated-190/points-table`,
  pointsTable491: `${LISTING}/skilled-work-regional-provisional-491/points-table`,
  occupationList: `${HA}/visas/working-in-australia/skill-occupation-list`,
  skillsAssessment: `${HA}/visas/working-in-australia/skills-assessment`,
  competentEnglish: `${HA}/help-support/meeting-our-requirements/english-language/competent-english`,
  skillSelect: `${HA}/visas/working-in-australia/skillselect`,
  health: `${HA}/help-support/meeting-our-requirements/health`,
  character: `${HA}/help-support/meeting-our-requirements/character`,
  regionalAreas: `${HA}/visas/working-in-australia/regional-migration/eligible-regional-areas`,
  pricing: `${HA}/visas/getting-a-visa/fees-and-charges/current-visa-pricing`,
  pricingEstimator: `${HA}/visas/visa-pricing-estimator`,
  processingTimes: `${HA}/visas/getting-a-visa/visa-processing-times/global-visa-processing-times`,
  whoCanHelp: `${HA}/help-support/who-can-help-with-your-application/overview`,
  budget: "https://budget.gov.au/content/bp2/download/bp2_2026-27.pdf",
  ministerSpeech:
    "https://minister.homeaffairs.gov.au/TonyBurke/Pages/speech-national-press-club-17092026.aspx",
} as const;

/** The date each Home Affairs page showed as "Last updated" when we read it. */
export const PAGE_UPDATED: Partial<Record<keyof typeof SOURCES, string>> = {
  visa189: "2026-11-05",
  visa190: "2026-11-10",
  visa491: "2026-11-10",
  visa191: "2026-11-05",
  pointsTable: "2026-11-04",
  competentEnglish: "2026-09-21",
  skillSelect: "2026-11-18",
  skillsAssessment: "2026-10-12",
  pricing: "2026-07-01",
};

/** How each official page is named in the guide's sources list. */
export const SOURCE_LABELS: Record<keyof typeof SOURCES, string> = {
  visa189: "Home Affairs: Skilled Independent visa (189), Points-tested",
  visa190: "Home Affairs: Skilled Nominated visa (190)",
  visa491: "Home Affairs: Skilled Work Regional (Provisional) visa (491)",
  visa191: "Home Affairs: Permanent Residence (Skilled Regional) visa (191)",
  pointsTable: "Home Affairs: points table (189)",
  pointsTable190: "Home Affairs: points table (190)",
  pointsTable491: "Home Affairs: points table (491)",
  occupationList: "Home Affairs: skilled occupation list",
  skillsAssessment: "Home Affairs: skills assessment",
  competentEnglish: "Home Affairs: competent English",
  skillSelect: "Home Affairs: SkillSelect",
  health: "Home Affairs: health requirement",
  character: "Home Affairs: character requirement",
  regionalAreas: "Home Affairs: designated regional areas",
  pricing: "Home Affairs: current visa pricing table",
  pricingEstimator: "Home Affairs: Visa Pricing Estimator",
  processingTimes: "Home Affairs: visa processing times guide",
  whoCanHelp: "Home Affairs: who can help with your application",
  budget: "Budget Paper No. 2, 2026–27",
  ministerSpeech: "Minister for Home Affairs: National Press Club, 17 Sep 2026",
};
