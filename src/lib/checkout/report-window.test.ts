import { describe, expect, it } from "vitest";
import type { ReportMeta } from "../report-issue/payload";
import type { ReviseResponse } from "../orders/contract";
import { BANNED_COPY } from "../report/copy";
import {
  correctionState,
  issuedDay,
  liveCoreFits,
  reviseMessage,
  tokenFromHash,
} from "./report-window";

const META: ReportMeta = {
  reportNo: "ML-2611-0042",
  version: 2,
  issuedAt: "2026-11-21T03:00:00.000Z",
  correctableUntil: "2026-11-28T03:00:00.000Z",
  revisionsLeft: 2,
};

describe("correctionState", () => {
  it("is open inside the window, with the revisions left", () => {
    expect(correctionState(META, "2026-11-24T10:00:00.000Z")).toEqual({
      open: true,
      revisionsLeft: 2,
      finalLine: null,
    });
  });

  it("is still open one second before the end, and closed at it", () => {
    expect(correctionState(META, "2026-11-28T02:59:59.000Z").open).toBe(true);
    expect(correctionState(META, "2026-11-28T03:00:00.000Z")).toEqual({
      open: false,
      revisionsLeft: 2,
      finalLine: "This report is final (issued 21 Nov 2026).",
    });
  });

  it("is final after the window, on any device", () => {
    expect(correctionState(META, "2027-01-05T00:00:00.000Z")).toMatchObject({
      open: false,
      finalLine: "This report is final (issued 21 Nov 2026).",
    });
  });

  it("is final once no revision is left", () => {
    const used = { ...META, revisionsLeft: 0 };
    expect(correctionState(used, "2026-11-24T10:00:00.000Z")).toMatchObject({
      open: false,
      revisionsLeft: 0,
    });
  });
});

describe("issuedDay", () => {
  it("is the issue date as d MMM yyyy", () => {
    expect(issuedDay("2026-11-21T03:00:00.000Z")).toBe("21 Nov 2026");
  });
});

describe("tokenFromHash", () => {
  const token = "Ab0_-".repeat(8) + "xyz";

  it("accepts exactly 43 base64url characters after #", () => {
    expect(token).toHaveLength(43);
    expect(tokenFromHash(`#${token}`)).toBe(token);
  });

  it("rejects 42 or 44 characters, a query and other characters", () => {
    expect(tokenFromHash(`#${token.slice(1)}`)).toBeNull();
    expect(tokenFromHash(`#${token}a`)).toBeNull();
    expect(tokenFromHash(`#${token.slice(1)}?`)).toBeNull();
    expect(tokenFromHash(`#?${token}`)).toBeNull();
    expect(tokenFromHash(`#${token.slice(1)}=`)).toBeNull();
    expect(tokenFromHash(`#${token.slice(1)}+`)).toBeNull();
    expect(tokenFromHash(token)).toBeNull();
    expect(tokenFromHash("")).toBeNull();
  });
});

describe("reviseMessage", () => {
  it("words every reply without banned copy", () => {
    const replies: ReviseResponse[] = [
      { kind: "revised", version: 2 },
      { kind: "error", code: "closed" },
      { kind: "error", code: "limit" },
      { kind: "error", code: "occupation-changed" },
      { kind: "error", code: "invalid" },
      { kind: "error", code: "busy" },
    ];
    expect(reviseMessage(replies[0])).toContain("version 2");
    for (const reply of replies)
      expect(reviseMessage(reply)).not.toMatch(BANNED_COPY);
  });
});

describe("liveCoreFits (ruling R9)", () => {
  const OCTOBER = "2026-10-31";
  it("lets the live core join only a report of its own month", () => {
    const ready = (asAt: string) => ({ status: "ready", core: { asAt } });
    expect(liveCoreFits(ready("2026-10"), OCTOBER)).toBe(true);
    // After a monthly import the live file is newer than the report.
    expect(liveCoreFits(ready("2026-11"), OCTOBER)).toBe(false);
    expect(liveCoreFits(ready("2026-09"), OCTOBER)).toBe(false);
  });

  it("passes a file still loading, or one that failed, through as it is", () => {
    expect(liveCoreFits({ status: "loading" }, OCTOBER)).toBe(true);
    expect(liveCoreFits({ status: "unavailable" }, OCTOBER)).toBe(true);
  });
});
