import { describe, expect, it } from "vitest";
import type { Gh } from "../automation/gh";
import { applyActions, parseState, politeOrder } from "./cli";

describe("parseState", () => {
  const entry = { hash: "h", text: "t", firstSeen: "2026-11-25", failures: 0 };

  it("reads a saved state", () => {
    expect(parseState(JSON.stringify({ "https://a.gov.au/": entry }))).toEqual({
      "https://a.gov.au/": entry,
    });
  });

  it("starts a fresh baseline from a missing or damaged state", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState("{not json")).toBeNull();
    expect(parseState("[]")).toBeNull();
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
    ]);
  });
});

describe("politeOrder", () => {
  it("takes the hosts in turn and keeps each host's order", () => {
    expect(
      politeOrder([
        "https://a.gov.au/1",
        "https://a.gov.au/2",
        "https://a.gov.au/3",
        "https://b.gov.au/1",
        "https://c.gov.au/1",
        "https://c.gov.au/2",
      ]),
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
