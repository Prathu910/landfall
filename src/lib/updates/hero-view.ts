import { formatMonth } from "../report/copy";
import { STATE_NAMES } from "../state-outlook/context";
import {
  aboutText,
  dayText,
  formatLongMonth,
  formatNumber,
  intervalText,
  longDayText,
  minimumText,
  monthEnd,
  mrzLine,
} from "./format";
import {
  cutoffBounds,
  cutoffRangeText,
  noRoundText,
  occupationsText,
  round189Total,
} from "./round-view";
import { stateLeader } from "./state-view";
import type { DataSection, RecapFacts, RoundSection } from "./types";

export type HeroView = {
  eyebrow: string;
  h1: string;
  /** The dated 2–3 sentence direct answer. */
  answer: string;
  /** `dateTime` (YYYY-MM-DD) marks a value that is a single date. */
  dateline: { label: string; value: string; dateTime?: string }[];
  /** Shown once under the hero while the month's data isn't published. */
  pendingDataNote: string | null;
  actions: { label: string; href: string }[];
};

export type PassportView = {
  label: string;
  number: string;
  stamp: {
    kind: "round" | "data";
    top: string;
    middle: string;
    bottom: string;
    text: string;
  };
  figures: { value: string; label: string }[];
  /** Decorative; the figures carry the text. */
  mrz: string;
};

type Round = { date: string; section: RoundSection };

function spreadClause(section: RoundSection): string {
  const { lowest, highest } = cutoffBounds(section);
  return lowest.score === highest
    ? `${highest} points was the lowest score invited for each`
    : `the lowest score invited ranged from ${lowest.score} to ${highest} points by occupation`;
}

function roundSentence(round: Round, asAt: boolean): string {
  const { date, section } = round;
  const total = formatNumber(round189Total(section));
  // "; " joins whole clauses, so a meta description can stop at it.
  const across = `across ${occupationsText(section.occupations.length)}; ${spreadClause(section)}.`;
  return asAt
    ? `Home Affairs invited ${total} EOIs for the 189 visa on ${longDayText(date)}, ${across}`
    : `On ${longDayText(date)}, Home Affairs invited ${total} EOIs for the 189 visa, ${across}`;
}

function earlierRoundSentence(rounds: Round[]): string | null {
  const earlier = rounds[1];
  if (!earlier) return null;
  return `An earlier round on ${longDayText(earlier.date)} invited ${formatNumber(round189Total(earlier.section))} EOIs.`;
}

function stateSentence(data: DataSection): string {
  const leader = stateLeader(data.states["190"]);
  if (!leader) return "Every state was under 20 for each occupation for 190.";
  const rank = leader.strictlyMost
    ? "the most of any state"
    : "the highest published minimum of any state";
  return `At least ${formatNumber(leader.floor)} EOIs held a 190 invitation from ${STATE_NAMES[leader.state]}, ${rank}.`;
}

function heroAnswer(facts: RecapFacts, rounds: Round[]): string {
  const data = facts.data;
  if (!data) {
    return [roundSentence(rounds[0], false), earlierRoundSentence(rounds)]
      .filter((s): s is string => s !== null)
      .join(" ");
  }
  const asAt = `As at ${longDayText(monthEnd(facts.month))}:`;
  if (rounds.length === 0) {
    return `${asAt} ${stateSentence(data)} ${noRoundText(facts)}.`;
  }
  const sentences = [
    `${asAt} ${roundSentence(rounds[0], true)}`,
    earlierRoundSentence(rounds),
    stateSentence(data),
  ];
  return sentences.filter((s): s is string => s !== null).join(" ");
}

