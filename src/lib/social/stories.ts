import { HANDLE } from "../updates/social-spec";
import { NOT_ADVICE, SITE } from "./launch-common";
import type {
  AvatarCard,
  HighlightCard,
  HighlightIcon,
  LaunchStoryCard,
  StickerKind,
} from "./launch-types";

/**
 * The launch stories (1080×1920, light) and the profile kit. Each story
 * leaves an empty space where the founder places Instagram's sticker by
 * hand; a `--guides` render outlines it, the final PNG never does.
 */

const FOOT = NOT_ADVICE;

function story(
  slug: string,
  fields: Omit<
    LaunchStoryCard,
    "id" | "tag" | "position" | "source" | "visas" | "foot"
  > & {
    foot?: string;
  },
): { slug: string; card: LaunchStoryCard } {
  return {
    slug,
    card: {
      id: "launch-story",
      tag: "Story",
      position: null,
      source: `${HANDLE} · ${SITE}`,
      visas: [],
      foot: FOOT,
      ...fields,
    },
  };
}

const sticker = (kind: StickerKind, label: string) => ({ kind, label });

/** The four story frames, in the order the calendar first uses them. */
export function launchStories(): { slug: string; card: LaunchStoryCard }[] {
  return [
    story("01-poll", {
      eyebrow: "Quick poll",
      title: "What’s your points score?",
      sub: "Vote, then check yours free.",
      sticker: sticker("poll", "Instagram's poll sticker"),
    }),
    story("02-quiz", {
      eyebrow: "Quiz",
      title: "What does “<20” mean in SkillSelect?",
      sub: "Tap your answer.",
      sticker: sticker("quiz", "Instagram's quiz sticker"),
    }),
    story("03-link", {
      eyebrow: "Free points check",
      title: "Check your points free",
      sub: "Your points and three visa stamps, 189, 190 and 491. No email or account.",
      sticker: sticker("link", "Instagram's link sticker"),
    }),
    story("04-new-post", {
      eyebrow: "New post",
      title: `New on ${HANDLE}`,
      sub: null,
      sticker: sticker("post", "the shared post"),
      foot: "Tap the post to see every card.",
    }),
  ];
}

/** The highlight covers, in profile order, with the name Instagram shows under each. */
export const HIGHLIGHTS: { icon: HighlightIcon; name: string }[] = [
  { icon: "rounds", name: "Rounds" },
  { icon: "points", name: "Points" },
  { icon: "states", name: "States" },
  { icon: "guide", name: "How it works" },
];

const blank = { tag: "", position: null, source: "", visas: [] };

export function highlightCards(): HighlightCard[] {
  return HIGHLIGHTS.map((h) => ({ ...blank, id: "highlight", ...h }));
}

export function avatarCard(): AvatarCard {
  return { ...blank, id: "profile-avatar", name: "MigrateLens" };
}
