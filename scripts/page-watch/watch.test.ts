import { describe, expect, it } from "vitest";
import { MAX_BODY } from "../automation/failure-issue";
import type { NormalisedPage } from "./normalise";
import type { WatchedSource } from "./sources";
import {
  diffLines,
  planWatch,
  watchMarker,
  type WatchInput,
  type WatchResult,
  type WatchState,
} from "./watch";

const url =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list";
const other =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect";
const sources: WatchedSource[] = [
  {
    url,
    citedBy: [
      {
        file: "src/data/guide/sources.ts",
        item: "SOURCES.occupationList",
        checkedAt: "2026-11-23",
      },
      {
        file: "scripts/state-lists/federal.ts",
        item: "FEDERAL_LIST_URL",
        checkedAt: null,
      },
    ],
  },
];

const BEFORE = [
  "Skilled occupation list",
  "Software engineer: 189, 190, 491",
  "Footer note",
].join("\n");
const AFTER = [
  "Skilled occupation list",
  "Software engineer: 190, 491",
  "Footer note",
].join("\n");

const page = (
  text: string,
  title = "Skilled occupation list",
): NormalisedPage => ({
  title,
  text,
  hash: `hash:${text}`,
});
const ok = (text: string, title?: string): WatchResult => ({
  ok: true,
  page: page(text, title),
});
const failed: WatchResult = { ok: false, reason: "HTTP 403" };

const stateWith = (text: string, failures = 0): WatchState => ({
  [url]: { hash: `hash:${text}`, text, firstSeen: "2026-11-25", failures },
});

function input(overrides: Partial<WatchInput>): WatchInput {
  return {
    sources,
    results: { [url]: ok(BEFORE) },
    state: stateWith(BEFORE),
    openIssues: [],
    today: "2026-12-04",
    ...overrides,
  };
}

const issueFor = (issueUrl: string) => ({
  number: 12,
  title: "Source changed: Skilled occupation list",
  body: `${watchMarker(issueUrl)}\nEarlier change`,
});

/** Runs the watcher on consecutive days, each day's state feeding the next. */
function days(state: WatchState | null, results: WatchResult[]) {
  let plan = planWatch(input({ state, results: { [url]: results[0] } }));
  for (const result of results.slice(1))
    plan = planWatch(input({ state: plan.state, results: { [url]: result } }));
  return plan;
}

describe("planWatch: baseline", () => {
  it("stores a baseline and opens no issues when there is no saved state", () => {
    const plan = planWatch(
      input({ state: null, results: { [url]: ok(AFTER) } }),
    );
    expect(plan.actions).toEqual([]);
    expect(plan.state[url]).toEqual({
      hash: `hash:${AFTER}`,
      text: AFTER,
      firstSeen: "2026-12-04",
      failures: 0,
    });
    expect(plan.summary).toMatch(/no saved baseline/i);
  });

  it("stores a baseline for a newly cited page without an issue", () => {
    const plan = planWatch(
      input({
        sources: [...sources, { url: other, citedBy: [] }],
        results: { [url]: ok(BEFORE), [other]: ok("SkillSelect") },
      }),
    );
    expect(plan.actions).toEqual([]);
    expect(plan.state[other].text).toBe("SkillSelect");
  });

  it("forgets pages that are no longer cited", () => {
    const state = { ...stateWith(BEFORE), [other]: stateWith("x")[url] };
    expect(Object.keys(planWatch(input({ state })).state)).toEqual([url]);
  });

  it("keeps an unchanged page quiet", () => {
    const plan = planWatch(input({}));
    expect(plan.actions).toEqual([]);
    expect(plan.state[url]).toEqual(stateWith(BEFORE)[url]);
  });
});

