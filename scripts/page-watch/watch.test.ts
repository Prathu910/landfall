import { describe, expect, it } from "vitest";
import { MAX_BODY } from "../automation/failure-issue";
import { STANDING_TITLE, cannotReadMarker, watchMarker } from "./issue-text";
import type { NormalisedPage } from "./normalise";
import type { WatchedSource } from "./sources";
import {
  planWatch,
  type WatchEntry,
  type WatchInput,
  type WatchResult,
  type WatchState,
} from "./watch";

const url =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list";
const other =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect";
const third = "https://immi.homeaffairs.gov.au/visas/third";
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
const cited = (...urls: string[]): WatchedSource[] => [
  ...sources,
  ...urls.map((u) => ({ url: u, citedBy: [] })),
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
): NormalisedPage => ({ title, text, hash: `hash:${text}` });
const ok = (text: string, title?: string): WatchResult => ({
  ok: true,
  page: page(text, title),
});
const refused: WatchResult = { ok: false, kind: "refused", reason: "HTTP 403" };
const timedOut: WatchResult = {
  ok: false,
  kind: "timeout",
  reason: "no answer within 30 s",
};
const disallowed: WatchResult = {
  ok: false,
  kind: "disallowed",
  reason: "not fetched: disallowed by robots.txt",
};
const skipped: WatchResult = {
  ok: false,
  kind: "skipped",
  reason: "not fetched: the run's time budget ran out",
};

const entry = (
  text: string,
  failures = 0,
  checkedOn = "2026-12-03",
): WatchEntry => ({
  hash: text === "" ? "" : `hash:${text}`,
  text,
  firstSeen: text === "" ? "" : "2026-11-25",
  failures,
  checkedOn,
});
const stateWith = (text: string, failures = 0): WatchState => ({
  [url]: entry(text, failures),
});

function input(overrides: Partial<WatchInput>): WatchInput {
  return {
    sources,
    results: { [url]: ok(BEFORE) },
    state: stateWith(BEFORE),
    openIssues: [],
    standingIssue: null,
    today: "2026-12-04",
    notes: [],
    ...overrides,
  };
}

const issueFor = (
  issueUrl: string,
  title = "Source changed: Skilled occupation list",
  number = 12,
) => ({
  number,
  title,
  body: `${watchMarker(issueUrl)}\nEarlier change`,
});

const nextDay = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);

/** Runs the watcher on consecutive days from 2026-12-04, each day's state feeding the next. */
function days(state: WatchState | null, results: WatchResult[]) {
  let today = "2026-12-04";
  let plan = planWatch(input({ state, results: { [url]: results[0] }, today }));
  for (const result of results.slice(1)) {
    today = nextDay(today);
    plan = planWatch(
      input({ state: plan.state, results: { [url]: result }, today }),
    );
  }
  return plan;
}

const bodyOf = (action: unknown) => (action as { body: string }).body;

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
      checkedOn: "2026-12-04",
    });
    expect(plan.summary).toMatch(/no saved baseline/i);
  });

  it("stores a baseline for a newly cited page without an issue", () => {
    const plan = planWatch(
      input({
        sources: cited(other),
        results: { [url]: ok(BEFORE), [other]: ok("SkillSelect") },
      }),
    );
    expect(plan.actions).toEqual([]);
    expect(plan.state[other].text).toBe("SkillSelect");
  });

  it("forgets pages that are no longer cited", () => {
    const state = { ...stateWith(BEFORE), [other]: entry("x") };
    expect(Object.keys(planWatch(input({ state })).state)).toEqual([url]);
  });

  it("keeps an unchanged page quiet", () => {
    const plan = planWatch(input({}));
    expect(plan.actions).toEqual([]);
    expect(plan.state[url]).toEqual({
      ...entry(BEFORE),
      checkedOn: "2026-12-04",
    });
  });
});

