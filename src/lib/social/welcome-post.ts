import { ABOUT_INTRO, ABOUT_SECTIONS } from "../about/copy";
import type { MonthKey } from "../data/types";
import { SKILLSELECT_SOURCE } from "../updates/cards";
import { dayText, monthEnd } from "../updates/format";
import type { LatestRound } from "../updates/latest-round";
import {
  NOT_ADVICE,
  SITE,
  SWIPE,
  VISA_STAMPS,
  closing,
  launchMrz,
  numbered,
  siteUrl,
} from "./launch-common";
import type { CaptionParts, LaunchCard } from "./launch-types";

const TAG = "Welcome";
const STAMPS = [VISA_STAMPS["190"], VISA_STAMPS["491"], VISA_STAMPS["189"]];

/** A string paragraph of an About section, so the post repeats the page's words. */
function aboutParagraph(id: string, index: number): string {
  const paragraph = ABOUT_SECTIONS.find((s) => s.id === id)?.paragraphs[index];
  if (typeof paragraph !== "string") {
    throw new Error(`About section ${id} has no plain paragraph ${index}`);
  }
  return paragraph;
}

/** "It compares points …" from the About intro, as "MigrateLens compares points …". */
function introSentence(): string {
  const second = ABOUT_INTRO.split(". ")[1];
  if (!second?.startsWith("It ")) throw new Error("About intro changed");
  return `MigrateLens ${second.slice(3)}`;
}

const firstSentence = (text: string) => text.split(/(?<=\.) /)[0];

export type WelcomeInput = { asAt: MonthKey; round: LatestRound | null };

/**
 * Post 1: the hook, what the free check gives, where the data comes from
 * and the closing card. Wording from the About page and the homepage.
 */
export function welcomeCards({ asAt, round }: WelcomeInput): LaunchCard[] {
  const asAtDay = dayText(monthEnd(asAt));
  const source = SKILLSELECT_SOURCE(asAtDay);
  const base = { tag: TAG, position: null, source, visas: [] };
  const roundFact = round
    ? [{ label: "Latest 189 round", value: dayText(round.date) }]
    : [];
  return numbered<LaunchCard>([
    {
      ...base,
      id: "launch-cover",
      visas: ["189", "190", "491"],
      eyebrow: "Australian skilled visas",
      titleLines: ["Your points", "vs real", "SkillSelect data"],
      sub: "Free points check for the 189, 190 and 491, read against published Home Affairs data.",
      stamps: STAMPS,
      swipe: SWIPE,
      mrz: launchMrz(["WELCOME"]),
    },
    {
      ...base,
      id: "launch-text",
      visas: ["189", "190", "491"],
      eyebrow: "The free check",
      title: "Your points, and a stamp for each visa",
      paragraphs: [
        "Answer the points-test questions: age, English, skilled work, study, partner and the rest. The check adds up your points by the Home Affairs points table.",
        "Then you see three visa stamps, for the 189, 190 and 491, read against the published SkillSelect data for your occupation.",
      ],
      facts: [
        { label: "Email or account", value: "None needed" },
        { label: "Your answers", value: "Stay in your browser" },
      ],
      stamps: [VISA_STAMPS["189"], VISA_STAMPS["190"], VISA_STAMPS["491"]],
      emphasis: null,
      source: `Source: MigrateLens free points check · ${siteUrl("/check/")}`,
    },
    {
      ...base,
      id: "launch-text",
      eyebrow: "Where the data comes from",
      title: "Home Affairs SkillSelect, updated after every round",
      paragraphs: [
        aboutParagraph("editorial", 0),
        firstSentence(aboutParagraph("updates", 0)),
      ],
      facts: [
        { label: "SkillSelect EOI data", value: `as at ${asAtDay}` },
        ...roundFact,
      ],
      stamps: [],
      emphasis: NOT_ADVICE,
    },
    closing(TAG, source, "Check yours free"),
  ]);
}

export function welcomeCaption(): CaptionParts {
  return {
    hook: "Your points vs real SkillSelect data.",
    body: [
      introSentence(),
      "The free check adds up your points and shows a stamp for each of the 189, 190 and 491, with no email or account.",
      "Every figure is dated and comes from published Home Affairs data, updated after every round.",
    ],
    cta: "Comment your occupation and we'll reply with its latest data.",
    link: `Check yours free: ${SITE}`,
    hashtags: [
      "#AustraliaPR",
      "#SkillSelect",
      "#189visa",
      "#190visa",
      "#491visa",
      "#PointsTest",
      "#AustralianImmigration",
      "#SkilledMigration",
    ],
  };
}
