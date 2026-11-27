import type { Visa } from "../data/types";
import type { ClosingCard, StampText } from "../updates/cards";

/**
 * The Instagram launch pack's cards (brief 2026-11-27): Look A passport
 * pages like the monthly sets, as pure view-models that the templates in
 * scripts/social/templates/ only render. Every figure on them is read from
 * the site's own data and modules.
 */

export type Position = { index: number; of: number } | null;

type LaunchBase = {
  /** The top-right tag, e.g. "Points table"; the template adds "· 2/9". */
  tag: string;
  position: Position;
  /** The source line at the foot; its " · as at " or " · checked " date is bold. */
  source: string;
  /** The visas the card shows figures for. */
  visas: Visa[];
};

export type LaunchStamp = StampText & { shape: "round" | "rect" };

/** Card 1 of a post: a hook title, its stamps and the swipe cue. */
export type LaunchCoverCard = LaunchBase & {
  id: "launch-cover";
  eyebrow: string;
  /** Each entry starts a new line; a long one may still wrap. */
  titleLines: string[];
  sub: string;
  /** One stamp, or three (the cover's passport arrangement). */
  stamps: LaunchStamp[];
  swipe: string;
  mrz: string;
};

export type ListRow = { label: string; value: string; note: string | null };

/** Rows of label and value: a points group, a state's streams, top occupations. */
export type LaunchListCard = LaunchBase & {
  id: "launch-list";
  eyebrow: string;
  title: string;
  lead: string | null;
  /**
   * "points": each value is a big stencil figure; "text": a short phrase
   * beside its label; "stacked": a sentence under its label.
   */
  values: "points" | "text" | "stacked";
  groups: { heading: string | null; rows: ListRow[] }[];
  note: string | null;
};

/** Plain explanation: paragraphs, optional dated facts and a row of stamps. */
export type LaunchTextCard = LaunchBase & {
  id: "launch-text";
  eyebrow: string;
  title: string;
  paragraphs: string[];
  facts: { label: string; value: string }[];
  stamps: LaunchStamp[];
  /** A bold closing line, such as the not-advice line. */
  emphasis: string | null;
};

/**
 * One bar: `solid` is the published part and `hatched` reaches the top of
 * the range (a "<20" count is hatched from 0 to 19); both are shares of the
 * chart's tallest bar. `empty` draws a dashed outline ("Not listed").
 */
export type ChartBar = {
  label: string;
  /** A second label line under a column, such as the year. */
  sub: string | null;
  value: string;
  solid: number;
  hatched: number;
  strong: boolean;
  empty: boolean;
};

export type Chart = {
  heading: string;
  orientation: "columns" | "rows";
  bars: ChartBar[];
  axis: string | null;
};

export type LaunchChartCard = LaunchBase & {
  id: "launch-chart";
  eyebrow: string;
  title: string;
  lead: string | null;
  charts: Chart[];
  /** The legend, when a chart has hatched ranges. */
  key: { solid: string; hatched: string } | null;
  note: string | null;
};

/** The three visas side by side. */
export type LaunchCompareCard = LaunchBase & {
  id: "launch-compare";
  eyebrow: string;
  title: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
  note: string | null;
};

/** A call to action with one page's address. */
export type LaunchLinkCard = LaunchBase & {
  id: "launch-link";
  eyebrow: string;
  title: string;
  sub: string;
  url: string;
  points: string[];
  stamp: LaunchStamp | null;
};

export type StickerKind = "poll" | "quiz" | "link" | "post";

/** A story frame with an empty space where the founder places a sticker. */
export type LaunchStoryCard = LaunchBase & {
  id: "launch-story";
  eyebrow: string;
  title: string;
  sub: string | null;
  sticker: { kind: StickerKind; label: string };
  foot: string;
};

/** The profile picture: the logo mark on paper (1080×1080). */
export type AvatarCard = LaunchBase & { id: "profile-avatar"; name: string };

export type HighlightIcon = "rounds" | "points" | "states" | "guide";

/** A highlight cover (1080×1920): an icon in the centre circle. */
export type HighlightCard = LaunchBase & {
  id: "highlight";
  icon: HighlightIcon;
  name: string;
};

export type LaunchCard =
  | LaunchCoverCard
  | LaunchListCard
  | LaunchTextCard
  | LaunchChartCard
  | LaunchCompareCard
  | LaunchLinkCard
  | LaunchStoryCard
  | AvatarCard
  | HighlightCard
  | ClosingCard;

/** A feed post's caption, in the order it is written. */
export type CaptionParts = {
  hook: string;
  body: string[];
  cta: string;
  /** The page the post points to, written as text (captions don't link). */
  link: string;
  hashtags: string[];
};

/** A slide rendered from a card, or a PNG already rendered for a monthly set. */
export type Slide =
  | { kind: "card"; card: LaunchCard; alt: string }
  | {
      kind: "reused";
      /** Paths relative to the repo root, by theme. */
      files: { light: string; dark: string };
      alt: string;
    };

export type LaunchPost = {
  /** The output folder, e.g. "01-welcome". */
  slug: string;
  title: string;
  pinned: boolean;
  slides: Slide[];
  caption: CaptionParts;
};

export type LaunchPack = {
  posts: LaunchPost[];
  stories: { slug: string; card: LaunchStoryCard; alt: string }[];
  avatar: AvatarCard;
  highlights: HighlightCard[];
};
