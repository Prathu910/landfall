import type { Visa } from "../../lib/data/types";
import type { GuideRule, VisaGuide } from "../../lib/guide/types";
import { GUIDE_CHECKED_AT, SOURCES } from "./sources";

const checkedAt = GUIDE_CHECKED_AT;

function rule(label: string, text: string, source: string): GuideRule {
  return { label, text, source, checkedAt };
}

/** The federal requirements every points-tested visa shares, from its own page. */
function sharedRequirements(source: string, listName: string): GuideRule[] {
  return [
    rule(
      "Age",
      "Under 45 when you're invited. Turning 45 after the invitation doesn't stop you applying.",
      source,
    ),
    rule(
      "English",
      "At least competent English at the time of invitation.",
      SOURCES.competentEnglish,
    ),
    rule(
      "Skills assessment",
      "A suitable assessment for your occupation at the time of invitation, obtained in the 3 years before it.",
      source,
    ),
    rule(
      "Occupation",
      `On the Home Affairs list of eligible skilled occupations for ${listName}.`,
      SOURCES.occupationList,
    ),
    rule(
      "Points",
      "At least 65 points. Your invitation states the score you must prove, which can be higher.",
      SOURCES.pointsTable,
    ),
    rule(
      "Health and character",
      "You and family applying with you meet the health requirement; applicants aged 16 and over meet the character requirement.",
      source,
    ),
  ];
}

const SUITS = {
  onshore:
    "You can apply in Australia if you hold a substantive visa or a Bridging A, B or C visa, and be in Australia when it's decided.",
  offshore:
    "You can apply, and be granted the visa, from outside Australia (not in immigration clearance).",
};

const TRAVEL = (source: string) =>
  rule(
    "Travel",
    "Travel in and out of Australia as often as you like for 5 years from the grant; after that, a Resident Return visa.",
    source,
  );

export const VISA_GUIDES: Record<Visa, VisaGuide> = {
  "189": {
    visa: "189",
    name: "Skilled Independent visa (subclass 189), Points-tested stream",
    kind: "permanent",
    what: "A permanent visa for skilled workers without a state nomination, employer or family sponsor. Home Affairs invites from the EOI pool in SkillSelect.",
    suits: SUITS,
    requirements: [
      ...sharedRequirements(SOURCES.visa189, "the 189 Points-tested stream"),
      rule(
        "Invitation",
        "You apply only after an invitation from Home Affairs, which comes from your EOI.",
        SOURCES.visa189,
      ),
    ],
    nomination: [
      rule(
        "Nomination",
        "None. 189 points are your own points, with no nomination bonus.",
        SOURCES.pointsTable,
      ),
    ],
    after: [
      rule(
        "Permanent residence",
        "You can stay in Australia indefinitely, work and study, and enrol in Medicare.",
        SOURCES.visa189,
      ),
      TRAVEL(SOURCES.visa189),
    ],
    evidenceAnchor: "rounds-heading",
  },
  "190": {
    visa: "190",
    name: "Skilled Nominated visa (subclass 190)",
    kind: "permanent",
    what: "A permanent visa for skilled workers nominated by an Australian state or territory government agency.",
    suits: SUITS,
    requirements: [
      ...sharedRequirements(SOURCES.visa190, "the 190 visa"),
      rule(
        "Nomination",
        "A state or territory agency must nominate you; Home Affairs invites only nominated EOIs.",
        SOURCES.visa190,
      ),
    ],
    nomination: [
      rule(
        "Points",
        "Nomination adds 5 points, as long as it isn't withdrawn.",
        SOURCES.pointsTable190,
      ),
      rule(
        "State criteria",
        "Each state and territory sets its own criteria, occupation list and process.",
        SOURCES.visa190,
      ),
      rule(
        "Withdrawal",
        "If the state withdraws your nomination after you apply, your application becomes invalid.",
        SOURCES.visa190,
      ),
    ],
    after: [
      rule(
        "Permanent residence",
        "You can stay in Australia indefinitely, work and study.",
        SOURCES.visa190,
      ),
      TRAVEL(SOURCES.visa190),
    ],
    evidenceAnchor: "states-heading",
  },
  "491": {
    visa: "491",
    name: "Skilled Work Regional (Provisional) visa (subclass 491)",
    kind: "provisional",
    what: "A 5-year provisional visa to live, work and study in a designated regional area, with a state or territory nomination or an eligible relative's sponsorship.",
    suits: SUITS,
    requirements: [
      ...sharedRequirements(SOURCES.visa491, "the 491 visa"),
      rule(
        "Nomination or sponsorship",
        "A state or territory agency nominates you, or an eligible relative living in a designated regional area sponsors you.",
        SOURCES.visa491,
      ),
    ],
    nomination: [
      rule(
        "Points",
        "Nomination or accepted sponsorship adds 15 points.",
        SOURCES.pointsTable491,
      ),
      rule(
        "Where you live",
        "You and family on the visa must live, work and study in a designated regional area.",
        SOURCES.visa491,
      ),
    ],
    after: [
      rule(
        "191 permanent residence",
        "After holding the 491 for at least 3 years, you can apply for the 191 with ATO notices of assessment for three income years. There is no minimum income.",
        SOURCES.visa191,
      ),
      rule(
        "Other visas",
        "Until you've held the 491 for 3 years, you can't be granted a 189, 190, 186 and some other permanent visas.",
        SOURCES.visa491,
      ),
    ],
    evidenceAnchor: "states-heading",
  },
};
