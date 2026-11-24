import type { GuideStep } from "../../lib/guide/types";
import { GUIDE_CHECKED_AT, SOURCES } from "./sources";

const checkedAt = GUIDE_CHECKED_AT;
const ALL = ["189", "190", "491"] as const;

// Each rule paraphrases the linked Home Affairs page as read on
// GUIDE_CHECKED_AT (docs/research/pr-guide-2026-11.md). Durations appear only
// where the page publishes one; everything else says it varies.
export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "occupation",
    title: "Choose your occupation",
    short: "Occupation",
    appliesTo: [...ALL],
    what: "Pick the ANZSCO occupation that matches your qualifications and work. It decides which of the three visas you can use and which body assesses your skills.",
    rule: {
      text: "Your occupation must be on the Home Affairs list of eligible skilled occupations for the visa. The list names the assessing authority for each occupation.",
      source: SOURCES.visa189,
      checkedAt,
    },
    who: "Department of Home Affairs (the occupation list)",
    link: { href: SOURCES.occupationList, text: "Skilled occupation list" },
    onshore: "The same list applies.",
    offshore: "The same list applies.",
    duration: { kind: "varies", text: "Up to you." },
  },
  {
    id: "assessment",
    title: "Get your skills assessed",
    short: "Skills assessment",
    appliesTo: [...ALL],
    what: "The assessing authority for your occupation checks your qualification and, often, your work experience. A positive outcome letter is what you claim in your EOI.",
    rule: {
      text: "You need a suitable skills assessment at the time of invitation, obtained in the 3 years before the invitation (or within a shorter validity on the letter).",
      source: SOURCES.visa189,
      checkedAt,
    },
    who: "The assessing authority listed for your occupation (for example ACS, Engineers Australia, ANMAC, VETASSESS)",
    link: { href: SOURCES.skillsAssessment, text: "Skills assessment" },
    onshore:
      "Some bodies add GST or charge a different fee for applicants in Australia.",
    offshore:
      "Overseas qualifications and work are assessed; some bodies charge less offshore.",
    duration: {
      kind: "varies",
      text: "Varies by assessing authority; each publishes its own times.",
    },
  },
  {
    id: "english",
    title: "Take an English test",
    short: "English test",
    appliesTo: [...ALL],
    what: "Competent English is the minimum. Proficient adds 10 points and Superior adds 20, so many people retake a test for points.",
    rule: {
      text: "At the time of invitation you need at least competent English, for example IELTS 6 in each part, or PTE Academic 47 listening, 48 reading, 51 writing and 54 speaking (tests from 7 Aug 2025).",
      source: SOURCES.competentEnglish,
      checkedAt,
    },
    who: "An approved test provider (IELTS, PTE Academic, TOEFL iBT, OET and others)",
    link: { href: SOURCES.competentEnglish, text: "Competent English" },
    onshore: "Tests are available in Australian cities.",
    offshore:
      "Book in your own country. Passport holders of the UK, Ireland, the US, Canada and New Zealand already count as competent.",
    duration: {
      kind: "varies",
      text: "Varies; a result counts for 3 years.",
    },
  },
  {
    id: "points",
    title: "Work out your points",
    short: "Points",
    appliesTo: [...ALL],
    what: "Add up age, English, skilled work, qualifications and the smaller items. Nomination adds 5 points (190) or 15 points (491).",
    rule: {
      text: "You need at least 65 points on the points test to be invited. Your invitation states the score you must prove, which can be higher than 65.",
      source: SOURCES.pointsTable,
      checkedAt,
    },
    who: "You, using the Home Affairs points table",
    link: { href: SOURCES.pointsTable, text: "Points table" },
    onshore: "Australian study and Australian work can add points.",
    offshore: "Overseas work counts for up to 15 points.",
    duration: { kind: "varies", text: "Up to you." },
  },
  {
    id: "eoi",
    title: "Submit an EOI in SkillSelect",
    short: "EOI",
    appliesTo: [...ALL],
    what: "An expression of interest tells Home Affairs (and the states) which visas you want and what you claim. You upload no documents.",
    rule: {
      text: "An EOI is not a visa application and there is no fee. You could be invited up to 2 years after submitting it.",
      source: SOURCES.visa189,
      checkedAt,
    },
    who: "Department of Home Affairs (SkillSelect)",
    link: { href: SOURCES.skillSelect, text: "SkillSelect" },
    onshore:
      "An EOI gives you no bridging visa: keep your current visa valid while you wait.",
    offshore: "You can submit from outside Australia.",
    duration: {
      kind: "published",
      text: "Invitations can come up to 2 years after you submit.",
      source: SOURCES.visa189,
      checkedAt,
    },
  },
  {
    id: "nomination",
    title: "State nomination (190 and 491)",
    short: "Nomination",
    appliesTo: ["190", "491"],
    what: "States and territories see EOIs that select them. Each sets its own criteria and occupation lists; some ask for a separate registration of interest, and some charge a nomination fee.",
    rule: {
      text: "For 190 you must be nominated by a state or territory agency. For 491 you need a state or territory nomination or sponsorship by an eligible relative.",
      source: SOURCES.visa190,
      checkedAt,
    },
    who: "The state or territory government nominating you",
    link: { href: "/states/", text: "State programs on MigrateLens" },
    onshore:
      "Many states have streams for people already living or working in that state.",
    offshore:
      "Some states nominate people offshore; others list an occupation only for people living there.",
    duration: {
      kind: "varies",
      text: "Varies by state; none publishes a fixed time for an invitation.",
    },
  },
  {
    id: "invitation",
    title: "Receive an invitation",
    short: "Invitation",
    appliesTo: [...ALL],
    what: "For the 189, EOIs are ranked against each other and Home Affairs invites you in a round when you score enough points and places are available for your occupation. For the 190 and 491, the invitation follows a state or territory's nomination: once a state nominates you, Home Affairs invites you. A 491 EOI sponsored by an eligible relative can be invited in a Home Affairs round. Either way, SkillSelect emails you.",
    rule: {
      text: "You must be under 45 when invited. An invitation doesn't mean the visa will be granted, and you'll be invited at most twice for the same EOI.",
      source: SOURCES.visa189,
      checkedAt,
    },
    who: "Department of Home Affairs",
    link: { href: SOURCES.skillSelect, text: "SkillSelect" },
    onshore: "The same rules apply.",
    offshore: "The same rules apply.",
    duration: {
      kind: "varies",
      text: "Varies by occupation and points; past rounds are on each occupation page.",
    },
  },
  {
    id: "lodge",
    title: "Lodge your visa application",
    short: "Lodge in 60 days",
    appliesTo: [...ALL],
    what: "Apply in ImmiAccount, pay the visa application charge and upload evidence for every claim in your EOI.",
    rule: {
      text: "You have 60 calendar days from the invitation to apply. Home Affairs can't extend this time.",
      source: SOURCES.visa189,
      checkedAt,
    },
    who: "You, in ImmiAccount",
    link: { href: SOURCES.visa189, text: "Visa application steps" },
    onshore:
      "Applying in Australia, you need a substantive visa or a Bridging A, B or C visa.",
    offshore:
      "You can apply from outside Australia (but not in immigration clearance).",
    duration: {
      kind: "published",
      text: "60 calendar days from the invitation.",
      source: SOURCES.visa189,
      checkedAt,
    },
  },
  {
    id: "health-character",
    title: "Health and character checks",
    short: "Health and police",
    appliesTo: [...ALL],
    what: "You and family applying with you must meet the health requirement (Home Affairs tells you which examinations you need). Applicants aged 16 and over must meet the character requirement.",
    rule: {
      text: "Provide a police certificate from each country where you spent 12 months or more in the last 10 years since turning 16, and an Australian Federal Police certificate after 12 months or more in Australia.",
      source: SOURCES.visa189,
      checkedAt,
    },
    who: "Home Affairs, the examining doctors it names and police authorities",
    link: { href: SOURCES.health, text: "Health requirement" },
    onshore:
      "The AFP check is needed once you've spent 12 months in Australia.",
    offshore:
      "Certificates come from each country you've lived in, including your home country.",
    duration: {
      kind: "varies",
      text: "Varies by country and examination.",
    },
  },
  {
    id: "decision",
    title: "Visa decision",
    short: "Decision",
    appliesTo: [...ALL],
    what: "Home Affairs assesses your claims and decides. A 189 or 190 grant is permanent residence; a 491 is provisional for 5 years.",
    rule: {
      text: "Home Affairs publishes processing times for recently decided applications as a guide only; your application can take longer.",
      source: SOURCES.processingTimes,
      checkedAt,
    },
    who: "Department of Home Affairs",
    link: { href: SOURCES.processingTimes, text: "Processing times guide" },
    onshore:
      "For citizenship purposes, permanent residence starts on the grant date when you're in Australia.",
    offshore:
      "For citizenship purposes, it starts when you enter Australia on the visa.",
    duration: {
      kind: "varies",
      text: "Varies; see the official processing-times guide.",
    },
  },
];
