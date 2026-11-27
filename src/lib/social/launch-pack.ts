import type { PointsFactor } from "../../data/guide/points-table";
import type { MonthKey, Visa } from "../data/types";
import type { GlossaryTerm } from "../guide/glossary";
import { rowPoints } from "../guide/points-table";
import type { FeeCatalogue, VisaGuide } from "../guide/types";
import type { StatePageView } from "../state-page/view";
import { formatMonth } from "../report/copy";
import type { LatestRound } from "../updates/latest-round";
import type { RecapFacts } from "../updates/types";
import { launchAltText } from "./captions";
import { enoughCaption, enoughCards } from "./enough-post";
import { jargonCaption, jargonCards } from "./jargon-post";
import type {
  CaptionParts,
  LaunchCard,
  LaunchPack,
  LaunchPost,
} from "./launch-types";
import {
  occupationCaption,
  occupationCards,
  type OccupationInput,
} from "./occupation-post";
import { pointsCaption, pointsCards } from "./points-post";
import {
  monthPostCaption,
  monthPostSlides,
  roundPostCaption,
  roundPostSlides,
} from "./reused-posts";
import { stateCaption, stateCards } from "./state-post";
import { avatarCard, highlightCards, launchStories } from "./stories";
import { visasCaption, visasCards } from "./visas-post";
import { welcomeCaption, welcomeCards } from "./welcome-post";

/** Everything the pack reads; load-server.ts fills it from the site's data. */
export type LaunchInput = {
  asAt: MonthKey;
  /** The recap month that holds the newest round and its data section. */
  recap: RecapFacts;
  round: LatestRound;
  pointsTable: PointsFactor[];
  passMark: number;
  guides: Record<Visa, VisaGuide>;
  fees: FeeCatalogue;
  guideCheckedAt: string;
  glossary: GlossaryTerm[];
  state: StatePageView;
  occupation: OccupationInput;
};

/** Posts 1, 4 and 7 are pinned (brief). */
export const PINNED = [1, 4, 7];

function cardPost(
  index: number,
  slug: string,
  title: string,
  cards: LaunchCard[],
  caption: CaptionParts,
): LaunchPost {
  return {
    slug: `${String(index).padStart(2, "0")}-${slug}`,
    title,
    pinned: PINNED.includes(index),
    slides: cards.map((card) => ({
      kind: "card",
      card,
      alt: launchAltText(card),
    })),
    caption,
  };
}

/** The nine feed posts, the four stories and the profile kit, in posting order. */
export function buildLaunchPack(input: LaunchInput): LaunchPack {
  const { recap, round, state, occupation } = input;
  const month = formatMonth(recap.month).split(" ")[0].toLowerCase();
  const code = state.page.code;
  const section = recap.rounds[round.date];
  if (!section) throw new Error(`${recap.month} has no round on ${round.date}`);
  const posts: LaunchPost[] = [
    cardPost(1, "welcome", "Welcome", welcomeCards(input), welcomeCaption()),
    {
      slug: `02-round-${month}`,
      title: `189 round, ${formatMonth(recap.month)}`,
      pinned: false,
      slides: roundPostSlides(recap),
      caption: roundPostCaption(recap),
    },
    {
      slug: `03-update-${month}`,
      title: `SkillSelect update, ${formatMonth(recap.month)}`,
      pinned: false,
      slides: monthPostSlides(recap),
      caption: monthPostCaption(recap),
    },
    cardPost(
      4,
      "points-table",
      "The points table",
      pointsCards(input.pointsTable, input.passMark),
      pointsCaption(input.pointsTable),
    ),
    cardPost(
      5,
      "189-190-491",
      "189 vs 190 vs 491",
      visasCards({
        guides: input.guides,
        fees: input.fees,
        checkedAt: input.guideCheckedAt,
      }),
      visasCaption(
        rowPoints(input.pointsTable, "nomination-190"),
        rowPoints(input.pointsTable, "nomination-491"),
      ),
    ),
    cardPost(
      6,
      "jargon",
      "What does “<20” mean?",
      jargonCards(input.glossary),
      jargonCaption(input.glossary),
    ),
    cardPost(
      7,
      `is-${input.passMark}-enough`,
      `Is ${input.passMark} points enough?`,
      enoughCards({ round, section, passMark: input.passMark }),
      enoughCaption(round, input.passMark),
    ),
    cardPost(
      8,
      `state-${code.toLowerCase()}`,
      `State spotlight: ${code}`,
      stateCards(state),
      stateCaption(state),
    ),
    cardPost(
      9,
      `occupation-${occupation.core.code}`,
      `Occupation spotlight: ${occupation.core.name}`,
      occupationCards(occupation),
      occupationCaption(occupation),
    ),
  ];
  return {
    posts,
    stories: launchStories().map((s) => ({ ...s, alt: launchAltText(s.card) })),
    avatar: avatarCard(),
    highlights: highlightCards(),
  };
}
