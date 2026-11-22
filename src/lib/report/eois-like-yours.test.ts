import { describe, expect, it } from "vitest";
import { coreFixture, detailFixture } from "../data/__fixtures__/occupation";
import type { OccupationDetail } from "../data/types";
import { formatInterval } from "../pool";
import { BANNED_COPY } from "./copy";
import { buildEoisLikeYours } from "./eois-like-yours";

const nurseCohort = (
  S: string,
  I: string,
  L: string,
  H: string,
  C: string,
): Record<string, string> => ({
  SUBMITTED: S,
  INVITED: I,
  LODGED: L,
  HOLD: H,
  CLOSED: C,
});

const detail: OccupationDetail = {
  ...detailFixture,
  cohorts: {
    "189": {
      older: {},
      "2024-12": nurseCohort("100", "200", "50", "30", "400"),
      "2025-01": nurseCohort("110", "190", "55", "25", "450"),
      "2025-02": nurseCohort("142", "175", "60", "<20", "510"),
      "2025-03": nurseCohort("150", "100", "40", "<20", "300"),
      "2025-04": nurseCohort("160", "90", "30", "<20", "200"),
      "2025-05": nurseCohort("170", "80", "20", "<20", "100"),
      "2026-09": nurseCohort("500", "<20", "60", "<20", "0"),
    },
  },
};
const core = { ...coreFixture, asAt: "2026-10" };
const base = {
  occupationName: "Registered Nurses nec",
  core,
  detail,
  asOf: "2026-11-17",
};

function ready(r: ReturnType<typeof buildEoisLikeYours>) {
  if (r.kind !== "ready") throw new Error(`expected ready, got ${r.kind}`);
  return r;
}

