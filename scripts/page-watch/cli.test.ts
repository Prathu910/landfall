import { describe, expect, it } from "vitest";
import type { Gh } from "../automation/gh";
import { applyActions, findStandingIssue, parseState } from "./cli";
import { politeOrder } from "./fetch-pages";

describe("parseState", () => {
  const entry = {
    hash: "h",
    text: "t",
    firstSeen: "2026-11-25",
    failures: 0,
    checkedOn: "2026-11-25",
  };

  it("reads a saved state", () => {
    expect(parseState(JSON.stringify({ "https://a.gov.au/": entry }))).toEqual({
      "https://a.gov.au/": entry,
    });
  });

  it("starts a fresh baseline from a missing or damaged state", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState("{not json")).toBeNull();
    expect(parseState("[]")).toBeNull();
    const { checkedOn: _dropped, ...older } = entry;
    void _dropped;
    expect(
      parseState(JSON.stringify({ "https://a.gov.au/": older })),
    ).toBeNull();
    expect(
      parseState(
        JSON.stringify({ "https://a.gov.au/": { ...entry, failures: "2" } }),
      ),
    ).toBeNull();
  });
});

describe("applyActions", () => {
  it("sends titles as arguments and bodies on stdin, assigned to the founder", () => {
    const calls: { args: string[]; input?: string }[] = [];
    const gh: Gh = (args, input) => {
      calls.push({ args, input });
      return "";
    };
    applyActions(gh, [
      {
        kind: "create",
        title: "Source changed: $(rm -rf /)",
        body: "```\n@x\n```",
        label: "source-watch",
      },
      { kind: "comment", number: 7, body: "again" },
      { kind: "edit", number: 8, body: "new list" },
    ]);
    expect(calls).toEqual([
      {
        args: [
          "issue",
          "create",
          "--title",
          "Source changed: $(rm -rf /)",
          "--label",
          "source-watch",
          "--assignee",
          "Prathu910",
          "--body-file",
          "-",
        ],
        input: "```\n@x\n```",
      },
      { args: ["issue", "comment", "7", "--body-file", "-"], input: "again" },
      { args: ["issue", "edit", "8", "--body-file", "-"], input: "new list" },
    ]);
  });
});

describe("politeOrder", () => {
  it("takes the hosts in turn and keeps each host's order", () => {
    expect(
      politeOrder(
        [
          "https://a.gov.au/1",
          "https://a.gov.au/2",
          "https://a.gov.au/3",
          "https://b.gov.au/1",
          "https://c.gov.au/1",
          "https://c.gov.au/2",
        ],
        (url) => new URL(url).host,
      ),
    ).toEqual([
      "https://a.gov.au/1",
      "https://b.gov.au/1",
      "https://c.gov.au/1",
      "https://a.gov.au/2",
      "https://c.gov.au/2",
      "https://a.gov.au/3",
    ]);
  });
});

describe("findStandingIssue", () => {
  const gh =
    (issues: unknown[]): Gh =>
    () =>
      JSON.stringify(issues);
  const title = "Sources the watcher cannot read";

  it("finds the exact title among open and closed issues, an open one first", () => {
    expect(
      findStandingIssue(
        gh([
          { number: 3, title: `Re: ${title}`, body: "", state: "OPEN" },
          { number: 4, title, body: "old", state: "CLOSED" },
          { number: 5, title, body: "list", state: "OPEN" },
        ]),
      ),
    ).toEqual({ number: 5, body: "list", state: "OPEN" });
    expect(
      findStandingIssue(
        gh([{ number: 4, title, body: "old", state: "CLOSED" }]),
      ),
    ).toMatchObject({ number: 4 });
    expect(findStandingIssue(gh([]))).toBeNull();
  });

  it("searches every state, by the bot only", () => {
    let args: string[] = [];
    findStandingIssue((sent) => {
      args = sent;
      return "[]";
    });
    expect(args).toEqual(
      expect.arrayContaining([
        "--state",
        "all",
        "--author",
        "app/github-actions",
      ]),
    );
  });
});
