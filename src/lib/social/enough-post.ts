import { enoughFaq } from "../guide/faq";
import { ROUND_SOURCE } from "../updates/cards";
import { dayText, formatNumber } from "../updates/format";
import {
  cutoffSpanText,
  latestRoundLine,
  type LatestRound,
} from "../updates/latest-round";
import type { RoundSection } from "../updates/types";
import { SWIPE, closing, launchMrz, numbered, siteUrl } from "./launch-common";
import type { CaptionParts, LaunchCard, LaunchStamp } from "./launch-types";

const tagFor = (passMark: number) => `Is ${passMark} enough?`;
export const CUTOFFS_URL = siteUrl("/occupations/189-cut-offs/");
export const HISTORY =
  "Cut-offs differ by occupation and by round: a past cut-off is history, not a promise.";

/** What the cut-offs page lists, as the link card and the reel say it. */
export const CUTOFFS_PAGE =
  "Every occupation listed in the last four 189 rounds, with its lowest score invited.";

export type EnoughInput = {
  round: LatestRound;
  /** The same round's section of the recap facts. */
  section: RoundSection;
  passMark: number;
};

/** The FAQ answer's sentences, without its closing "Source: …" sentence. */
export function enoughSentences(round: LatestRound): string[] {
  return enoughFaq(round)
    .answer.split(/(?<=\.) /)
    .filter((s) => !s.startsWith("Source:"));
}

/** "44 occupations were invited at 65", from the round's distribution. */
export function atPassMarkTitle(
  section: RoundSection,
  passMark: number,
): string {
  const count =
    section.distribution.find((d) => d.score === passMark)?.occupations ?? 0;
  if (count === 0) return `No occupation was invited at ${passMark}`;
  const noun = count === 1 ? "occupation was" : "occupations were";
  return `${formatNumber(count)} ${noun} invited at ${passMark}`;
}

/** The cover's stamp: the round's date and the pass mark. */
export function passMarkStamp(
  round: LatestRound,
  passMark: number,
): LaunchStamp {
  return {
    shape: "round",
    top: "SUBCLASS 189 ROUND",
    word: `PASS MARK ${passMark}`,
    bottom: dayText(round.date).toUpperCase(),
  };
}

/** Post 7: cover, the round's cut-offs, the plain reading, the cut-offs page, closing. */
export function enoughCards({
  round,
  section,
  passMark,
}: EnoughInput): LaunchCard[] {
  const day = dayText(round.date);
  const source = ROUND_SOURCE(round.date);
  const tag = tagFor(passMark);
  const base = { tag, position: null, source, visas: ["189" as const] };
  const tallest = Math.max(
    1,
    ...section.distribution.map((d) => d.occupations),
  );
  return numbered<LaunchCard>([
    {
      ...base,
      id: "launch-cover",
      eyebrow: `189 round · ${day}`,
      titleLines: [`Is ${passMark} points`, "enough?"],
      sub: `What the ${day} round shows, card by card.`,
      stamps: [passMarkStamp(round, passMark)],
      swipe: SWIPE,
      mrz: launchMrz(["IS", String(passMark), "ENOUGH"]),
    },
    {
      ...base,
      id: "launch-chart",
      eyebrow: `189 · ${day}`,
      title: atPassMarkTitle(section, passMark),
      lead: latestRoundLine(round),
      charts: [
        {
          heading: "Occupations by lowest score invited",
          orientation: "columns",
          bars: section.distribution.map((d) => ({
            label: String(d.score),
            sub: null,
            value: formatNumber(d.occupations),
            solid: d.occupations / tallest,
            hatched: d.occupations / tallest,
            strong: d.score === passMark,
            empty: false,
          })),
          axis: "Lowest score invited (points) · number of occupations above each bar",
        },
      ],
      key: null,
      note: `Each occupation has its own cut-off: in this round they ran from ${cutoffSpanText(round)}.`,
    },
    {
      ...base,
      id: "launch-text",
      eyebrow: "The plain reading",
      title: `${passMark} is the pass mark, not a promise`,
      paragraphs: [...enoughSentences(round), HISTORY],
      facts: [
        { label: "Pass mark", value: `${passMark} points` },
        {
          label: `Lowest score invited, ${day}`,
          value: `${cutoffSpanText(round)}, by occupation`,
        },
      ],
      stamps: [],
      emphasis: null,
    },
    {
      ...base,
      id: "launch-link",
      eyebrow: "Your occupation",
      title: "Check your occupation's cut-offs",
      sub: `${CUTOFFS_PAGE} A round that skipped it says “Not listed”, never zero.`,
      url: CUTOFFS_URL,
      points: [],
      stamp: null,
    },
    closing(tag, source),
  ]);
}

export function enoughCaption(
  round: LatestRound,
  passMark: number,
): CaptionParts {
  return {
    hook: `Is ${passMark} points enough for Australian PR?`,
    body: [...enoughSentences(round), HISTORY],
    cta: "Comment your occupation and we'll reply with its latest cut-off.",
    link: `Every cut-off: ${CUTOFFS_URL}`,
    hashtags: [
      "#189visa",
      "#PointsTest",
      "#SkillSelect",
      "#AustraliaPR",
      "#EOI",
      "#AustralianImmigration",
      "#SkilledMigration",
    ],
  };
}
