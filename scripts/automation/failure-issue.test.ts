import { describe, expect, it } from "vitest";
import {
  failureBody,
  MAX_BODY,
  failureIssueAction,
  monthlyFailureTitle,
  reportFailure,
  resolveFailure,
  roundFailureTitle,
} from "./failure-issue";

const title = "Monthly SkillSelect update failed (Nov 2026)";

describe("titles", () => {
  it("formats both kinds", () => {
    expect(monthlyFailureTitle("2026-11")).toBe(title);
    expect(roundFailureTitle("2026-11-04")).toBe(
      "189 round import failed (4 Nov 2026)",
    );
  });
});

describe("title validation", () => {
  it("rejects malformed input", () => {
    expect(() => monthlyFailureTitle("bad")).toThrow();
    expect(() => monthlyFailureTitle("2026-13")).toThrow();
    expect(() => roundFailureTitle("2026-11")).toThrow();
  });
});

describe("failureIssueAction", () => {
  it("comments on the open issue with the same title", () => {
    expect(failureIssueAction([{ number: 4, title }], title)).toEqual({
      kind: "comment",
      number: 4,
    });
  });

  it("creates when none matches", () => {
    expect(failureIssueAction([], title)).toEqual({ kind: "create" });
    expect(
      failureIssueAction([{ number: 4, title: "Something else" }], title),
    ).toEqual({ kind: "create" });
  });
});

describe("failureBody", () => {
  it("keeps the step, the run and only the last 50 log lines", () => {
    const log = Array.from({ length: 80 }, (_, i) => `line ${i + 1}`).join(
      "\n",
    );
    const body = failureBody("Import", log, "https://x/runs/1");
    expect(body).toContain("Failing step: Import");
    expect(body).toContain("https://x/runs/1");
    expect(body).toContain("line 80");
    expect(body).toContain("line 31");
    expect(body).not.toContain("line 30\n");
  });
});

describe("failureBody hardening", () => {
  it("keeps the last 50 real lines when the log ends in a newline", () => {
    const log = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join(
      "\n",
    );
    const body = failureBody("s", `${log}\n\n`, "u");
    expect(body).toContain("line 60");
    expect(body).toContain("line 11\n");
    expect(body).not.toContain("line 10\n");
  });

  it("fences with more backticks than the log contains", () => {
    const body = failureBody("s", "a ```` b\n```", "u");
    expect(body).toContain("\n`````\na ```` b");
    expect(body.trimEnd().endsWith("`````")).toBe(true);
  });

  it("caps the body", () => {
    const body = failureBody("s", "x".repeat(100_000), "u");
    expect(body.length).toBeLessThanOrEqual(MAX_BODY);
    expect(body).toContain("(truncated)");
  });
});

describe("gh calls", () => {
  function stub(listed: string) {
    const calls: string[][] = [];
    const inputs: (string | undefined)[] = [];
    return {
      calls,
      inputs,
      gh: (args: string[], input?: string) => {
        calls.push(args);
        inputs.push(input);
        return args[1] === "list" ? listed : "";
      },
    };
  }

  it("creates an issue assigned to the founder", () => {
    const { gh, calls, inputs } = stub("[]");
    expect(calls[0]).toBeUndefined();
    expect(reportFailure(gh, title, "body")).toEqual({ kind: "create" });
    const create = calls[1];
    expect(inputs[1]).toBe("body");
    expect(calls[0]).toContain("app/github-actions");
    expect(create.slice(0, 2)).toEqual(["issue", "create"]);
    expect(create).toContain("Prathu910");
    expect(create).toContain("--body-file");
    expect(create).not.toContain("body");
    expect(create).not.toContain("@Prathu910");
  });

  it("comments on the existing issue", () => {
    const { gh, calls } = stub(JSON.stringify([{ number: 4, title }]));
    reportFailure(gh, title, "body");
    expect(calls[1].slice(0, 3)).toEqual(["issue", "comment", "4"]);
  });

  it("resolves by closing with a link, or does nothing", () => {
    const open = stub(JSON.stringify([{ number: 4, title }]));
    expect(resolveFailure(open.gh, title, "https://x/runs/2")).toBe(true);
    expect(open.calls[1].slice(0, 3)).toEqual(["issue", "comment", "4"]);
    expect(open.inputs[1]).toContain("https://x/runs/2");
    expect(open.calls[2].slice(0, 3)).toEqual(["issue", "close", "4"]);
    const none = stub("[]");
    expect(resolveFailure(none.gh, title, "u")).toBe(false);
    expect(none.calls).toHaveLength(1);
  });
});
