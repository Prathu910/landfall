import type { MonthKey, StateKey, StateVisa } from "../data/types";
import { formatDate } from "../migration";
import { formatMonth } from "../report/copy";
import type { FaqEntry } from "../seo/json-ld";
import type { StateCard } from "../states-page/state-cards";
import { occupationLinker, type OccLink } from "../updates/round-view";
import {
  buildStateSection,
  type StateSectionView,
} from "../updates/state-view";
import type { StateFigure } from "../updates/types";
import {
  dayText,
  hiddenCountsText,
  leastText,
  monthEnd,
} from "../updates/format";
import { stateAnswer, stateSourceLine } from "./answer";
import { figureText, poolText, scoreSpanText, withArticle } from "./copy";
import { buildStateFacts, type StateFacts, type StatePageInput } from "./facts";
import { stateFaq } from "./faq";
import { monthsCardView, type MonthsCardView } from "./months-view";
import { nominationText } from "./nominations";
import { STATE_VISAS, type SelectionLine, type StreamRow } from "./program";
import { stateScoreView } from "./scores";
import type { PoolView } from "../updates/data-view";
import { statePath, type StatePage } from "./slug";
import { SERIES_MONTHS } from "./series";
import { method, sectionTitles } from "./view-text";

export type StateViewInput = StatePageInput & {
  /** Codes with an occupation page; others stay unlinked. */
  occupationPages: ReadonlySet<string>;
  /** Months with a recap page, so the method links the data month's recap. */
  recapMonths: readonly MonthKey[];
  /** Every state's figures for the data month (`stateFigures`), for the comparison. */
  allStates: Record<StateVisa, Record<StateKey, StateFigure>>;
};

export type GlanceTile = { label: string; figure: string; note: string | null };

export type OccupationTableView = {
  visa: StateVisa;
  caption: string;
  columns: {
    occupation: string;
    latest: string;
    scores: string;
    months: string;
  };
  rows: {
    occupation: OccLink;
    latest: string;
    scores: string;
    months: string;
  }[];
  after: string | null;
  empty: string | null;
};

export type StreamTableView = {
  visa: StateVisa;
  caption: string;
  rows: StreamRow[];
};

export type SelectionView = Omit<SelectionLine, "visa" | "checked"> & {
  label: string;
  checked: string;
};

export type StatePageView = {
  facts: StateFacts;
  page: StatePage & { path: string };
  hero: {
    crumbs: { name: string; href: string }[];
    eyebrow: string;
    h1: string;
    subtitle: string;
    answer: string[];
    source: string;
    sourceLinks: { text: string; href: string }[];
    dateline: { label: string; value: string; dateTime: string }[];
    stamp: { top: string; word: string; bottom: string };
  };
  glance: { tiles: GlanceTile[]; nominations: string | null };
  months: { lead: string; cards: MonthsCardView[] };
  scores: PoolView[];
  occupations: OccupationTableView[];
  program: {
    /** "2026–27 rules". */
    kicker: string;
    card: StateCard;
    streams: StreamTableView[];
    selection: SelectionView[];
  };
  report: { heading: string; text: string };
  /** Each band's heading and lead. */
  titles: {
    glance: string;
    months: string;
    points: { title: string; lead: string };
    occupations: { title: string; lead: string; listLink: string };
    program: string;
    faq: string;
  };
  compare: StateSectionView[];
  faq: FaqEntry[];
  method: {
    notes: string[];
    links: { text: string; href: string }[];
  };
};

function glance(facts: StateFacts): StatePageView["glance"] {
  const { searchName } = facts.page;
  const day = dayText(monthEnd(facts.asAt));
  const held = STATE_VISAS.map((visa) => {
    const latest = facts.visas[visa].latest;
    return {
      label: `Holding ${withArticle(facts.page.code, searchName)} ${visa} invitation, ${day}`,
      figure: figureText(latest),
      note:
        latest && latest.total.min > 0
          ? hiddenCountsText(latest.maskedCells)
          : "Each occupation's count is hidden under 20",
    };
  });
  const waiting = STATE_VISAS.map((visa) => ({
    label: `EOIs waiting that name ${searchName}, ${visa}`,
    figure: poolText(facts.visas[visa].pool),
    note: "EOIs, not individuals; one EOI can name several states",
  }));
  const n = facts.nominations;
  return {
    tiles: [...held, ...waiting],
    nominations: n
      ? `Home Affairs nominations, ${n.programYear.replace("-", "–")} to ${dayText(n.to)}: 190 ${nominationText(n.byVisa["190"].text)} · 491 ${nominationText(n.byVisa["491"].text)}`
      : null,
  };
}

