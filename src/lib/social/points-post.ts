import type {
  PointsFactor,
  PointsFactorId,
  PointsRow,
} from "../../data/guide/points-table";
import { formatDate } from "../migration";
import { pointsTableAnswer } from "../guide/points-table";
import { SWIPE, closing, launchMrz, numbered, siteUrl } from "./launch-common";
import type {
  CaptionParts,
  LaunchCard,
  LaunchListCard,
  ListRow,
} from "./launch-types";

const TAG = "Points table";

/**
 * The slides of the points post, in order: which factor's rows each shows,
 * split by row id where one factor spans two slides (the extras: study on
 * the qualifications slide, the rest on "other points").
 */
type Group = {
  eyebrow: string;
  /** A factor's own question, unless the slide joins two factors. */
  title: string | null;
  parts: { factor: PointsFactorId; rows?: string[]; heading?: string }[];
};

const STUDY = ["australian-study", "regional-study"];
const OTHER = ["professional-year", "community-language"];

export const POINTS_GROUPS: Group[] = [
  { eyebrow: "Age", title: null, parts: [{ factor: "age" }] },
  { eyebrow: "English", title: null, parts: [{ factor: "english" }] },
  {
    eyebrow: "Skilled work",
    title: null,
    parts: [{ factor: "employment" }],
  },
  {
    eyebrow: "Qualifications and study",
    title: "How many points do qualifications and study give?",
    parts: [
      { factor: "qualification", heading: "Your highest qualification" },
      { factor: "extras", rows: STUDY, heading: "Study in Australia" },
    ],
  },
  { eyebrow: "Partner", title: null, parts: [{ factor: "partner" }] },
  {
    eyebrow: "Other points",
    title: null,
    parts: [{ factor: "extras", rows: OTHER }],
  },
  {
    eyebrow: "Nomination and sponsorship",
    title: null,
    parts: [{ factor: "nomination" }],
  },
];

function factorOf(table: PointsFactor[], id: PointsFactorId): PointsFactor {
  const factor = table.find((f) => f.id === id);
  if (!factor) throw new Error(`The points table has no ${id} factor`);
  return factor;
}

const pointsText = (points: number) => (points > 0 ? `+${points}` : "0");

const row = (r: PointsRow): ListRow => ({
  label: r.band,
  value: pointsText(r.points),
  note: null,
});

/** Skilled work splits by where it was done; the cap stays its own row. */
function employmentGroups(rows: PointsRow[]): LaunchListCard["groups"] {
  // "Outside Australia, 3 to 4 years" reads "3 to 4 years" under its heading.
  const where = (prefix: string) =>
    rows
      .filter((r) => r.id.startsWith(prefix))
      .map((r) => ({ ...r, band: r.band.replace(/^[^,]+, /, "") }));
  return [
    { heading: "Outside Australia", rows: where("overseas-").map(row) },
    { heading: "In Australia", rows: where("australia-").map(row) },
    {
      heading: "Both together",
      rows: where("employment-cap").map((r) => ({
        ...row(r),
        value: `${r.points} max`,
      })),
    },
  ];
}

/** The note's sentence that names `word`, e.g. regional study's condition. */
function noteSentence(note: string, word: string): string | null {
  return note.split(/(?<=\.) /).find((s) => s.includes(word)) ?? null;
}

/** "What else gives 5 points?" when every row gives the same points. */
function otherTitle(groups: LaunchListCard["groups"]): string {
  const values = new Set(groups.flatMap((g) => g.rows.map((r) => r.value)));
  const [only] = values;
  return values.size === 1
    ? `What else gives ${only.replace("+", "")} points?`
    : "What else gives points?";
}

function groupCard(
  table: PointsFactor[],
  group: Group,
  source: string,
): LaunchListCard {
  const factors = group.parts.map((p) => factorOf(table, p.factor));
  const [first] = factors;
  const groups = group.parts.flatMap((part, i) => {
    const rows = factors[i].rows.filter(
      (r) => !part.rows || part.rows.includes(r.id),
    );
    if (part.factor === "employment") return employmentGroups(rows);
    return [{ heading: part.heading ?? null, rows: rows.map(row) }];
  });
  const other = group.parts.some((p) => p.rows === OTHER);
  const study = group.parts.some((p) => p.rows === STUDY);
  return {
    id: "launch-list",
    tag: TAG,
    position: null,
    source,
    visas: ["189", "190", "491"],
    eyebrow: `Points table · ${group.eyebrow}`,
    title: group.title ?? (other ? otherTitle(groups) : first.question),
    lead: other
      ? (noteSentence(first.note, "add up") ?? first.note)
      : first.note,
    values: "points",
    groups,
    note: study ? noteSentence(factors[1].note, "Regional") : null,
  };
}

/** The source line every slide carries: the table's page and the day it was checked. */
export function pointsSource(table: PointsFactor[]): string {
  return `Source: Home Affairs points table · checked ${formatDate(table[0].checkedAt)}`;
}

/** Post 4: a cover, one slide per group, "Where do you land?" and the closing card. */
export function pointsCards(
  table: PointsFactor[],
  passMark: number,
): LaunchCard[] {
  const source = pointsSource(table);
  const base = { tag: TAG, position: null, source, visas: [] };
  return numbered<LaunchCard>([
    {
      ...base,
      id: "launch-cover",
      visas: ["189", "190", "491"],
      eyebrow: "Points test · 189 · 190 · 491",
      titleLines: ["The points", "table"],
      sub: `Where every point comes from, in ${POINTS_GROUPS.length} cards. The pass mark is ${passMark}.`,
      stamps: [
        {
          shape: "round",
          top: "POINTS TEST",
          word: `PASS MARK ${passMark}`,
          bottom: "189 · 190 · 491",
        },
      ],
      swipe: SWIPE,
      mrz: launchMrz(["POINTS", "TABLE"]),
    },
    ...POINTS_GROUPS.map((group) => groupCard(table, group, source)),
    {
      ...base,
      id: "launch-link",
      eyebrow: "Your turn",
      title: "Where do you land?",
      sub: "Add up your own points in the free check, then see a stamp for each of the 189, 190 and 491.",
      url: siteUrl("/check/"),
      points: [
        "Free, with no email or account",
        `The full table: ${siteUrl("/guide/points-table/")}`,
      ],
      stamp: null,
    },
    closing(TAG, source),
  ]);
}

export function pointsCaption(table: PointsFactor[]): CaptionParts {
  return {
    hook: `Where does every point come from? The points table in ${POINTS_GROUPS.length} cards.`,
    body: [pointsTableAnswer(table)],
    cta: "Save this for your EOI.",
    link: `The full table: ${siteUrl("/guide/points-table/")}`,
    hashtags: [
      "#PointsTest",
      "#AustraliaPR",
      "#SkillSelect",
      "#189visa",
      "#190visa",
      "#491visa",
      "#EOI",
      "#SkilledMigration",
    ],
  };
}
