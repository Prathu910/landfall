import type { Visa } from "../data/types";
import { formatDate } from "../migration";
import type { FaqEntry } from "../seo/json-ld";
import type { FederalList } from "../state-outlook/rules-types";
import { formatFeeAmount } from "./costs";
import type { Fee, FeeCatalogue, GuideStep } from "./types";

/** How many codes the Home Affairs list names for each visa; null when unreadable. */
export function federalCounts(
  federal: FederalList | null,
): Record<Visa, number> | null {
  if (!federal) return null;
  const entries = Object.values(federal.entries);
  const count = (visa: Visa) => entries.filter((e) => e[visa]).length;
  return { "189": count("189"), "190": count("190"), "491": count("491") };
}

/** A visa charge is one fixed amount for everyone, wherever they are. */
const fee = (f: Fee) => ("kind" in f.amount ? formatFeeAmount(f.amount) : "");

function chargesLine(fees: FeeCatalogue, visa: Visa): string {
  const c = fees.visaCharges[visa];
  return `${fee(c.main)} for the main applicant, ${fee(c.adult)} for each extra applicant aged 18 or over and ${fee(c.child)} for each one under 18`;
}

/** The guide hub's questions; every figure comes from the sourced data. */
export function hubFaq(
  fees: FeeCatalogue,
  steps: GuideStep[],
  checkedAt: string,
): FaqEntry[] {
  const asAt = formatDate(fees.feesAsAt);
  return [
    {
      question:
        "What are the steps to Australian PR through skilled migration?",
      answer: `${steps.map((s, i) => `${i + 1}. ${s.title}`).join("; ")}. State nomination applies to the 190 and 491 only.`,
    },
    {
      question: "Is 65 points enough for Australian PR?",
      answer:
        "65 points is the pass mark to be invited, not a promise of an invitation. Home Affairs invites when you score enough points and places are available for your occupation, so the points that are invited differ by occupation and round.",
    },
    {
      question: "How long do I have to apply after an invitation?",
      answer:
        "60 calendar days from the date of the invitation. Home Affairs says it can't extend this time.",
    },
    {
      question: "Can I apply from outside Australia?",
      answer:
        "Yes. You can submit an EOI, apply and be granted a 189, 190 or 491 from outside Australia (not in immigration clearance). Applying in Australia, you need a substantive visa or a Bridging A, B or C visa.",
    },
    {
      question: "What is the difference between the 190 and the 491?",
      answer:
        "The 190 is permanent and its nomination adds 5 points. The 491 is a 5-year provisional visa for designated regional areas; its nomination adds 15 points, and after holding it for 3 years you can apply for the permanent 191.",
    },
    {
      question: "How much does a skilled visa cost?",
      answer: `The 189 visa application charge is ${chargesLine(fees, "189")}; the 190 and 491 are ${chargesLine(fees, "190")} (fees as at ${asAt}). Skills assessment, English tests, state nomination, health checks and police certificates are extra.`,
    },
    {
      question: "Does an EOI cost anything?",
      answer:
        "No. An expression of interest in SkillSelect is free and is not a visa application. You could be invited up to 2 years after you submit it.",
    },
    {
      question: "Is the points test changing?",
      answer: `The 2026–27 Budget (12 May 2026) announced a reform of the points test, but no new points table or start date had been published when we checked on ${formatDate(checkedAt)}. This guide uses the current Home Affairs points table.`,
    },
  ];
}

/** Questions for one visa's guide. */
export function visaFaq(
  visa: Visa,
  fees: FeeCatalogue,
  counts: Record<Visa, number> | null,
): FaqEntry[] {
  const asAt = formatDate(fees.feesAsAt);
  const cost: FaqEntry = {
    question: `How much does the ${visa} visa cost?`,
    answer: `The visa application charge is ${chargesLine(fees, visa)}, as at ${asAt}. Skills assessment, English tests, health checks and police certificates are extra${visa === "189" ? "" : ", and some states charge a nomination fee"}.`,
  };
  const listed: FaqEntry | null = counts
    ? {
        question: `How many occupations are on the ${visa} list?`,
        answer: `The Home Affairs skilled occupation list names ${counts[visa]} occupations for the ${visa}. Each occupation's MigrateLens page shows its published EOIs and invitations.`,
      }
    : null;
  const byVisa: Record<Visa, FaqEntry[]> = {
    "189": [
      {
        question: "Do I need a nomination or job offer for the 189?",
        answer:
          "No. The 189 needs no state nomination, employer or family sponsor. Home Affairs invites from the EOI pool, so 189 points are your own points with no nomination bonus.",
      },
      {
        question: "Is the 189 a permanent visa?",
        answer:
          "Yes. It lets you stay in Australia indefinitely, with travel in and out for 5 years from the grant.",
      },
    ],
    "190": [
      {
        question: "How does state nomination for the 190 work?",
        answer:
          "Select the 190 and one or more states in your EOI. Each state and territory sets its own criteria and occupation list; if one nominates you, Home Affairs invites you and the nomination adds 5 points.",
      },
      {
        question: "Is the 190 a permanent visa?",
        answer:
          "Yes. If the state withdraws the nomination after you apply, though, the application becomes invalid.",
      },
    ],
    "491": [
      {
        question: "Is the 491 a PR visa?",
        answer:
          "No. It is a 5-year provisional visa. After holding it for at least 3 years, with ATO notices of assessment for three income years, you can apply for the permanent 191.",
      },
      {
        question: "Where can I live on a 491?",
        answer:
          "You and family on the visa must live, work and study in a designated regional area of Australia.",
      },
    ],
  };
  return [...byVisa[visa], cost, ...(listed ? [listed] : [])];
}
