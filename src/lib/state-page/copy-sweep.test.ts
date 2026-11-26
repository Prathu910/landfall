import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import { frozenStateViews } from "./__fixtures__/frozen-views";
import { loadStatePageViews } from "./load-server";
import { stateDescription, stateJsonLd, stateTitle } from "./meta";
import type { StatePageView } from "./view";

const ZERO_RANGE = /(?<![\d,.])0–/;
const REPEATED_RANGE = /\b(\d[\d,]*)(?: to |–)\1\b/;
const ZERO_FIGURE = /\b(at least|about) 0\b/;
const ISSUED = /invitations? (issued|sent) (in|that)/i;
const PRICE = /₹|US\$|\$\d/;

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value instanceof Set || value instanceof Map) return [];
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

/** Rule texts quoted from the states' own pages may hold a percentage of places, never a chance. */
function withoutQuotedRules(text: string, view: StatePageView): string {
  return view.facts.selection.reduce(
    (out, line) => out.split(line.text).join(""),
    text,
  );
}

function pageStrings(view: StatePageView): string[] {
  const { facts, ...shown } = view;
  return [
    ...strings(shown),
    ...strings(facts.page),
    stateTitle(view),
    stateDescription(view),
    ...strings(stateJsonLd(view)),
  ];
}

const VIEWS: [string, StatePageView][] = [
  ...loadStatePageViews().map((v): [string, StatePageView] => [
    `live ${v.page.code}`,
    v,
  ]),
  ...[...frozenStateViews().values()].map((v): [string, StatePageView] => [
    `frozen ${v.page.code}`,
    v,
  ]),
];

describe("every state page's copy", () => {
  it.each(VIEWS)("%s passes the copy and number rules", (_name, view) => {
    const problems = pageStrings(view).filter(
      (s) =>
        BANNED_COPY.test(s) ||
        /\bNaN\b|\bundefined\b|\bnull\b/.test(s) ||
        ZERO_RANGE.test(s) ||
        REPEATED_RANGE.test(s) ||
        ZERO_FIGURE.test(s) ||
        ISSUED.test(s) ||
        PRICE.test(s) ||
        withoutQuotedRules(s, view).includes("%"),
    );
    expect(problems).toEqual([]);
  });

  it.each(VIEWS)(
    "%s links internal pages with a trailing slash",
    (_n, view) => {
      const hrefs = strings(view).filter((s) => s.startsWith("/"));
      for (const href of hrefs) expect(href, href).toMatch(/\/(#[\w-]+)?$/);
    },
  );
});
