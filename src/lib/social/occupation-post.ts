import type { OccupationCore, Visa } from "../data/types";
import { poolBars, poolTotalLabel } from "../occupation-page/charts";
import {
  asAtDay,
  dated189Sentence,
  datedLead,
  statesSentence,
  withCode,
} from "../occupation-page/answer";
import { occupationFaq } from "../occupation-page/faq";
import { occupationPath } from "../occupation-page/slug";
import type { StateRow } from "../occupation-page/states";
import { poolSentence } from "../occupation-page/summary";
import { formatMonth } from "../report/copy";
import { summarise189Rounds } from "../report/round-status";
import type { FederalList } from "../state-outlook/rules-types";
import { SKILLSELECT_SOURCE } from "../updates/cards";
import { dayText } from "../updates/format";
import { SWIPE, closing, launchMrz, numbered, siteUrl } from "./launch-common";
import type {
  CaptionParts,
  Chart,
  LaunchCard,
  LaunchChartCard,
  LaunchStamp,
} from "./launch-types";

/**
 * Post 9, the occupation spotlight, from the occupation page's own modules
 * (answer, FAQ, charts), for any occupation code.
 */

export type OccupationInput = {
  core: OccupationCore;
  rows: StateRow[];
  /** The latest listed round's tie-break date for this code, if published. */
  tieBreak: string | null;
  federal: FederalList | null;
};

/** The 189 rounds shown: the spotlight card's six. */
export const ROUNDS_SHOWN = 6;
/** A cut-off column's floor: a cut-off at FLOOR points still shows this share. */
const FLOOR = { points: 60, share: 0.3 };
const HISTORY = "Past cut-offs are history, not a promise.";

/** The spotlight card's stamp: the latest round's cut-off, or "not listed". */
function roundStamp(core: OccupationCore): LaunchStamp {
  const [newest] = core.rounds189;
  if (!newest) {
    return {
      shape: "rect",
      top: "ANZSCO",
      word: core.code,
      bottom: formatMonth(core.asAt).toUpperCase(),
    };
  }
  const when = dayText(newest.date).toUpperCase();
  return newest.cutoff === null
    ? {
        shape: "rect",
        top: `189 · ${when}`,
        word: "NOT LISTED",
        bottom: "IN THE ROUND",
      }
    : {
        shape: "rect",
        top: `189 · ${when}`,
        word: `${newest.cutoff} PTS`,
        bottom: "LOWEST INVITED",
      };
}

function roundsChart(core: OccupationCore): Chart {
  const rounds = core.rounds189.slice(0, ROUNDS_SHOWN).reverse();
  const highest = Math.max(
    FLOOR.points + 1,
    ...rounds.map((r) => r.cutoff ?? 0),
  );
  const share = (cutoff: number) =>
    FLOOR.share +
    ((1 - FLOOR.share) * Math.max(0, cutoff - FLOOR.points)) /
      (highest - FLOOR.points);
  const last = rounds.length - 1;
  return {
    heading: `Last ${rounds.length} 189 rounds · lowest score invited`,
    orientation: "columns",
    bars: rounds.map((r, i) => {
      const [day, month, year] = dayText(r.date).split(" ");
      return {
        label: `${day} ${month}`,
        sub: year,
        value: r.cutoff === null ? "Not listed" : String(r.cutoff),
        solid: r.cutoff === null ? FLOOR.share : share(r.cutoff),
        hatched: r.cutoff === null ? FLOOR.share : share(r.cutoff),
        strong: i === last,
        empty: r.cutoff === null,
      };
    }),
    axis: null,
  };
}

function poolChart(core: OccupationCore, visa: Visa): Chart {
  return {
    heading: `${visa} pool by points · as at ${asAtDay(core)}`,
    orientation: "rows",
    bars: poolBars(core.pool[visa]).map((b) => ({
      label: String(b.score),
      sub: null,
      value: b.label,
      solid: b.masked ? 0 : b.share,
      hatched: b.share,
      strong: false,
      empty: false,
    })),
    axis: "Points · EOIs in the pool",
  };
}

type Base = Pick<LaunchChartCard, "tag" | "position" | "source" | "visas">;

const POOL_KEY = {
  solid: "published count",
  hatched: "under 20, which may be zero",
};

function poolCard(
  core: OccupationCore,
  visa: Visa,
  lead: string,
  base: Base,
): LaunchChartCard {
  return {
    ...base,
    visas: [visa],
    id: "launch-chart",
    eyebrow: `${visa} pool · as at ${asAtDay(core)}`,
    title: poolTotalLabel(visa, core.pool[visa]) as string,
    lead,
    charts: [poolChart(core, visa)],
    key: POOL_KEY,
    note:
      visa === "189"
        ? "Counts are EOIs, not individuals: one person can hold several, in more than one pool."
        : null,
  };
}

