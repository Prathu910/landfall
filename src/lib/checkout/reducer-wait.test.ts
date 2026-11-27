import { describe, expect, it } from "vitest";
import type { Quote } from "../orders/contract";
import { checkoutMessage } from "./messages";
import {
  checkoutReducer,
  initialCheckout,
  type CheckoutEvent,
  type CheckoutState,
} from "./reducer";

const FOUNDING: Quote = {
  prices: { INR: 69900, USD: 1400 },
  founding: { enabled: true, remaining: 63, limit: 100 },
};
const CLAIM = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";
const SENT = {
  type: "order",
  response: { kind: "code-sent", claimId: CLAIM, emailHint: "a•••@gmail.com" },
} as const;
const HUMAN = { type: "turnstile", token: "turnstile-ok" } as const;

function run(state: CheckoutState, ...events: CheckoutEvent[]) {
  return events.reduce(checkoutReducer, state);
}

function wait(seconds: number): CheckoutEvent {
  return { type: "order", response: { kind: "wait", seconds } };
}

/** A reader in the code step, with a fresh spam check for a resend. */
function coding() {
  return run(
    initialCheckout(FOUNDING, "INR"),
    { type: "email", email: "aarav@gmail.com" },
    { type: "consent", consent: true },
    HUMAN,
    { type: "submit" },
    SENT,
    HUMAN,
  );
}

describe("report-order's busy with Retry-After (wait)", () => {
  it("a resend inside a minute keeps the code step and the claim", () => {
    let s = run(coding(), { type: "code", code: "12" }, { type: "resend" });
    expect(s.status).toBe("submitting");
    s = run(s, wait(42));
    expect(s).toMatchObject({
      status: "code",
      claimId: CLAIM,
      emailHint: "a•••@gmail.com",
      code: "12",
      turnstile: "",
      error: { code: "wait", seconds: 42 },
    });
    expect(checkoutMessage(s)).toBe(
      "The code we sent still works. You can ask for a new one in 42 seconds.",
    );
    // The code already sent can still be entered and verified.
    s = run(s, { type: "code", code: "123456" }, { type: "submit" });
    expect(s).toMatchObject({ status: "verifying", claimId: CLAIM });
  });

  it("a locked claim waits in ready, keeping email and consent, with no server-fault copy", () => {
    let s = run(
      coding(),
      { type: "code", code: "000000" },
      { type: "submit" },
      {
        type: "verify",
        response: { kind: "error", code: "wrong-code", triesLeft: 0 },
      },
    );
    expect(s).toMatchObject({ status: "ready", error: { code: "locked" } });
    expect(s.claimId).toBeUndefined();
    s = run(s, HUMAN, { type: "submit" }, wait(540));
    expect(s).toMatchObject({
      status: "ready",
      email: "aarav@gmail.com",
      consent: true,
      error: { code: "wait", seconds: 540 },
    });
    expect(checkoutMessage(s)).toBe("You can ask for a new code in 9 minutes.");
    expect(checkoutMessage(s)).not.toMatch(/our side|went wrong/);
  });

  it("“Use a different email”, then the same address again, returns to its code", () => {
    let s = run(coding(), { type: "change-email" });
    expect(s).toMatchObject({ status: "ready", claimId: CLAIM, code: "" });
    s = run(s, { type: "submit" }, wait(30));
    expect(s).toMatchObject({
      status: "code",
      claimId: CLAIM,
      error: { code: "wait", seconds: 30 },
    });
  });

  it("a different email drops the held claim, so a wait stays in ready", () => {
    let s = run(
      coding(),
      { type: "change-email" },
      { type: "email", email: "other@gmail.com" },
    );
    expect(s.claimId).toBeUndefined();
    expect(s.emailHint).toBeUndefined();
    s = run(s, { type: "submit" }, wait(30));
    expect(s).toMatchObject({ status: "ready", error: { code: "wait" } });
    expect(checkoutMessage(s)).toBe(
      "You can ask for a new code in 30 seconds.",
    );
  });

  it("a busy without Retry-After is still a server fault", () => {
    const s = run(
      coding(),
      { type: "change-email" },
      { type: "submit" },
      {
        type: "order",
        response: { kind: "error", code: "busy" },
      },
    );
    expect(s).toMatchObject({ status: "ready", error: { code: "busy" } });
    expect(s.claimId).toBeUndefined();
  });
});
