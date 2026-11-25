import { describe, expect, it } from "vitest";
import { HEADERS, NURSE, SOFTWARE_ENGINEER } from "./generate-fixture";
import { fetchViews } from "./import-fetch";
import type { QlikSession } from "./qlik-client";
import { VISA_NAMES } from "./qlik-constants";
import { decodeRaw, encodeRaw } from "./raw-store";
import { VIEWS } from "./views";

type Table = { header: string[]; rows: string[][] };

function fakeSession(tables: (call: number) => Table): QlikSession {
  let calls = 0;
  return {
    applyBookmark: async () => {},
    setToggle: async () => {},
    select: async () => {},
    clear: async () => {},
    readTable: async () => tables(calls++),
    listAsAtMonths: async () => [],
    pageReads: () => calls,
    close: () => {},
  };
}

const view = (id: string) => VIEWS.find((v) => v.id === id)!;
const poolRow = (occupation: string, points: string) => [
  "10/2026",
  VISA_NAMES["189"],
  occupation,
  "SUBMITTED",
  points,
  "<20",
];
const poolTable: Table = {
  header: HEADERS.byScore,
  rows: [poolRow(SOFTWARE_ENGINEER, "70"), poolRow(NURSE, "65")],
};

describe("fetchViews", () => {
  it("partitions cohorts-by-score by the pool's scores and keeps empty tables", async () => {
    const empty: Table = { header: HEADERS.bySubmitted, rows: [] };
    const session = fakeSession((call) => (call === 0 ? poolTable : empty));
    const files = await fetchViews(
      session,
      [
        { view: view("pool-by-score"), month: "2026-10" },
        { view: view("cohorts-by-score"), month: "2026-10" },
      ],
      { log: () => {} },
    );
    expect(files.map((file) => file.viewId)).toEqual([
      "pool-by-score",
      "cohorts-by-score",
    ]);
    const cohorts = files[1];
    expect(cohorts.parts.map((part) => part.partition)).toEqual([
      { score: "65" },
      { score: "70" },
    ]);
    expect(decodeRaw(cohorts.parts[0].table)).toEqual(empty);
  });

  it("partitions state views by every named state and ANY", async () => {
    const session = fakeSession(() => ({ header: HEADERS.byScore, rows: [] }));
    const [file] = await fetchViews(
      session,
      [{ view: view("state-pool"), month: "2026-10" }],
      { log: () => {} },
    );
    expect(file.parts.map((part) => part.partition.state)).toEqual([
      "ACT",
      "NSW",
      "NT",
      "QLD",
      "SA",
      "TAS",
      "VIC",
      "WA",
      "ANY",
    ]);
  });

  it("stops when consecutive queries return the same sizeable table", async () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      poolRow(SOFTWARE_ENGINEER, String(60 + i)),
    );
    const session = fakeSession(() => ({ header: HEADERS.byScore, rows }));
    await expect(
      fetchViews(session, [{ view: view("state-pool"), month: "2026-10" }], {
        log: () => {},
      }),
    ).rejects.toThrow(/identical/);
  });

  it("hands over each file as soon as its view-month completes", async () => {
    const empty: Table = { header: HEADERS.byOccupation, rows: [] };
    const session = fakeSession(() => empty);
    const handed: string[] = [];
    await fetchViews(
      session,
      [
        { view: view("status-history"), month: "2026-09" },
        { view: view("status-history"), month: "2026-10" },
      ],
      {
        log: () => {},
        onFile: (file) => {
          handed.push(`${file.viewId} ${file.asAt}`);
          throw new Error("stop after the first file");
        },
      },
    ).catch(() => {});
    expect(handed).toEqual(["status-history 2026-09"]);
  });

  it("takes cohorts-by-score scores from the stored pool when it is not re-fetched", async () => {
    const session = fakeSession(() => ({
      header: HEADERS.bySubmitted,
      rows: [],
    }));
    const [file] = await fetchViews(
      session,
      [{ view: view("cohorts-by-score"), month: "2026-10" }],
      {
        log: () => {},
        readStoredPool: (month) =>
          month === "2026-10"
            ? {
                viewId: "pool-by-score",
                asAt: "2026-10",
                fetchedAt: "2026-11-17T00:00:00Z",
                source: "https://example.test",
                selections: {},
                parts: [
                  {
                    partition: {},
                    table: encodeRaw(poolTable.header, poolTable.rows),
                  },
                ],
              }
            : undefined,
      },
    );
    expect(file.parts.map((part) => part.partition.score)).toEqual([
      "65",
      "70",
    ]);
  });
});