function dateline(facts: RecapFacts, rounds: Round[]): HeroView["dateline"] {
  const checked = [
    ...rounds.map((r) => r.section.sources.checkedAt),
    ...(facts.data ? [facts.data.sources.checkedAt] : []),
  ].sort();
  return [
    {
      label: "Updated",
      value: dayText(facts.updatedAt),
      dateTime: facts.updatedAt,
    },
    ...(rounds.length > 0
      ? [
          {
            label: rounds.length === 1 ? "189 round" : "189 rounds",
            value: rounds.map((r) => dayText(r.date)).join(" and "),
            ...(rounds.length === 1 ? { dateTime: rounds[0].date } : {}),
          },
        ]
      : []),
    ...(facts.data
      ? [
          {
            label: "Data as at",
            value: dayText(monthEnd(facts.month)),
            dateTime: monthEnd(facts.month),
          },
        ]
      : []),
    {
      label: "Sources checked",
      value: dayText(checked[checked.length - 1]),
      dateTime: checked[checked.length - 1],
    },
  ];
}

function stamp(facts: RecapFacts, rounds: Round[]): PassportView["stamp"] {
  const upper = (date: string) => dayText(date).toUpperCase();
  const parts = rounds[0]
    ? {
        kind: "round" as const,
        top: "SUBCLASS 189 ROUND",
        middle: `${formatNumber(round189Total(rounds[0].section))} INVITED`,
        bottom: upper(rounds[0].date),
      }
    : {
        kind: "data" as const,
        top: "SKILLSELECT",
        middle: formatMonth(facts.month).toUpperCase(),
        bottom: `AS AT ${upper(monthEnd(facts.month))}`,
      };
  return {
    ...parts,
    text: [parts.top, parts.middle, parts.bottom].join(" · "),
  };
}

function passportFigures(
  facts: RecapFacts,
  rounds: Round[],
): PassportView["figures"] {
  const figures: PassportView["figures"] = [];
  const newest = rounds[0];
  if (newest) {
    figures.push(
      {
        value: formatNumber(newest.section.occupations.length),
        label: `occupations listed in the ${dayText(newest.date)} round`,
      },
      {
        value: cutoffRangeText(newest.section),
        label: "lowest score invited, by occupation (points)",
      },
    );
  }
  const data = facts.data;
  if (!data) return figures;
  const end = dayText(monthEnd(facts.month));
  const pool = data.national["189"].submitted.current;
  const about = aboutText(pool);
  figures.push(
    about
      ? {
          value: about,
          label: `EOIs in the 189 pool on ${end} (${intervalText(pool)})`,
        }
      : { value: intervalText(pool), label: `EOIs in the 189 pool on ${end}` },
    {
      value: minimumText(data.national["189"].invited.current),
      label: `EOIs holding a 189 invitation on ${end} (a minimum)`,
    },
  );
  if (!newest) {
    figures.push({
      value: minimumText(data.national["190"].invited.current),
      label: `EOIs holding a 190 invitation on ${end} (a minimum)`,
    });
  }
  return figures;
}

/** The recap's hero: headline, dated direct answer and dateline (spec 6.4 item 2). */
export function buildHero(facts: RecapFacts, rounds: Round[]): HeroView {
  const month = formatLongMonth(facts.month);
  return {
    eyebrow: `SkillSelect update · ${month}`,
    h1: rounds[0]
      ? `SkillSelect ${month}: ${formatNumber(round189Total(rounds[0].section))} EOIs invited in the 189 round`
      : `SkillSelect ${month}: 190 and 491 invitations by state`,
    answer: heroAnswer(facts, rounds),
    dateline: dateline(facts, rounds),
    pendingDataNote: facts.data
      ? null
      : `SkillSelect's ${month.split(" ")[0]} figures for pools and state invitations will be added here when they are published.`,
    actions: [
      { label: "Check my points free", href: "/check/" },
      { label: "Questions", href: "#faq" },
    ],
  };
}

/** The key-figures panel: the newest round's stamp, or the data stamp without one. */
export function buildPassport(
  facts: RecapFacts,
  rounds: Round[],
): PassportView {
  return {
    label: "Key figures",
    number: `No. ${facts.month}`,
    stamp: stamp(facts, rounds),
    figures: passportFigures(facts, rounds),
    mrz: mrzLine(facts.month),
  };
}
