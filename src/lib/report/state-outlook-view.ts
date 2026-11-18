import type { OccupationCore, StateVisa } from "../data/types";
import type { Profile } from "../migration";
import { stateOutlook, type Outlook } from "../state-outlook/outlook";
import { questionsNeeded, type Question } from "../state-outlook/questions";
import type {
  FederalList,
  ImportedList,
  StateRules,
} from "../state-outlook/rules-types";
import {
  buildAnyStateTile,
  buildStatePanel,
  buildTiles,
  type StatePanel,
  type Tile,
} from "../state-outlook/view";
import { formatMonth } from "./copy";

/** The curated rules plus the imported lists they reference. */
export type StateRuleData = {
  rules: StateRules;
  lists: Record<string, ImportedList>;
  /** Null when the official federal list could not be read: every tile is then unverified. */
  federal: FederalList | null;
};

export type AnyStateTile = ReturnType<typeof buildAnyStateTile>;

export type StateOutlookView = {
  subtitle: string;
  summaryByVisa: Record<StateVisa, string>;
  tilesByVisa: Record<StateVisa, Tile[]>;
  panelsByVisa: Record<StateVisa, StatePanel[]>;
  anyStateByVisa: Record<StateVisa, AnyStateTile>;
  defaultVisa: StateVisa;
  /** The optional "Sharpen my state outlook" questions that would change a tile. */
  questions: Question[];
};

const VISAS: StateVisa[] = ["190", "491"];

function subtitle(core: OccupationCore, rules: StateRules): string {
  const year = rules.programYear.replace("-", "–");
  return `How each state's ${year} nomination rules read against your answers, beside the invitations each state published at or below your points (SkillSelect, as at ${formatMonth(core.asAt)}). The groups describe published evidence, not your chances.`;
}

function panelsFor(
  outlook: Outlook,
  rules: StateRules,
  points: number,
  asOf: string,
): StatePanel[] {
  return outlook.states.map((outcome) =>
    buildStatePanel(
      outcome,
      rules.rules.find(
        (r) => r.state === outcome.state && r.visa === outcome.visa,
      ),
      points,
      asOf,
    ),
  );
}

function byVisa<T>(make: (visa: StateVisa) => T): Record<StateVisa, T> {
  return { "190": make("190"), "491": make("491") };
}

/**
 * The state outlook for both nominated visas. Each visa's evidence is read at
 * that visa's points with nomination (`points`).
 */
export function buildStateOutlookView(input: {
  core: OccupationCore;
  profile: Profile;
  asOf: string;
  points: Record<StateVisa, number>;
  data: StateRuleData;
}): StateOutlookView {
  const { core, profile, asOf, points, data } = input;
  const outlooks = byVisa((visa) =>
    stateOutlook({
      core,
      rules: data.rules,
      lists: data.lists,
      federal: data.federal,
      profile,
      points: points[visa],
      visa,
      asOf,
    }),
  );
  return {
    subtitle: subtitle(core, data.rules),
    summaryByVisa: byVisa((visa) => outlooks[visa].summary),
    tilesByVisa: byVisa((visa) => buildTiles(outlooks[visa], points[visa])),
    panelsByVisa: byVisa((visa) =>
      panelsFor(outlooks[visa], data.rules, points[visa], asOf),
    ),
    anyStateByVisa: byVisa((visa) =>
      buildAnyStateTile(outlooks[visa].anyState, points[visa]),
    ),
    defaultVisa: "190",
    questions: questionsNeeded(
      VISAS.map((visa) => outlooks[visa]),
      profile,
    ),
  };
}
