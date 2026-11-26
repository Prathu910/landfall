import { formatDate } from "../migration";
import type { FaqEntry } from "../seo/json-ld";

/**
 * The methodology page's questions: rendered as <details> (answers in the
 * server HTML) and as FAQPage JSON-LD from this one list (audit A-P1-4).
 * `poolDate` is the pool snapshot (YYYY-MM-DD); `occupationCount` the
 * occupations in it.
 */
export function methodologyFaq(
  poolDate: string,
  occupationCount: number,
): FaqEntry[] {
  return [
    {
      question: "Is the points check free?",
      // The founding count and prices come only from the quote, never copy.
      answer:
        "Yes. Your points and your three visa stamps are free, with no email or account. The full personal report is a one-off purchase, free for founding readers while places last, with a 7-day no-questions refund.",
    },
    {
      question: "Is this migration advice?",
      answer:
        "It is general information and a self-reported calculation. MigrateLens is not a registered migration agent. A registered agent or Australian legal practitioner can assess your individual circumstances.",
    },
    {
      question: "Why do some numbers show a range?",
      answer:
        "The official dashboard masks counts below 20. We preserve that uncertainty when adding point bands, rather than filling in invented numbers.",
    },
    {
      question: "Does the data update after every round?",
      answer: `We check for each new 189 invitation round and for each month's SkillSelect data, and every update is reviewed before it is published. Invitation results and EOI pool snapshots have separate release schedules; the current pool is dated ${formatDate(poolDate)}.`,
    },
    {
      question: "Can I download the report?",
      answer:
        "The full report opens on screen as soon as it is issued, and its PDF and private link reach your email. You can also use Download PDF on the report page at any time.",
    },
    {
      question: "What if my occupation is not listed?",
      answer: `Choose Other occupation for the points check. The report will clearly show that no pool comparison is available. The current imported snapshot covers ${occupationCount} occupations.`,
    },
  ];
}
