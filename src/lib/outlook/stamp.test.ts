import { describe, expect, it } from "vitest";
import type { Label189 } from "./label-189";
import type { VisaLabel } from "./label-state";
import type { OutlookLabel } from "./labels";
import { chooseStamp } from "./stamp";

const POINTS = { base: 80, s190: 85, s491: 95 };

function v189(label: OutlookLabel, tooFew = false): Label189 {
  return { label, tooFew, lastThree: [], ahead: null, tied: null, why: "" };
}

function visa(
  visaCode: "190" | "491",
  label: OutlookLabel,
  state: "TAS" | "NT" | null,
): VisaLabel {
  const points = visaCode === "190" ? POINTS.s190 : POINTS.s491;
  return {
    visa: visaCode,
    points,
    label,
    best: state
      ? {
          state,
          visa: visaCode,
          label,
          flag: null,
          rules: "",
          confirmedAtOrBelow: 0,
          monthsAtOrBelow6: 0,
          latest: null,
        }
      : null,
    states: [],
  };
}

describe("chooseStamp", () => {
  it("189 very strong beats 190 strong", () => {
    const stamp = chooseStamp(
      v189("very-strong"),
      visa("190", "strong", "TAS"),
      null,
      POINTS,
    );
    expect(stamp).toEqual({
      kind: "single",
      visa: "189",
      state: null,
      label: "very-strong",
      points: 80,
      tooFew: false,
    });
  });

  it("189 long wait with 190 competitive gives a single 190 stamp", () => {
    const stamp = chooseStamp(
      v189("long-wait"),
      visa("190", "competitive", "TAS"),
      visa("491", "long-wait", "NT"),
      POINTS,
    );
    expect(stamp).toMatchObject({
      kind: "single",
      visa: "190",
      state: "TAS",
      label: "competitive",
      points: 85,
    });
  });

  it("a tie goes to 189, then 190, then 491", () => {
    expect(
      chooseStamp(
        v189("competitive"),
        visa("190", "competitive", "TAS"),
        visa("491", "competitive", "NT"),
        POINTS,
      ),
    ).toMatchObject({ visa: "189" });
    expect(
      chooseStamp(
        v189("long-wait"),
        visa("190", "competitive", "TAS"),
        visa("491", "competitive", "NT"),
        POINTS,
      ),
    ).toMatchObject({ visa: "190", state: "TAS" });
    expect(
      chooseStamp(
        v189("long-wait"),
        visa("190", "long-wait", "TAS"),
        visa("491", "competitive", "NT"),
        POINTS,
      ),
    ).toMatchObject({ visa: "491", state: "NT", points: 95 });
  });

  it("is combined when the best label is below competitive", () => {
    expect(
      chooseStamp(
        v189("long-wait"),
        visa("190", "not-invited", null),
        visa("491", "not-open", null),
        POINTS,
      ),
    ).toEqual({ kind: "combined", label: "long-wait", tooFew: false });
  });

  it("combines to not invited and carries no state", () => {
    expect(
      chooseStamp(
        v189("not-invited"),
        visa("190", "not-invited", "TAS"),
        visa("491", "no-data", null),
        POINTS,
      ),
    ).toEqual({ kind: "combined", label: "not-invited", tooFew: false });
  });

  it("treats a missing 190 or 491 as no data and keeps tooFew from 189", () => {
    expect(chooseStamp(v189("no-data", true), null, null, POINTS)).toEqual({
      kind: "combined",
      label: "no-data",
      tooFew: true,
    });
  });
});