describe("planWatch: a changed page", () => {
  const plan = planWatch(input({ results: { [url]: ok(AFTER) } }));

  it("opens a Source changed issue with the before/after excerpt", () => {
    expect(plan.actions).toHaveLength(1);
    const action = plan.actions[0];
    expect(action).toMatchObject({
      kind: "create",
      title: "Source changed: Skilled occupation list",
      label: "source-watch",
    });
    const { body } = action as { body: string };
    expect(body).toContain(watchMarker(url));
    expect(body).toContain(`Page: ${url}`);
    expect(body).toContain(
      "`src/data/guide/sources.ts`: SOURCES.occupationList (checked 2026-11-23)",
    );
    expect(body).toContain(
      "`scripts/state-lists/federal.ts`: FEDERAL_LIST_URL (no checked date)",
    );
    expect(body).toContain(
      "Change first seen: 2026-12-04 (the previous text was first seen 2026-11-25)",
    );
    expect(body).toContain(
      "- Software engineer: 189, 190, 491\n+ Software engineer: 190, 491",
    );
    expect(body).not.toContain("Footer note");
  });

  it("makes the new text the baseline, first seen today", () => {
    expect(plan.state[url]).toEqual({
      hash: `hash:${AFTER}`,
      text: AFTER,
      firstSeen: "2026-12-04",
      failures: 0,
    });
    expect(plan.summary).toContain(url);
  });

  it("comments on the open issue for that page instead", () => {
    const comment = planWatch(
      input({
        results: { [url]: ok(AFTER) },
        openIssues: [issueFor(other), issueFor(url)],
      }),
    );
    expect(comment.actions).toHaveLength(1);
    expect(comment.actions[0]).toMatchObject({ kind: "comment", number: 12 });
  });

  it("names the issue by host when the page has no title", () => {
    const untitled = planWatch(input({ results: { [url]: ok(AFTER, "") } }));
    expect(untitled.actions[0]).toMatchObject({
      title: "Source changed: immi.homeaffairs.gov.au",
    });
  });

  it("keeps third-party text from escaping its fence, mentioning anyone or growing the issue", () => {
    const hostile = [
      "```",
      "@someone please look",
      "x".repeat(10_000),
      ...Array.from({ length: 200 }, (_, i) => `line ${i}`),
    ].join("\n");
    const plan = planWatch(
      input({
        results: { [url]: ok(hostile, "Fees @org ``` " + "y".repeat(300)) },
      }),
    );
    const action = plan.actions[0] as { title: string; body: string };
    expect(action.title).not.toContain("@");
    expect(action.title.length).toBeLessThanOrEqual(120);
    expect(action.body.length).toBeLessThanOrEqual(MAX_BODY);
    const fence = /^(`{4,})diff$/m.exec(action.body)?.[1];
    expect(fence).toBeDefined();
    expect(action.body.trimEnd().endsWith(fence!)).toBe(true);
    const excerpt = action.body.slice(action.body.indexOf(`${fence}diff`));
    expect(
      excerpt.split("\n").filter((line) => /^[+-] /.test(line)),
    ).toHaveLength(40);
    expect(excerpt).toContain("@someone");
    expect(
      action.body.slice(0, action.body.indexOf(`${fence}diff`)),
    ).not.toContain("@");
  });
});

describe("planWatch: an unreadable page", () => {
  it("resets the failure count when the page recovers", () => {
    const plan = days(stateWith(BEFORE), [failed, failed, ok(BEFORE)]);
    expect(plan.state[url].failures).toBe(0);
    expect(plan.actions).toEqual([]);
  });

  it("keeps the last good text while failing", () => {
    const plan = days(stateWith(BEFORE), [failed, failed]);
    expect(plan.state[url]).toEqual({ ...stateWith(BEFORE)[url], failures: 2 });
    expect(plan.actions).toEqual([]);
    expect(plan.summary).toContain("HTTP 403 (2 checks in a row)");
  });

  it("opens one Source unreachable issue on the third failed day, then waits", () => {
    const plan = planWatch(
      input({ state: stateWith(BEFORE, 2), results: { [url]: failed } }),
    );
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].kind === "create" && plan.actions[0].title).toBe(
      "Source unreachable: immi.homeaffairs.gov.au",
    );
    expect(plan.actions[0]).toMatchObject({ label: "source-watch" });
    const { body } = plan.actions[0] as { body: string };
    expect(body).toContain(watchMarker(url));
    expect(body).toContain("HTTP 403");
    const fourth = planWatch(
      input({ state: plan.state, results: { [url]: failed } }),
    );
    expect(fourth.actions).toEqual([]);
    expect(fourth.state[url].failures).toBe(4);
  });

  it("needs three failed days in a row", () => {
    expect(
      days(stateWith(BEFORE), [failed, failed, ok(BEFORE), failed, failed])
        .actions,
    ).toEqual([]);
    expect(
      days(stateWith(BEFORE), [failed, failed, failed]).actions,
    ).toHaveLength(1);
  });

  it("groups a host's pages into one issue and comments where one is open", () => {
    const third = "https://immi.homeaffairs.gov.au/visas/third";
    const state = {
      ...stateWith(BEFORE, 2),
      [other]: stateWith(BEFORE, 2)[url],
      [third]: stateWith(BEFORE, 2)[url],
    };
    const plan = planWatch(
      input({
        sources: [
          ...sources,
          { url: other, citedBy: [] },
          { url: third, citedBy: [] },
        ],
        results: { [url]: failed, [other]: failed, [third]: failed },
        state,
        openIssues: [issueFor(third)],
      }),
    );
    expect(plan.actions).toHaveLength(2);
    const [comment, create] = [...plan.actions].sort((a, b) =>
      a.kind.localeCompare(b.kind),
    );
    expect(comment).toMatchObject({ kind: "comment", number: 12 });
    expect(create.kind).toBe("create");
    expect(create.body).toContain(watchMarker(url));
    expect(create.body).toContain(watchMarker(other));
    expect(create.body).not.toContain(watchMarker(third));
  });

  it("starts a page that has never been read without a baseline", () => {
    const plan = days(null, [failed, ok(AFTER)]);
    expect(plan.actions).toEqual([]);
    expect(plan.state[url]).toMatchObject({ text: AFTER, failures: 0 });
  });

  it("treats a page missing from the results as unreadable", () => {
    const plan = planWatch(input({ results: {} }));
    expect(plan.state[url].failures).toBe(1);
  });
});

describe("diffLines", () => {
  it("lists removed and added lines in page order", () => {
    expect(diffLines("a\nb\nc\nd", "a\nB\nc\nd\ne", 40)).toEqual({
      lines: ["- b", "+ B", "+ e"],
      total: 3,
    });
  });

  it("stops at the limit and counts the rest", () => {
    const before = Array.from({ length: 100 }, (_, i) => `old ${i}`).join("\n");
    const after = Array.from({ length: 100 }, (_, i) => `new ${i}`).join("\n");
    const diff = diffLines(before, after, 40);
    expect(diff.lines).toHaveLength(40);
    expect(diff.total).toBe(200);
  });

  it("falls back to a set difference for very long pages", () => {
    const before = Array.from({ length: 5000 }, (_, i) => `row ${i}`);
    const after = [...before];
    after[10] = "row ten";
    after[4000] = "row four thousand";
    const diff = diffLines(before.join("\n"), after.join("\n"), 40);
    expect(diff.total).toBe(4);
    expect(diff.lines).toEqual([
      "- row 10",
      "- row 4000",
      "+ row ten",
      "+ row four thousand",
    ]);
  });

  it("shortens very long lines", () => {
    const diff = diffLines("a", "b".repeat(1000), 40);
    expect(diff.lines[1].length).toBeLessThanOrEqual(305);
  });
});
