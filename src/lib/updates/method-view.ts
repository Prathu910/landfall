import { dayText, monthEnd } from "./format";
import type { RecapFacts, RoundSection } from "./types";

export type MethodView = {
  /** Only the sources of the sections the page shows (spec 6.4 item 9). */
  sources: { label: string; text: string; href: string }[];
  notes: string[];
  link: { href: string; text: string };
};

/** The SkillSelect EOI dashboard (manifest.sources.dashboard). */
const DASHBOARD_URL =
  "https://api.dynamic.reports.employment.gov.au/anonap/extensions/hSKLS02_SkillSelect_EOI_Data/hSKLS02_SkillSelect_EOI_Data.html";
/** The Home Affairs invitation rounds page, for months whose rounds aren't in the file. */
const ROUNDS_URL =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds";
/** The Home Affairs skilled occupation list (src/data/state-rules/federal-occupations.json). */
const FEDERAL_LIST_URL =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list";

type Round = { date: string; section: RoundSection };

function dataSource(facts: RecapFacts): MethodView["sources"][number] | null {
  const data = facts.data;
  if (!data) return null;
  const { checkedAt, previous } = data.sources;
  const earlier = previous
    ? ` Last month's figures: snapshot as at ${dayText(monthEnd(previous.month))}, checked ${dayText(previous.checkedAt)}.`
    : "";
  return {
    label: "SkillSelect EOI data",
    text: `Pools and invitations: SkillSelect EOI data (Australian Government), snapshot as at ${dayText(monthEnd(facts.month))}, checked ${dayText(checkedAt)}, reused under CC BY 3.0 AU.${earlier}`,
    href: DASHBOARD_URL,
  };
}

function roundsSource(
  facts: RecapFacts,
  rounds: Round[],
): MethodView["sources"][number] | null {
  const label = "Home Affairs SkillSelect invitation rounds";
  const nominations = Boolean(facts.data?.nominations);
  if (rounds.length > 0) {
    const checked = rounds.map((r) => r.section.sources.checkedAt).sort();
    const which = rounds.length === 1 ? "round" : "rounds";
    return {
      label,
      text: `${nominations ? `The 189 ${which}, tie-break dates and the nominations table` : `The 189 ${which} and tie-break dates`}: Home Affairs SkillSelect invitation rounds page (${which} of ${rounds.map((r) => dayText(r.date)).join(" and ")}), checked ${dayText(checked[checked.length - 1])}.`,
      href: rounds[0].section.sources.currentRounds,
    };
  }
  // A month without a round still quotes the last round and the nominations table.
  const notable = facts.data?.notable189;
  const covers = [
    notable
      ? `the ${dayText(notable.round)} round's lowest scores and tie-break dates`
      : null,
    nominations ? "the nominations table" : null,
  ].filter((s): s is string => s !== null);
  if (covers.length === 0) return null;
  const text = covers.join(" and ");
  return {
    label,
    text: `${text.charAt(0).toUpperCase()}${text.slice(1)}: Home Affairs SkillSelect invitation rounds page.`,
    href: ROUNDS_URL,
  };
}

function federalSource(
  facts: RecapFacts,
): MethodView["sources"][number] | null {
  const data = facts.data;
  if (!data || data.largePoolsNotListed.length === 0) return null;
  return {
    label: "Home Affairs skilled occupation list",
    text: `Which occupations are on the 189 list: Home Affairs skilled occupation list, checked ${dayText(data.sources.federalListCheckedAt)}.`,
    href: FEDERAL_LIST_URL,
  };
}

export function buildMethodView(
  facts: RecapFacts,
  rounds: Round[],
): MethodView {
  const sources = [
    dataSource(facts),
    roundsSource(facts, rounds),
    federalSource(facts),
  ].filter((s): s is MethodView["sources"][number] => s !== null);
  const notes = [
    "Counts are EOIs; one person can hold several.",
    ...(rounds.length > 0
      ? [
          "Home Affairs publishes each round's total and each occupation's lowest score invited, not how many EOIs each occupation got.",
        ]
      : []),
    ...(facts.data
      ? [
          'Counts under 20 are shown as "under 20" or as a range, never as a number.',
          "491 means the state-nominated stream only.",
        ]
      : []),
  ];
  return {
    sources,
    notes,
    link: { href: "/methodology/", text: "How we read the data" },
  };
}
