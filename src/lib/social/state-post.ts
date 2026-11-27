import type { StateVisa } from "../data/types";
import { formatDate } from "../migration";
import { formatMonth } from "../report/copy";
import type { MonthsCardView } from "../state-page/months-view";
import { STATE_VISAS } from "../state-page/program";
import { SERIES_MONTHS } from "../state-page/series";
import type { StatePageView } from "../state-page/view";
import { SKILLSELECT_SOURCE } from "../updates/cards";
import type { PoolView } from "../updates/data-view";
import { dayText, formatNumber, monthEnd } from "../updates/format";
import { SWIPE, closing, launchMrz, numbered, siteUrl } from "./launch-common";
import type {
  CaptionParts,
  Chart,
  LaunchCard,
  LaunchChartCard,
  LaunchListCard,
} from "./launch-types";

/**
 * Post 8, the state spotlight, from the state page's own view-model, so a
 * card and the page can't disagree. Every count is EOIs holding the state's
 * invitation at a month end (ruling R3 of the SEO audit): a stock, never a
 * count of invitations issued, with "<20" kept as a range.
 */

/** Occupations shown per visa on the top-occupations slide. */
export const TOP_SHOWN = 5;

/** The month chart's short labels: a hidden month is "<20", explained by the key. */
const SHORT_VALUE = { hidden: "<20", none: "0", "not-published": "n/p" };

function monthsChart(card: MonthsCardView): Chart {
  return {
    heading: card.heading,
    orientation: "columns",
    bars: card.columns.map((c) => ({
      label: c.label,
      sub: c.year,
      value: c.kind === "floor" ? c.value : SHORT_VALUE[c.kind],
      solid: c.minShare,
      hatched: c.maxShare,
      strong: false,
      empty: c.kind === "not-published",
    })),
    axis: null,
  };
}

function scoresChart(view: PoolView): Chart {
  return {
    heading: view.heading,
    orientation: "rows",
    bars: view.bars.map((b) => ({
      label: b.score,
      sub: null,
      value: b.label,
      solid: b.minShare,
      hatched: b.maxShare,
      strong: false,
      empty: false,
    })),
    axis: "Points (including nomination points) · EOIs holding an invitation",
  };
}

const restSentences = (text: string) =>
  text
    .split(/(?<=\.) /)
    .slice(1)
    .join(" ");

function topOccupations(view: StatePageView, base: CardBase): LaunchListCard {
  const day = dayText(monthEnd(view.facts.asAt));
  const groups = view.occupations.map((table) => {
    const rows = table.rows.slice(0, TOP_SHOWN);
    return {
      heading: `${table.visa} · holding an invitation, ${day}`,
      rows: rows.map((r) => ({
        label: r.occupation.name,
        value: r.latest,
        note: null,
      })),
      more: view.facts.visas[table.visa].top.withPublished - rows.length,
      visa: table.visa,
    };
  });
  const more = groups
    .filter((g) => g.more > 0)
    .map((g) => `${formatNumber(g.more)} more for ${g.visa}`);
  return {
    ...base,
    id: "launch-list",
    eyebrow: `Top occupations · ${formatMonth(view.facts.asAt)}`,
    title: view.titles.occupations.title,
    lead: restSentences(view.titles.occupations.lead),
    values: "text",
    groups: groups.map(({ heading, rows }) => ({ heading, rows })),
    note:
      more.length > 0
        ? `With a published count in the last ${SERIES_MONTHS} months: ${more.join(", ")}.`
        : null,
  };
}

