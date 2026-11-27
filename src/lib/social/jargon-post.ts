import type { GlossaryTerm } from "../guide/glossary";
import { SWIPE, closing, launchMrz, numbered, siteUrl } from "./launch-common";
import type { CaptionParts, LaunchCard, LaunchTextCard } from "./launch-types";

const TAG = "Glossary";

/**
 * One slide per term, in the brief's order: the glossary entries it quotes
 * (the first is the term itself, the second adds the detail the data
 * needs), its stamp and a one-line "in short".
 */
export const JARGON_SLIDES = [
  {
    title: "EOI",
    ids: ["eoi"],
    stamp: "EOI",
    short: "Counts are EOIs, not individuals: one person can hold several.",
  },
  {
    title: "Invitation",
    ids: ["invitation-round", "invited"],
    stamp: "INVITED",
    short:
      "A round invites EOIs; a month-end count shows EOIs still holding one.",
  },
  {
    title: "Nomination",
    ids: ["state-nomination", "nomination-points"],
    stamp: "NOMINATED",
    short: "Federal points and state selection are separate.",
  },
  {
    title: "<20",
    ids: ["masked-count"],
    stamp: "<20",
    short: "0 to 19, which may be zero. Never added up as zero.",
    facts: [
      { label: "SkillSelect shows", value: "<20" },
      { label: "MigrateLens reads", value: "0 to 19, may be zero" },
    ],
  },
  {
    title: "Cut-off",
    ids: ["cut-off", "not-listed"],
    stamp: "CUT-OFF",
    short: "The lowest score invited, in that round only.",
  },
  {
    title: "Tie-break date",
    ids: ["tie-break-date", "date-of-effect"],
    stamp: "TIE-BREAK",
    short: "Same points: the earlier date of effect goes first.",
  },
] as const;

function termOf(terms: GlossaryTerm[], id: string): GlossaryTerm {
  const term = terms.find((t) => t.id === id);
  if (!term) throw new Error(`The glossary has no ${id} term`);
  return term;
}

const GLOSSARY_URL = siteUrl("/guide/glossary/");

function termCard(
  terms: GlossaryTerm[],
  slide: (typeof JARGON_SLIDES)[number],
): LaunchTextCard {
  const entries = slide.ids.map((id) => termOf(terms, id));
  const labels = [...new Set(entries.map((t) => t.source.label))];
  return {
    id: "launch-text",
    tag: TAG,
    position: null,
    source: `Source: ${labels.join("; ")} · ${GLOSSARY_URL}`,
    visas: [],
    eyebrow: "SkillSelect term",
    title: slide.title,
    paragraphs: entries.map((t) => t.definition),
    facts: "facts" in slide ? [...slide.facts] : [],
    stamps: [
      {
        shape: "rect",
        top: "SKILLSELECT",
        word: slide.stamp,
        bottom: "IN PLAIN WORDS",
      },
    ],
    emphasis: slide.short,
  };
}

/** Post 6: a cover, one term per slide and the closing card. */
export function jargonCards(terms: GlossaryTerm[]): LaunchCard[] {
  const source = `Source: MigrateLens glossary · ${GLOSSARY_URL}`;
  return numbered<LaunchCard>([
    {
      id: "launch-cover",
      tag: TAG,
      position: null,
      source,
      visas: [],
      eyebrow: "SkillSelect terms in plain words",
      titleLines: ["What does", "“<20” mean?"],
      sub: `And ${JARGON_SLIDES.length - 1} more terms you meet in SkillSelect data, one per card.`,
      stamps: [
        { shape: "rect", top: "SKILLSELECT", word: "<20", bottom: "0 TO 19" },
      ],
      swipe: SWIPE,
      mrz: launchMrz(["GLOSSARY"]),
    },
    ...JARGON_SLIDES.map((slide) => termCard(terms, slide)),
    closing(TAG, source),
  ]);
}

export function jargonCaption(terms: GlossaryTerm[]): CaptionParts {
  return {
    hook: "What does “<20” mean in SkillSelect data?",
    body: [
      termOf(terms, "masked-count").definition,
      "EOI, invitation, nomination, cut-off and tie-break date, in plain words in this post.",
    ],
    cta: "Save this for your EOI.",
    link: `Every term: ${GLOSSARY_URL}`,
    hashtags: [
      "#SkillSelect",
      "#EOI",
      "#AustraliaPR",
      "#189visa",
      "#190visa",
      "#491visa",
      "#AustralianImmigration",
      "#SkilledMigration",
    ],
  };
}
