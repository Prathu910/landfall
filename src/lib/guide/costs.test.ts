import { describe, expect, it } from "vitest";
import { FEES } from "../../data/guide/fees";
import {
  type CostInput,
  estimateCosts,
  formatFeeAmount,
  formatTotal,
  resolveFee,
} from "./costs";
import type { Fee } from "./types";

const AS_OF = "2026-11-23";
const BASE: CostInput = {
  visa: "189",
  situation: "offshore",
  partner: false,
  childrenUnder18: 0,
  children18Plus: 0,
  assessingBody: null,
  englishTest: null,
  naati: false,
  state: null,
  australianPoliceChecks: 0,
};
const aud = (estimate: ReturnType<typeof estimateCosts>) =>
  estimate.totals.find((t) => t.currency === "AUD");

describe("estimateCosts", () => {
  it("prices a single 189 applicant at the main visa charge", () => {
    const estimate = estimateCosts(BASE, FEES, AS_OF);
    expect(aud(estimate)).toEqual({ currency: "AUD", min: 6135, max: 6135 });
  });

  it("adds a partner and children at the extra-applicant charges", () => {
    const estimate = estimateCosts(
      {
        ...BASE,
        visa: "190",
        partner: true,
        childrenUnder18: 1,
        children18Plus: 1,
      },
      FEES,
      AS_OF,
    );
    // 6,140 + 2 × 3,070 (partner, child 18+) + 1,535 (child under 18)
    expect(aud(estimate)).toEqual({ currency: "AUD", min: 13815, max: 13815 });
    const adults = estimate.lines.find((l) => l.id === "vac-190-adult");
    expect(adults?.quantity).toBe(2);
  });

  it("keeps a ranged fee as a range in the total", () => {
    const estimate = estimateCosts(
      { ...BASE, assessingBody: "acs" },
      FEES,
      AS_OF,
    );
    expect(aud(estimate)).toEqual({ currency: "AUD", min: 7271, max: 7633 });
  });

  it("uses the fee for where the reader is now", () => {
    const off = estimateCosts(
      { ...BASE, assessingBody: "vetassess" },
      FEES,
      AS_OF,
    );
    const on = estimateCosts(
      { ...BASE, assessingBody: "vetassess", situation: "onshore" },
      FEES,
      AS_OF,
    );
    expect(aud(off)?.min).toBe(6135 + 1146);
    expect(aud(on)?.min).toBe(6135 + 1260.6);
  });

  it("adds cents without floating-point drift", () => {
    const estimate = estimateCosts(
      {
        ...BASE,
        visa: "190",
        situation: "onshore",
        assessingBody: "vetassess",
        state: "QLD",
      },
      FEES,
      AS_OF,
    );
    // 6,140 + 1,260.60 + 630.30; plain float addition gives 8030.900000000001.
    expect(aud(estimate)?.min).toBe(8030.9);
  });

  it("applies a published fee change from its date, not before", () => {
    const before = estimateCosts(
      { ...BASE, assessingBody: "acs" },
      FEES,
      "2027-01-04",
    );
    const after = estimateCosts(
      { ...BASE, assessingBody: "acs" },
      FEES,
      "2027-01-05",
    );
    expect(aud(before)?.max).toBe(6135 + 1498);
    expect(aud(after)?.max).toBe(6135 + 1551);
  });

  it("totals another currency on its own, never converted", () => {
    const estimate = estimateCosts(
      { ...BASE, englishTest: "ielts-india" },
      FEES,
      AS_OF,
    );
    expect(estimate.totals).toEqual([
      { currency: "AUD", min: 6135, max: 6135 },
      { currency: "INR", min: 19000, max: 19000 },
    ]);
  });

  it("lists unpriced items apart and leaves them out of the totals", () => {
    const estimate = estimateCosts(
      { ...BASE, englishTest: "pte", naati: true },
      FEES,
      AS_OF,
    );
    expect(aud(estimate)?.max).toBe(6135);
    const unpriced = estimate.unpriced.map((l) => l.id);
    expect(unpriced).toEqual(
      expect.arrayContaining([
        "pte",
        "naati",
        "health",
        "overseas-police",
        "translations",
      ]),
    );
    expect(estimate.lines.map((l) => l.id)).not.toContain("pte");
  });

  it("turns a fee into 'check' once its announced change starts", () => {
    const estimate = estimateCosts(
      { ...BASE, englishTest: "ielts-india" },
      FEES,
      "2027-01-01",
    );
    expect(estimate.totals.map((t) => t.currency)).toEqual(["AUD"]);
    expect(estimate.unpriced.map((l) => l.id)).toContain("ielts-india");
  });

  it("adds state nomination only for 190 and 491", () => {
    const visa189 = estimateCosts({ ...BASE, state: "SA" }, FEES, AS_OF);
    const visa491 = estimateCosts(
      { ...BASE, visa: "491", state: "SA" },
      FEES,
      AS_OF,
    );
    expect(aud(visa189)?.max).toBe(6135);
    expect(aud(visa491)?.max).toBe(6140 + 394);
  });

  it("prices one Australian police check per person the reader counts", () => {
    const estimate = estimateCosts(
      {
        ...BASE,
        partner: true,
        childrenUnder18: 1,
        australianPoliceChecks: 2,
      },
      FEES,
      AS_OF,
    );
    const afp = estimate.lines.find((l) => l.id === "afp");
    expect(afp?.quantity).toBe(2);
    expect(afp?.total).toEqual({ kind: "fixed", currency: "AUD", amount: 114 });
  });

  it("counts police checks for a 16 or 17 year old, but never more than the applicants", () => {
    const family = { ...BASE, partner: true, childrenUnder18: 1 };
    const all = estimateCosts(
      { ...family, australianPoliceChecks: 3 },
      FEES,
      AS_OF,
    );
    expect(all.lines.find((l) => l.id === "afp")?.quantity).toBe(3);
    const tooMany = estimateCosts(
      { ...family, australianPoliceChecks: 9 },
      FEES,
      AS_OF,
    );
    expect(tooMany.lines.find((l) => l.id === "afp")?.quantity).toBe(3);
    const none = estimateCosts(BASE, FEES, AS_OF);
    expect(none.lines.find((l) => l.id === "afp")).toBeUndefined();
  });

  it("labels the check with the Home Affairs rule", () => {
    expect(FEES.afpCheck.label).toMatch(/aged 16 or over/);
    expect(FEES.afpCheck.label).toMatch(/12 months or more in Australia/);
  });

  it("ignores negative or fractional child counts", () => {
    const estimate = estimateCosts(
      { ...BASE, childrenUnder18: -2, children18Plus: 1.7 },
      FEES,
      AS_OF,
    );
    expect(aud(estimate)?.max).toBe(6135 + 3070);
  });
});