function roundsCard(
  input: OccupationInput,
  base: Base,
): LaunchChartCard | null {
  const { core, rows, tieBreak, federal } = input;
  if (core.rounds189.length === 0) return null;
  const latest = summarise189Rounds(core.rounds189).latestCutoff;
  const [cutoffFaq] = occupationFaq(core, rows, { federal, tieBreak });
  const tie = cutoffFaq.answer
    .split(/(?<=\.) /)
    .find((s) => s.includes("tie-break"));
  const shown = core.rounds189.slice(0, ROUNDS_SHOWN);
  const span = [shown.at(-1), shown[0]].map((r) => dayText(r?.date ?? ""));
  return {
    ...base,
    source: `Source: Home Affairs invitation rounds, ${span[0]} to ${span[1]}`,
    visas: ["189"],
    id: "launch-chart",
    eyebrow: "189 · latest listed round",
    title: latest
      ? `${latest.cutoff} points on ${dayText(latest.date)}`
      : "Not listed in a recent 189 round",
    lead: dated189Sentence(core),
    charts: [roundsChart(core)],
    key: null,
    note: [tie, HISTORY].filter(Boolean).join(" "),
  };
}

/** The FAQ's own answer for a pool, as the slide's lead. */
function poolAnswer(input: OccupationInput, visa: Visa): string {
  const { core, rows, federal, tieBreak } = input;
  if (visa === "189") return datedLead(core, poolSentence(core.name, core));
  const question = `How many ${core.name} EOIs are in the ${visa} pool?`;
  const faq = occupationFaq(core, rows, { federal, tieBreak }).find(
    (f) => f.question === question,
  );
  if (!faq) throw new Error(`No ${visa} pool answer for ${core.code}`);
  return faq.answer.split(/(?<=\.) /)[0];
}

function statesCard(input: OccupationInput, base: Base): LaunchCard {
  const { core, rows } = input;
  return {
    ...base,
    id: "launch-list",
    visas: ["190", "491"],
    eyebrow: "190 · 491 · state lists",
    title: "Which states list it?",
    lead: statesSentence(core, rows),
    values: "text",
    groups: [
      {
        heading: null,
        rows: rows.map((r) => ({ label: r.name, value: r.onList, note: null })),
      },
    ],
    note: null,
  };
}

/** Post 9: cover, 189 rounds, the three pools, the states, the page link, closing. */
export function occupationCards(input: OccupationInput): LaunchCard[] {
  const { core } = input;
  const source = SKILLSELECT_SOURCE(asAtDay(core));
  const base: Base = {
    tag: `${core.code} · ${formatMonth(core.asAt)}`,
    position: null,
    source,
    visas: ["189", "190", "491"],
  };
  const rounds = roundsCard(input, base);
  const pools = (["189", "190", "491"] as const).filter((v) => core.pool[v]);
  return numbered<LaunchCard>([
    {
      ...base,
      id: "launch-cover",
      eyebrow: "Occupation spotlight",
      titleLines: [core.name],
      sub: `ANZSCO ${core.code}: the 189 rounds, the pools and the states, as at ${asAtDay(core)}.`,
      stamps: [roundStamp(core)],
      swipe: SWIPE,
      mrz: launchMrz(["OCCUPATION", core.code]),
    },
    ...(rounds ? [rounds] : []),
    ...pools
      .slice(0, 1)
      .map((v) => poolCard(core, v, poolAnswer(input, v), base)),
    statesCard(input, base),
    ...pools.slice(1).map((v) => poolCard(core, v, poolAnswer(input, v), base)),
    {
      ...base,
      id: "launch-link",
      eyebrow: "Every figure",
      title: "See the full occupation page",
      sub: `${withCode(core)}: every 189 round, the pools by points, the states and the questions, updated monthly.`,
      url: siteUrl(occupationPath(core)),
      points: [],
      stamp: null,
    },
    closing(base.tag, source),
  ]);
}

export function occupationCaption(input: OccupationInput): CaptionParts {
  const { core, rows } = input;
  const states = statesSentence(core, rows);
  return {
    hook: `${core.name}: the latest SkillSelect figures.`,
    body: [
      ...(core.rounds189.length > 0 ? [dated189Sentence(core)] : []),
      datedLead(core, poolSentence(core.name, core)),
      ...(states ? [states] : []),
    ],
    cta: "Comment your occupation and we'll reply with its latest data.",
    link: `Every figure: ${siteUrl(occupationPath(core))}`,
    hashtags: [
      "#189visa",
      "#190visa",
      "#491visa",
      "#SkillSelect",
      "#AustraliaPR",
      "#EOI",
      "#SkilledMigration",
    ],
  };
}
