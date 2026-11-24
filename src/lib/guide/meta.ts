import type { Visa } from "../data/types";
import { formatDate } from "../migration";
import {
  articleLd,
  breadcrumbLd,
  faqPageLd,
  howToLd,
  type FaqEntry,
} from "../seo/json-ld";
import { SITE_NAME, SITE_URL } from "../site";
import { PATHWAY_191 } from "./faq";
import type { GuideStep } from "./types";

export type GuidePageId = "hub" | Visa;

export type GuidePage = {
  id: GuidePageId;
  path: string;
  /** The metadata title (the layout adds "· MigrateLens"). */
  title: string;
  description: string;
  /** The page's one h1. */
  heading: string;
  crumb: string;
};

export const GUIDE_VISAS: Visa[] = ["189", "190", "491"];

export const GUIDE_PAGES: Record<GuidePageId, GuidePage> = {
  hub: {
    id: "hub",
    path: "/guide/",
    title: "How to get Australian PR: the 189, 190 and 491 skilled visa guide",
    description:
      "Step by step to Australian skilled PR: occupation, skills assessment, English, points, EOI, nomination, invitation and fees, from official pages.",
    heading:
      "How to get Australian PR through skilled migration (189, 190, 491)",
    crumb: "PR guide",
  },
  "189": {
    id: "189",
    path: "/guide/189/",
    title: "189 Skilled Independent visa: requirements, steps and costs",
    description:
      "The 189 Skilled Independent visa: who it suits, the official requirements, how invitations work and what it costs, checked against Home Affairs pages.",
    heading: "The 189 Skilled Independent visa",
    crumb: "189 visa",
  },
  "190": {
    id: "190",
    path: "/guide/190/",
    title:
      "190 Skilled Nominated visa: state nomination, requirements and costs",
    description:
      "The 190 Skilled Nominated visa: state nomination, the official requirements, the 5 nomination points and what it costs, checked against Home Affairs.",
    heading: "The 190 Skilled Nominated visa",
    crumb: "190 visa",
  },
  "491": {
    id: "491",
    path: "/guide/491/",
    title:
      "491 Skilled Work Regional visa: requirements, 191 PR pathway and costs",
    description:
      "The 491 Skilled Work Regional visa: regional living, 15 nomination points, the 191 permanent pathway and what it costs, checked against Home Affairs.",
    heading: "The 491 Skilled Work Regional (Provisional) visa",
    crumb: "491 visa",
  },
};

/** The dated 2–3 sentence answer that opens each guide page. */
export function directAnswer(
  id: GuidePageId,
  checkedAt: string,
  counts: Record<Visa, number> | null,
): string {
  const date = formatDate(checkedAt);
  const listed = (visa: Visa) =>
    counts ? ` (${counts[visa]} occupations are listed)` : "";
  const basics =
    "a suitable skills assessment, at least competent English, an age under 45 when invited and at least 65 points";
  const source = `Source: Home Affairs visa pages, checked ${date}.`;
  switch (id) {
    case "hub":
      return `As at ${date}, Australia’s points-tested routes to skilled PR are the 189 (independent and permanent), the 190 (state-nominated and permanent) and the 491 (regional, provisional for 5 years, then the permanent 191). Each needs an occupation on the Home Affairs list, ${basics}, and you apply only after an invitation through a SkillSelect EOI. ${source}`;
    case "189":
      return `As at ${date}, the 189 is a permanent visa you can apply for only after Home Affairs invites your SkillSelect EOI; no state, employer or family sponsor is involved. You need an occupation on the 189 list${listed("189")}, ${basics}. ${source}`;
    case "190":
      return `As at ${date}, the 190 is a permanent visa for people nominated by a state or territory, and the nomination adds 5 points. You need an occupation on the 190 list${listed("190")}, the nominating state’s own criteria, ${basics}. ${source}`;
    case "491":
      return `As at ${date}, the 491 is a 5-year provisional visa for living and working in a designated regional area, with 15 points for a state nomination or an eligible relative’s sponsorship. You need an occupation on the 491 list${listed("491")} and ${basics}; ${PATHWAY_191}. ${source}`;
  }
}

/** Article, FAQ, breadcrumbs and (on the hub) the steps as HowTo. */
export function guideJsonLd(
  page: GuidePage,
  faq: FaqEntry[],
  checkedAt: string,
  citations: string[],
  steps: GuideStep[] = [],
): object[] {
  const url = SITE_URL + page.path;
  const crumbs = [
    { name: SITE_NAME, item: `${SITE_URL}/` },
    { name: GUIDE_PAGES.hub.crumb, item: SITE_URL + GUIDE_PAGES.hub.path },
    ...(page.id === "hub" ? [] : [{ name: page.crumb, item: url }]),
  ];
  const ld = [
    articleLd({
      headline: page.heading,
      description: page.description,
      url,
      dateModified: checkedAt,
      citations,
    }),
    faqPageLd(faq),
    breadcrumbLd(crumbs),
  ];
  if (steps.length === 0) return ld;
  return [
    ...ld,
    howToLd({
      name: page.heading,
      description: page.description,
      steps: steps.map((s) => ({
        name: s.title,
        text: s.what,
        url: `${url}#step-${s.id}`,
      })),
    }),
  ];
}
