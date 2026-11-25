/**
 * Which images `npm run social:render` makes for a set, and where they go
 * (spec 6.7). Paths are relative to the repo root.
 */
import type { MonthKey } from "../../src/lib/data/types";
import {
  monthSetCards,
  roundSetCards,
  type CardView,
} from "../../src/lib/updates/cards";
import { roundsNewestFirst } from "../../src/lib/updates/round-view";
import type { RecapFacts } from "../../src/lib/updates/types";
import { caption, altText } from "../../src/lib/updates/social-copy";
import type { SetManifest } from "./compress";
import type { HtmlJob, Theme } from "./html";

/** One PNG: a card in one format and theme. `--html-only` takes the same jobs. */
export type RenderJob = HtmlJob;

export type RenderArgs = {
  month: MonthKey;
  set: "round" | "month";
  /** The round set's round; omitted, the month's newest round. */
  round?: string;
  /** Write each card's HTML to this folder instead of rendering PNGs. */
  htmlOnly?: string;
};

const THEMES: Theme[] = ["light", "dark"];

const monthDir = (month: MonthKey) => `public/social/${month}`;
const roundDir = (month: MonthKey, date: string) =>
  `${monthDir(month)}/round-${date}`;

/** A feed card's file stem; both sets call their own cover "cover". */
const stem = (card: CardView) =>
  card.id === "round-cover" ? "cover" : card.id;

/**
 * Every feed card in both themes, then the story cover in both themes and the
 * OG image (light only) from the first card, the set's cover.
 */
function setJobs(cards: CardView[], dir: string, og: string): RenderJob[] {
  const [cover] = cards;
  return [
    ...cards.flatMap((card) =>
      THEMES.map((theme) => ({
        card,
        format: "feed" as const,
        theme,
        out: `${dir}/${stem(card)}-${theme}.png`,
      })),
    ),
    ...THEMES.map((theme) => ({
      card: cover,
      format: "story" as const,
      theme,
      out: `${dir}/story-cover-${theme}.png`,
    })),
    { card: cover, format: "og", theme: "light", out: og },
  ];
}

/** The round set: 9 images under `public/social/YYYY-MM/round-YYYY-MM-DD/`. */
export function roundSetJobs(
  facts: RecapFacts,
  roundDate: string,
): RenderJob[] {
  const dir = roundDir(facts.month, roundDate);
  return setJobs(roundSetCards(facts, roundDate), dir, `${dir}/og.png`);
}

/**
 * The month set: 13 images under `public/social/YYYY-MM/month/`, and the
 * month's OG image at `public/social/YYYY-MM/og.png`. Card 2 is the round
 * set's file, reused and never re-rendered, so it is not a job.
 */
export function monthSetJobs(facts: RecapFacts): RenderJob[] {
  const cards = monthSetCards(facts).filter((card) => card.id !== "round");
  const dir = monthDir(facts.month);
  return setJobs(cards, `${dir}/month`, `${dir}/og.png`);
}

/** The month set's card 2: the newest round set's two round-card files. */
export function reusedRoundFiles(facts: RecapFacts): string[] {
  const [newest] = roundsNewestFirst(facts);
  if (!newest) return [];
  const dir = roundDir(facts.month, newest.date);
  return THEMES.map((theme) => `${dir}/round-${theme}.png`);
}

/**
 * Card 2's entries for the month manifest: the round set's files, with the
 * alt text numbered by place in the carousel (the round card itself has no
 * position, so the round set's own alt text has no "Card 2 of 6").
 */
function reusedRoundImages(
  facts: RecapFacts,
  cards: CardView[],
): SetManifest["images"] {
  const round = cards.find((card) => card.id === "round");
  if (!round) return [];
  const alt = altText({ ...round, position: { index: 2, of: cards.length } });
  return reusedRoundFiles(facts).map((file, i) => ({
    card: "round",
    format: "feed",
    theme: THEMES[i],
    file,
    alt,
  }));
}

/** The jobs for the parsed command, with a plain error for a missing section. */
export function jobsFor(facts: RecapFacts, args: RenderArgs): RenderJob[] {
  if (args.set === "month") {
    if (!facts.data) {
      throw new Error(
        `${facts.month} has no data section; run npm run updates:generate -- --month ${facts.month} --section data first`,
      );
    }
    return monthSetJobs(facts);
  }
  const date = args.round ?? roundsNewestFirst(facts)[0]?.date;
  if (!date) throw new Error(`${facts.month} has no 189 round`);
  return roundSetJobs(facts, date);
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FLAGS = ["--month", "--set", "--round", "--html-only"];

/** `--month YYYY-MM --set round|month [--round YYYY-MM-DD] [--html-only <dir>]`. */
export function parseRenderArgs(argv: string[]): RenderArgs {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    if (!FLAGS.includes(flag)) throw new Error(`Unknown flag ${flag}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} needs a value`);
    }
    if (values.has(flag)) throw new Error(`${flag} given twice`);
    values.set(flag, value);
  }
  const month = values.get("--month");
  if (!month || !MONTH.test(month)) {
    throw new Error("--month YYYY-MM is required");
  }
  const set = values.get("--set");
  if (set !== "round" && set !== "month") {
    throw new Error("--set must be round or month");
  }
  const round = values.get("--round");
  if (round !== undefined) {
    if (set !== "round") throw new Error("--round is for --set round");
    if (!DATE.test(round)) throw new Error("--round must be YYYY-MM-DD");
  }
  const htmlOnly = values.get("--html-only");
  return {
    month,
    set,
    ...(round === undefined ? {} : { round }),
    ...(htmlOnly === undefined ? {} : { htmlOnly }),
  };
}

/** `set.json` for a set's jobs (spec 6.7): image alt text, reused files and the caption. */
export function setManifest(
  facts: RecapFacts,
  args: RenderArgs,
  jobs: RenderJob[],
): SetManifest {
  const round =
    args.set === "round"
      ? (args.round ?? roundsNewestFirst(facts)[0]?.date ?? null)
      : null;
  const cards =
    args.set === "month"
      ? monthSetCards(facts)
      : roundSetCards(facts, round as string);
  const images = jobs.map((job) => ({
    card: job.card.id,
    format: job.format,
    theme: job.theme,
    file: job.out,
    alt: altText(job.card),
  }));
  return {
    kind: args.set,
    month: facts.month,
    round,
    images:
      args.set === "month"
        ? [...images, ...reusedRoundImages(facts, cards)]
        : images,
    reused: args.set === "month" ? reusedRoundFiles(facts) : [],
    caption: caption(args.set, cards, facts),
  };
}

/** Where a set's `set.json` goes: beside its images. */
export function manifestPath(jobs: RenderJob[]): string {
  const [first] = jobs;
  return `${first.out.slice(0, first.out.lastIndexOf("/"))}/set.json`;
}