describe("planWatch: a changed page", () => {
  const plan = planWatch(input({ results: { [url]: ok(AFTER) } }));

  it("opens a Source changed issue with the before/after excerpt", () => {
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0]).toMatchObject({
      kind: "create",
      title: "Source changed: Skilled occupation list",
      label: "source-watch",
    });
    const body = bodyOf(plan.actions[0]);
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
    expect(plan.state[url]).toMatchObject({
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
        openIssues: [issueFor(other, undefined, 9), issueFor(url)],
      }),
    );
    expect(comment.actions).toHaveLength(1);
    expect(comment.actions[0]).toMatchObject({ kind: "comment", number: 12 });
    expect(bodyOf(comment.actions[0])).toMatch(
      /^Changed again \(seen 2026-12-04\)/,
    );
  });

  it("says the page is readable again when the open issue is an unreachable one", () => {
    const issue = issueFor(url, "Source unreachable: immi.homeaffairs.gov.au");
    const comment = planWatch(
      input({ results: { [url]: ok(AFTER) }, openIssues: [issue] }),
    );
    expect(bodyOf(comment.actions[0])).toMatch(
      /^Readable again, with changed text \(seen 2026-12-04\)/,
    );
  });

  it("ignores a marker that only appears inside an issue's fenced excerpt", () => {
    const quoted = {
      number: 5,
      title: "Source changed: Other",
      body: `${watchMarker(other)}\n\`\`\`\`diff\n${watchMarker(url)}\n\`\`\`\``,
    };
    const plan = planWatch(
      input({ results: { [url]: ok(AFTER) }, openIssues: [quoted] }),
    );
    expect(plan.actions[0]).toMatchObject({ kind: "create" });
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

describe("planWatch: a page that used to be readable", () => {
  it("resets the failure count when the page recovers", () => {
    const plan = days(stateWith(BEFORE), [refused, refused, ok(BEFORE)]);
    expect(plan.state[url].failures).toBe(0);
    expect(plan.actions).toEqual([]);
  });

  it("keeps the last good text while failing", () => {
    const plan = days(stateWith(BEFORE), [refused, refused]);
    expect(plan.state[url]).toEqual({
      ...entry(BEFORE),
      failures: 2,
      checkedOn: "2026-12-05",
    });
    expect(plan.actions).toEqual([]);
    expect(plan.summary).toContain("HTTP 403 (2 checks in a row)");
  });

  it("opens one Source unreachable issue on the third failed day, then waits", () => {
    const plan = planWatch(
      input({ state: stateWith(BEFORE, 2), results: { [url]: refused } }),
    );
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0]).toMatchObject({
      kind: "create",
      title: "Source unreachable: immi.homeaffairs.gov.au",
      label: "source-watch",
    });
    const body = bodyOf(plan.actions[0]);
    expect(body).toContain(watchMarker(url));
    expect(body).toContain("used to be readable");
    expect(body).toContain(
      "HTTP 403 (its last text was first seen 2026-11-25)",
    );
    const fourth = planWatch(
      input({
        state: plan.state,
        results: { [url]: refused },
        today: "2026-12-05",
      }),
    );
    expect(fourth.actions).toEqual([]);
    expect(fourth.state[url].failures).toBe(4);
  });

  it("needs three failed days in a row, whatever the kind of failure", () => {
    expect(
      days(stateWith(BEFORE), [refused, refused, ok(BEFORE), refused, refused])
        .actions,
    ).toEqual([]);
    expect(
      days(stateWith(BEFORE), [timedOut, refused, timedOut]).actions,
    ).toHaveLength(1);
  });

  it("counts days, not runs: a second run on one day neither counts nor reopens", () => {
    const first = planWatch(
      input({ state: stateWith(BEFORE, 1), results: { [url]: refused } }),
    );
    expect(first.state[url].failures).toBe(2);
    const again = planWatch(
      input({ state: first.state, results: { [url]: refused } }),
    );
    expect(again.state[url].failures).toBe(2);
    const third = planWatch(
      input({
        state: { [url]: entry(BEFORE, 3, "2026-12-04") },
        results: { [url]: refused },
      }),
    );
    expect(third.actions).toEqual([]);
  });

  it("groups a host's pages into one issue and comments where one is open", () => {
    const state = {
      ...stateWith(BEFORE, 2),
      [other]: entry(BEFORE, 2),
      [third]: entry(BEFORE, 2),
    };
    const plan = planWatch(
      input({
        sources: cited(other, third),
        results: { [url]: refused, [other]: refused, [third]: refused },
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

  it("leaves a page it did not request this run as it was", () => {
    const plan = planWatch(
      input({ state: stateWith(BEFORE, 2), results: { [url]: skipped } }),
    );
    expect(plan.state[url]).toEqual(entry(BEFORE, 2));
    expect(plan.actions).toEqual([]);
    expect(plan.summary).toContain("time budget ran out");
    expect(planWatch(input({ results: {} })).state[url]).toEqual(entry(BEFORE));
  });
});

describe("planWatch: pages the watcher cannot read", () => {
  const blocked = "https://www.act.gov.au/migration/skilled-migrants";
  const hidden =
    "https://www.act.gov.au/migration/skilled-migrants/canberra-matrix";
  const standing = (urls: string[], state = "OPEN") => ({
    number: 30,
    state,
    body: urls
      .map((u) => `${cannotReadMarker(u)}\n- ${u}: HTTP 403`)
      .join("\n"),
  });
  const run = (overrides: Partial<WatchInput>) =>
    planWatch(
      input({
        sources: cited(blocked, hidden),
        results: {
          [url]: ok(BEFORE),
          [blocked]: refused,
          [hidden]: disallowed,
        },
        ...overrides,
      }),
    );

  it("opens no per-host issue for a never-read page, however long it fails", () => {
    const state = {
      ...stateWith(BEFORE),
      [blocked]: entry("", 2),
      [hidden]: entry(""),
    };
    const plan = run({ state, standingIssue: standing([blocked, hidden]) });
    expect(plan.actions).toEqual([]);
    expect(plan.summary).toContain("### Not watched: refuses automated reads");
    expect(plan.summary).toContain(`${blocked}: HTTP 403`);
    expect(plan.summary).toContain(
      `${hidden}: not fetched: disallowed by robots.txt`,
    );
    expect(plan.summary).not.toContain("### Unreadable");
  });

  it("creates the one standing issue for refused and robots-disallowed pages", () => {
    const plan = run({});
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0]).toMatchObject({
      kind: "create",
      title: STANDING_TITLE,
      label: "source-watch",
    });
    const body = bodyOf(plan.actions[0]);
    expect(body).toContain(cannotReadMarker(blocked));
    expect(body).toContain(cannotReadMarker(hidden));
    expect(body).not.toContain(watchMarker(blocked));
  });

  it("edits it only when its set of pages changes", () => {
    expect(run({ standingIssue: standing([hidden, blocked]) }).actions).toEqual(
      [],
    );
    const grown = run({ standingIssue: standing([blocked]) });
    expect(grown.actions).toEqual([
      {
        kind: "edit",
        number: 30,
        body: expect.stringContaining(cannotReadMarker(hidden)),
      },
    ]);
    const cleared = planWatch(input({ standingIssue: standing([blocked]) }));
    expect(cleared.actions).toEqual([
      {
        kind: "edit",
        number: 30,
        body: expect.stringContaining("None right now"),
      },
    ]);
  });

  it("never reopens, comments on or replaces a closed standing issue", () => {
    expect(run({ standingIssue: standing([], "CLOSED") }).actions).toEqual([]);
  });

  it("keeps a listed page listed when this run did not request it", () => {
    const plan = planWatch(
      input({
        sources: cited(blocked),
        results: { [url]: ok(BEFORE), [blocked]: skipped },
        state: { ...stateWith(BEFORE), [blocked]: entry("", 4) },
        standingIssue: standing([blocked]),
      }),
    );
    expect(plan.actions).toEqual([]);
  });

  it("does not list a page that times out, nor one that was read before", () => {
    const plan = planWatch(
      input({
        sources: cited(blocked, other),
        results: { [url]: refused, [blocked]: timedOut, [other]: refused },
        state: { ...stateWith(BEFORE), [other]: entry(BEFORE) },
      }),
    );
    expect(plan.actions).toEqual([]);
    expect(plan.summary).not.toContain("Not watched");
  });
});

describe("planWatch: summary", () => {
  it("lists run notes and the issue counts", () => {
    const plan = planWatch(
      input({
        notes: [
          "www.qld.gov.au: robots.txt unknown (HTTP 500); treated as allowing every page.",
        ],
      }),
    );
    expect(plan.summary).toContain("### Notes");
    expect(plan.summary).toContain("robots.txt unknown (HTTP 500)");
    expect(plan.summary).toContain(
      "Issues: 0 opened, 0 commented on, 0 edited; assigned to Prathu910.",
    );
  });
});