describe("resolveFee", () => {
  const fee: Fee = {
    id: "x",
    label: "X",
    amount: { kind: "fixed", currency: "AUD", amount: 10 },
    source: "https://example.gov.au",
    checkedAt: "2026-11-23",
    changes: [
      {
        from: "2027-03-01",
        amount: { kind: "fixed", currency: "AUD", amount: 30 },
      },
      {
        from: "2027-01-01",
        amount: { kind: "fixed", currency: "AUD", amount: 20 },
      },
    ],
  };
  it("takes the latest change that has started", () => {
    expect(resolveFee(fee, "offshore", "2027-02-01").amount).toEqual({
      kind: "fixed",
      currency: "AUD",
      amount: 20,
    });
    expect(resolveFee(fee, "offshore", "2027-03-01").amount).toEqual({
      kind: "fixed",
      currency: "AUD",
      amount: 30,
    });
  });
  it("names the next change while it is still ahead", () => {
    expect(resolveFee(fee, "offshore", "2026-12-01").upcoming?.from).toBe(
      "2027-01-01",
    );
  });
});

describe("formatting", () => {
  it("writes fixed, ranged and unpriced amounts", () => {
    expect(
      formatFeeAmount({ kind: "fixed", currency: "AUD", amount: 6135 }),
    ).toBe("AUD 6,135");
    expect(
      formatFeeAmount({ kind: "fixed", currency: "AUD", amount: 1260.6 }),
    ).toBe("AUD 1,260.60");
    expect(
      formatFeeAmount({ kind: "range", currency: "AUD", min: 505, max: 1034 }),
    ).toBe("AUD 505–1,034");
    expect(formatFeeAmount({ kind: "varies", reason: "r" })).toBe("Varies");
    expect(formatFeeAmount({ kind: "check", reason: "r" })).toBe(
      "Check current fee",
    );
  });
  it("writes a total as one figure when it has no range", () => {
    expect(formatTotal({ currency: "INR", min: 19000, max: 19000 })).toBe(
      "INR 19,000",
    );
    expect(formatTotal({ currency: "AUD", min: 7271, max: 7633 })).toBe(
      "AUD 7,271–7,633",
    );
  });
});