describe("buildEoisLikeYours", () => {
  it("describes your submission month", () => {
    const r = ready(buildEoisLikeYours({ ...base, submittedMonth: "2025-02" }));
    expect(r.basis).toBe("your-month");
    expect(r.basisNote).toBeNull();
    expect(r.sentence).toBe(
      "Of the 887–906 Registered Nurses nec EOIs from Feb 2025, as at Oct 2026: 175 are invited and 60 have a visa application lodged.",
    );
    expect(r.numbers).toEqual({
      invited: "175",
      lodged: "60",
      waiting: "142",
      closed: "510",
      hold: "under 20",
    });
    expect(r.bar.waiting).toEqual({ min: 142, max: 142 });
    expect(r.statusNote).toBe(
      "Each EOI is counted once, in its status as at Oct 2026; EOIs that lodged or closed may have been invited earlier.",
    );
    expect(r.closedNote).toBe(
      "Closed means expired, withdrawn or finalised (finalised includes granted visas).",
    );
  });

  it("keys every outcome, on hold included, summing to the sentence's total", () => {
    const r = ready(buildEoisLikeYours({ ...base, submittedMonth: "2025-02" }));
    expect(r.outcomes.map((o) => [o.label, o.count])).toEqual([
      ["Invited, not yet lodged", "175"],
      ["Lodged a visa", "60"],
      ["Still waiting", "142"],
      ["Closed", "510"],
      ["On hold", "under 20"],
    ]);
    const sum = r.outcomes.reduce(
      (a, o) => ({ min: a.min + o.interval.min, max: a.max + o.interval.max }),
      { min: 0, max: 0 },
    );
    expect(sum).toEqual({ min: 887, max: 906 });
    expect(r.sentence).toContain(`Of the ${formatInterval(sum)} `);
  });

  it("reads a total of masked counts as under N, never 0–38 (ruling R20)", () => {
    const r = ready(
      buildEoisLikeYours({
        ...base,
        detail: {
          ...detail,
          cohorts: {
            "189": {
              older: {},
              "2025-02": nurseCohort("<20", "<20", "0", "0", "0"),
            },
          },
        },
        submittedMonth: "2025-02",
      }),
    );
    expect(r.sentence).toMatch(/^Of the under 39 Registered Nurses nec EOIs /);
  });

  it("leaves on hold out of the key when it is zero", () => {
    const r = ready(
      buildEoisLikeYours({
        ...base,
        detail: {
          ...detail,
          cohorts: { "189": { "2025-02": { SUBMITTED: "5", INVITED: "6" } } },
        },
        submittedMonth: "2025-02",
      }),
    );
    expect(r.outcomes.map((o) => o.key)).toEqual([
      "invited",
      "lodged",
      "waiting",
      "closed",
    ]);
  });

  it("lists up to two months either side and flags yours", () => {
    const r = ready(buildEoisLikeYours({ ...base, submittedMonth: "2025-02" }));
    expect(r.nearby.map((row) => row.month)).toEqual([
      "2024-12",
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
    ]);
    expect(r.nearby.filter((row) => row.isYours)).toHaveLength(1);
    expect(r.nearby[2]).toMatchObject({
      label: "Feb 2025",
      invited: "175",
      lodged: "60",
      waiting: "142",
      closed: "510",
      isYours: true,
    });
  });

  it("only lists nearby months that exist", () => {
    const r = ready(buildEoisLikeYours({ ...base, submittedMonth: "2024-12" }));
    expect(r.nearby.map((row) => row.month)).toEqual([
      "2024-12",
      "2025-01",
      "2025-02",
    ]);
  });

  it("omits hold when it is zero and says a masked count may be zero", () => {
    const r = ready(buildEoisLikeYours({ ...base, submittedMonth: "2026-09" }));
    expect(r.numbers.invited).toBe("under 20");
    expect(r.numbers.hold).toBe("under 20");
    expect(r.sentence).toContain(
      "under 20 (so may be zero) are invited and 60 have",
    );
    const noHold = ready(
      buildEoisLikeYours({
        ...base,
        detail: {
          ...detail,
          cohorts: { "189": { "2025-02": { SUBMITTED: "5", INVITED: "6" } } },
        },
        submittedMonth: "2025-02",
      }),
    );
    expect(noHold.numbers.hold).toBeNull();
  });

  it("uses the latest complete month when no EOI date is given", () => {
    const r = ready(buildEoisLikeYours({ ...base, submittedMonth: null }));
    expect(r.basis).toBe("latest-complete");
    expect(r.month).toBe("2026-09");
    expect(r.basisNote).toBe(
      "You haven't added an EOI date, so this shows EOIs submitted in Sep 2026.",
    );
  });

  it("is too-old before the stored window", () => {
    expect(buildEoisLikeYours({ ...base, submittedMonth: "2023-10" })).toEqual({
      kind: "too-old",
      text: "Not available for EOIs this old.",
    });
  });

  it("is loading without detail", () => {
    expect(
      buildEoisLikeYours({ ...base, detail: null, submittedMonth: "2025-02" }),
    ).toEqual({ kind: "loading" });
  });

  it("says an EOI month after the snapshot isn't in the published data yet", () => {
    const expected = {
      kind: "after-snapshot",
      text: "Your EOI month (Nov 2026) is after this snapshot (as at Oct 2026), so it isn't in the published data yet.",
    };
    expect(buildEoisLikeYours({ ...base, submittedMonth: "2026-11" })).toEqual(
      expected,
    );
    expect(
      buildEoisLikeYours({ ...base, detail: null, submittedMonth: "2026-11" }),
    ).toEqual(expected);
  });

  it("says no EOIs from an in-window month appear when its row is absent", () => {
    // A fetched cohort table with no row for a month means zero, not unknown.
    expect(buildEoisLikeYours({ ...base, submittedMonth: "2025-08" })).toEqual({
      kind: "no-eois",
      text: "No Registered Nurses nec 189 EOIs from Aug 2025 appear in this snapshot.",
    });
  });

  it("is unavailable when the occupation has no 189 cohort table", () => {
    expect(
      buildEoisLikeYours({
        ...base,
        detail: { ...detail, cohorts: {} },
        submittedMonth: "2025-08",
      }),
    ).toEqual({
      kind: "unavailable",
      text: "Published outcomes by submission month are not available for this occupation.",
    });
  });

  it("never uses banned copy", () => {
    for (const month of [
      "2025-02",
      "2026-09",
      null,
      "2023-10",
      "2025-08",
      "2026-11",
    ]) {
      const r = buildEoisLikeYours({ ...base, submittedMonth: month });
      expect(JSON.stringify(r)).not.toMatch(BANNED_COPY);
    }
  });
});