/** The 2026–27 rules, verified rows only; null when none is verified yet. */
function rulesCard(view: StatePageView, base: CardBase): LaunchListCard | null {
  const groups = view.program.streams.flatMap((table) => {
    const rows = table.rows.filter((r) => r.verified);
    if (rows.length === 0) return [];
    return [
      {
        heading: `${table.visa} streams`,
        rows: rows.map((r) => ({
          label: r.name,
          value: r.status,
          note: r.who,
        })),
      },
    ];
  });
  if (groups.length === 0) return null;
  const shown = view.program.streams.flatMap((t) => t.rows);
  const checked = shown
    .filter((r) => r.verified)
    .map((r) => r.checked)
    .sort()
    .at(-1) as string;
  const hidden = shown.some((r) => !r.verified);
  const selection = view.program.selection
    .filter((s) => s.verified)
    .map((s) => s.text);
  const host = new URL(view.program.card.url).hostname.replace(/^www\./, "");
  return {
    ...base,
    id: "launch-list",
    source: `Source: ${host}, ${view.facts.programYear} program · checked ${formatDate(checked)}`,
    eyebrow: view.program.kicker,
    title: view.titles.program,
    lead: "Streams whose status we have checked on the official page.",
    values: "text",
    groups,
    note:
      [...selection, hidden ? "Other rules are still being checked." : null]
        .filter((s): s is string => s !== null)
        .join(" ") || null,
  };
}

type CardBase = {
  tag: string;
  position: null;
  source: string;
  visas: StateVisa[];
};

function pointsCard(
  view: StatePageView,
  scores: PoolView,
  base: CardBase,
): LaunchChartCard {
  return {
    ...base,
    id: "launch-chart",
    eyebrow: `Points · ${dayText(monthEnd(view.facts.asAt))}`,
    title: view.titles.points.title,
    lead: view.titles.points.lead,
    charts: [scoresChart(scores)],
    key: { solid: scores.key.published, hatched: scores.key.hidden },
    note: null,
  };
}

/** Post 8 for any state: cover, months, points (190, 491), occupations, rules, link, closing. */
export function stateCards(view: StatePageView): LaunchCard[] {
  const { page, facts } = view;
  const source = SKILLSELECT_SOURCE(dayText(monthEnd(facts.asAt)));
  const base: CardBase = {
    tag: `${page.code} · ${formatMonth(facts.asAt)}`,
    position: null,
    source,
    visas: [...STATE_VISAS],
  };
  const [months190] = view.months.cards;
  const rules = rulesCard(view, base);
  return numbered<LaunchCard>([
    {
      ...base,
      id: "launch-cover",
      eyebrow: "State spotlight · 190 · 491",
      titleLines: [page.fullName],
      sub: view.hero.answer[0],
      stamps: [
        {
          shape: "rect",
          top: view.hero.stamp.top,
          word: view.hero.stamp.word,
          bottom: formatMonth(facts.asAt).toUpperCase(),
        },
      ],
      swipe: SWIPE,
      mrz: launchMrz([page.code, "STATE", formatMonth(facts.asAt)]),
    },
    {
      ...base,
      id: "launch-chart",
      eyebrow: `190 · 491 · last ${SERIES_MONTHS} months`,
      title: view.titles.months,
      lead: view.months.lead,
      charts: view.months.cards.map(monthsChart),
      key: {
        solid: months190.key.published,
        hatched: `${months190.key.hidden} (“<20”)`,
      },
      note: null,
    },
    ...view.scores.map((scores) => pointsCard(view, scores, base)),
    topOccupations(view, base),
    ...(rules ? [rules] : []),
    {
      ...base,
      id: "launch-link",
      eyebrow: "Every figure",
      title: `See every ${page.code} figure`,
      sub: view.hero.subtitle,
      url: siteUrl(page.path),
      points: [],
      stamp: null,
    },
    closing(base.tag, source),
  ]);
}

export function stateCaption(view: StatePageView): CaptionParts {
  const { page } = view;
  return {
    hook: `${page.fullName} 190 and 491: what the SkillSelect data shows.`,
    body: [
      ...view.hero.answer,
      "Every count is EOIs holding an invitation at a month end, not new invitations, so months are never added together.",
    ],
    cta: "Save this for your EOI.",
    link: `Every figure: ${siteUrl(page.path)}`,
    hashtags: [
      "#190visa",
      "#491visa",
      "#StateNomination",
      `#${page.fullName.replace(/[^A-Za-z]/g, "")}`,
      "#SkillSelect",
      "#AustraliaPR",
      "#SkilledMigration",
      "#AustralianImmigration",
    ],
  };
}
