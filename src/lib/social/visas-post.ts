import type { Visa } from "../data/types";
import {
  compareRows,
  differenceAnswer,
  type CompareRow,
} from "../guide/compare";
import type { FeeCatalogue, VisaGuide } from "../guide/types";
import { formatDate } from "../migration";
import {
  SWIPE,
  VISA_STAMPS,
  closing,
  launchMrz,
  numbered,
  siteUrl,
} from "./launch-common";
import type { CaptionParts, LaunchCard, LaunchListCard } from "./launch-types";

const TAG = "189 · 190 · 491";
const VISAS: Visa[] = ["189", "190", "491"];

/**
 * The guide's comparison rows without the visa charge: the launch pack
 * carries no prices (the guide pages do, dated and sourced).
 */
export function visaRows(fees: FeeCatalogue): CompareRow[] {
  return compareRows(fees, null).filter((r) => !/charge/i.test(r.label));
}

const capitalise = (text: string) => text[0].toUpperCase() + text.slice(1);

/** "Skilled Independent" from "Skilled Independent visa (subclass 189), …". */
export function shortName(guide: VisaGuide): string {
  return guide.name.split(" visa")[0];
}

function visaCard(
  guide: VisaGuide,
  rows: CompareRow[],
  source: string,
): LaunchListCard {
  return {
    id: "launch-list",
    tag: TAG,
    position: null,
    source,
    visas: [guide.visa],
    eyebrow: `Subclass ${guide.visa}`,
    title: shortName(guide),
    lead: guide.what,
    values: "stacked",
    groups: [
      {
        heading: null,
        rows: rows.map((r) => ({
          label: r.label,
          value: r.values[guide.visa],
          note: null,
        })),
      },
    ],
    note: null,
  };
}

/** The 491's three "191:" rules from the Home Affairs 191 page. */
function pathwayCard(guide: VisaGuide, source: string): LaunchListCard {
  const rules = guide.after.filter((r) => r.label.startsWith("191:"));
  if (rules.length === 0) throw new Error("The 491 guide has no 191 rules");
  return {
    id: "launch-list",
    tag: TAG,
    position: null,
    source,
    visas: ["491"],
    eyebrow: "From 491 to permanent residence",
    title: "The 191 pathway",
    lead: `The permanent 191 is the step after the 491. Home Affairs lists ${rules.length} requirements.`,
    values: "stacked",
    groups: [
      {
        heading: null,
        rows: rules.map((r) => ({
          label: capitalise(r.label.replace("191: ", "")),
          value: r.text,
          note: null,
        })),
      },
    ],
    note: null,
  };
}

export type VisasInput = {
  guides: Record<Visa, VisaGuide>;
  fees: FeeCatalogue;
  checkedAt: string;
};

/** Post 5: a cover, one slide per visa, the 191 pathway, side by side, closing. */
export function visasCards({
  guides,
  fees,
  checkedAt,
}: VisasInput): LaunchCard[] {
  const source = `Source: Home Affairs visa pages · checked ${formatDate(checkedAt)}`;
  const rows = visaRows(fees);
  const base = { tag: TAG, position: null, source, visas: VISAS };
  return numbered<LaunchCard>([
    {
      ...base,
      id: "launch-cover",
      eyebrow: "Australian skilled visas",
      titleLines: ["189 vs 190", "vs 491"],
      sub: "One points test, three visas: who nominates you, which are permanent, and the 491's path to PR.",
      stamps: [VISA_STAMPS["190"], VISA_STAMPS["491"], VISA_STAMPS["189"]],
      swipe: SWIPE,
      mrz: launchMrz(["VISAS", "189", "190", "491"]),
    },
    ...VISAS.map((visa) => visaCard(guides[visa], rows, source)),
    pathwayCard(guides["491"], source),
    {
      ...base,
      id: "launch-compare",
      eyebrow: "Side by side",
      title: "189 vs 190 vs 491",
      columns: VISAS,
      rows: rows.map((r) => ({
        label: r.label,
        values: VISAS.map((v) => r.values[v]),
      })),
      note: "All three use the same points test and start with an EOI in SkillSelect.",
    },
    closing(TAG, source),
  ]);
}

export function visasCaption(
  points190: number,
  points491: number,
): CaptionParts {
  return {
    hook: "189, 190 or 491: what's the difference?",
    body: [
      differenceAnswer(points190, points491),
      "All three use the same points test and start with an EOI in SkillSelect.",
    ],
    cta: "Save this for your EOI.",
    link: `Step by step: ${siteUrl("/guide/")}`,
    hashtags: [
      "#189visa",
      "#190visa",
      "#491visa",
      "#AustraliaPR",
      "#SkillSelect",
      "#StateNomination",
      "#SkilledMigration",
      "#AustralianImmigration",
    ],
  };
}
