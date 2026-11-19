export type FaqItem = {
  id: string;
  question: string;
  /** Two or three sentences, the direct answer first. */
  answer: string;
  link?: { href: string; text: string };
};

/**
 * The homepage questions. Answers explain rules and how to read the data
 * rather than quote counts, so none goes stale between snapshots; each links
 * to where the sample, the states page or the method shows the detail.
 */
export const HOME_FAQ: FaqItem[] = [
  {
    id: "ahead",
    question: "How many EOIs are ahead of me?",
    answer:
      "The check counts them for you: the published 189 EOIs for your occupation with a higher score than yours, and the ones at your score, from SkillSelect data. These are counts of EOIs, not your place in a queue: ties are broken by an unpublished date of effect, and one person can hold several EOIs.",
    link: {
      href: "/sample/#visa-189-stand",
      text: "See an example in the sample report",
    },
  },
  {
    id: "nomination",
    question: "Does state nomination add points?",
    answer:
      "Yes. Under the Home Affairs points test, a 190 state nomination adds 5 points, and a 491 state nomination or family sponsorship adds 15. Each state also sets its own nomination criteria, which the report keeps separate from your federal points.",
    link: { href: "/states/", text: "Compare the states and territories" },
  },
  {
    id: "eoi-active",
    question: "How long do EOIs stay active?",
    answer:
      "An EOI stays in SkillSelect for two years from the day it is submitted, according to Home Affairs. If no invitation comes in that time, the EOI expires and a new one has to be submitted.",
    link: { href: "/methodology/#sources", text: "See the official sources" },
  },
  {
    id: "masked",
    question: "Is a masked “<20” zero?",
    answer:
      "Not necessarily. SkillSelect publishes any count from 0 to 19 as “<20”, so the real number may be zero or as high as 19. We carry it as that range in every total and never turn it into a single number.",
    link: { href: "/methodology/#pool", text: "How we read the pool" },
  },
  {
    id: "visa",
    question: "Does the check tell me if I can get a visa?",
    answer:
      "No. It counts your points and checks the points-test basics: your age, your English and a valid skills assessment. A visa has more requirements than we can check, so treat the result as general information, not migration advice.",
    link: {
      href: "/methodology/#limitations",
      text: "What the check leaves out",
    },
  },
  {
    id: "data",
    question: "Where does the data come from?",
    answer:
      "From SkillSelect: the EOI data and invitation round results that the Department of Home Affairs publishes. Every figure in a report shows the date its data is as at, and the method page lists each source.",
    link: { href: "/methodology/#sources", text: "See every source" },
  },
  {
    id: "privacy",
    question: "Are my answers saved or shared?",
    answer:
      "Your answers stay in your browser: they are never sent to us and never put in a web address. If you choose to save them, they are kept on this device only, and you can clear them at any time.",
    link: { href: "/methodology/#privacy", text: "Read the privacy note" },
  },
];