function occupationTable(
  facts: StateFacts,
  visa: StateVisa,
  link: (ref: { code: string; name: string }) => OccLink,
): OccupationTableView {
  const { searchName } = facts.page;
  const { rows, withPublished } = facts.visas[visa].top;
  const more = withPublished - rows.length;
  const occupations = more === 1 ? "occupation" : "occupations";
  return {
    visa,
    caption: `${searchName} ${visa}: occupations with a published count of EOIs holding an invitation`,
    columns: {
      occupation: "Occupation",
      latest: `Holding an invitation, ${dayText(monthEnd(facts.asAt))}`,
      scores: "Scores with a published count",
      months: `Months with 20 or more, of ${SERIES_MONTHS}`,
    },
    rows: rows.map((row) => ({
      occupation: link(row),
      latest: !row.latest
        ? "not published"
        : row.latest.min > 0
          ? leastText(row.latest)
          : "under 20 at each score",
      scores: scoreSpanText(row.publishedScores),
      months: String(row.monthsWith20),
    })),
    after:
      more > 0
        ? `${more} more ${occupations} had a published count of 20 or more in the last ${SERIES_MONTHS} months.`
        : null,
    empty:
      rows.length === 0
        ? `No occupation had a published count of 20 or more for ${searchName} ${visa} in the last ${SERIES_MONTHS} months: every count was under 20 for each occupation and score.`
        : null,
  };
}

/** One line when 190 and 491 share the same selection text, as most states do. */
function selectionViews(facts: StateFacts): SelectionView[] {
  const [first, second] = facts.selection;
  const same = first && second && first.text === second.text;
  const lines = same ? [first] : facts.selection;
  return lines.map(({ visa, checked, ...line }) => ({
    ...line,
    label: same ? "190 and 491" : visa,
    checked: `Checked ${formatDate(checked)}${line.verified ? "" : " (not yet verified on the official page)"}`,
  }));
}

export function buildStatePageView(input: StateViewInput): StatePageView {
  const facts = buildStateFacts(input);
  const { page, asAt, manifest } = facts;
  const link = occupationLinker(input.occupationPages);
  const months = facts.visas["190"].series.months;
  const window = `${formatMonth(months[0]?.month ?? asAt)} to ${formatMonth(asAt)}`;
  const day = dayText(monthEnd(asAt));
  const a = withArticle(page.code, page.searchName);
  return {
    facts,
    page: { ...page, path: statePath(page.code) },
    hero: {
      crumbs: [
        { name: "Home", href: "/" },
        { name: "States", href: "/states/" },
        { name: page.fullName, href: statePath(page.code) },
      ],
      eyebrow: "190 and 491 state nomination",
      h1: `${page.fullName} (${page.code}) 190 and 491 invitation data`,
      subtitle: `EOIs holding ${a} 190 or 491 invitation at each month end, by points and occupation: ${window} SkillSelect data.`,
      answer: stateAnswer(facts),
      source: stateSourceLine(facts),
      sourceLinks: [
        { text: "SkillSelect EOI data", href: manifest.sources.dashboard },
        {
          text: "Invitation rounds page",
          href: manifest.sources.currentRounds,
        },
      ],
      dateline: [
        { label: "Data month", value: formatMonth(asAt), dateTime: asAt },
        {
          label: "Last updated",
          value: formatDate(manifest.checkedAt),
          dateTime: manifest.checkedAt,
        },
        {
          label: "Rules checked",
          value: formatDate(facts.rulesCheckedAt),
          dateTime: facts.rulesCheckedAt,
        },
      ],
      stamp: {
        top: "SKILLSELECT",
        word: page.code,
        bottom: `190 · 491 · ${formatMonth(asAt).toUpperCase()}`,
      },
    },
    glance: glance(facts),
    months: {
      lead: `Each bar is the number of EOIs holding ${a} invitation on the last day of the month. It is a month-end count, not a count of new invitations: an invitation stays in it until it is used or lapses, so months overlap and are never added together.`,
      cards: STATE_VISAS.map((visa) =>
        monthsCardView(facts.visas[visa], page.searchName),
      ),
    },
    scores: STATE_VISAS.map((visa) =>
      stateScoreView(facts.visas[visa].scores, visa, page.searchName, asAt),
    ),
    occupations: STATE_VISAS.map((visa) => occupationTable(facts, visa, link)),
    program: {
      kicker: `${facts.programYear} rules`,
      card: facts.card,
      streams: STATE_VISAS.map((visa) => ({
        visa,
        caption: `${page.searchName} ${visa} streams, ${facts.programYear}`,
        rows: facts.streams.filter((row) => row.visa === visa),
      })).filter((table) => table.rows.length > 0),
      selection: selectionViews(facts),
    },
    report: {
      heading: `Where would ${page.searchName} put your points?`,
      text: `The free check gives your points and three visa stamps, 189, 190 and 491, with no email or account. The full personal report then checks your answers against ${page.searchName}'s ${facts.programYear} rules and this invitation data, beside the other seven states and territories. It is a one-off purchase, free for founding readers while places last, with a 7-day no-questions refund.`,
    },
    compare: STATE_VISAS.map((visa) =>
      buildStateSection(
        visa,
        { states: input.allStates, nominations: null },
        asAt,
        link,
        {
          stateHref: statePath,
          current: page.code,
          heading: `EOIs holding a ${visa} invitation, by state, ${day}`,
        },
      ),
    ),
    titles: sectionTitles(page.searchName, a, facts.programYear),
    faq: stateFaq(facts),
    method: method(facts, input.recapMonths),
  };
}
