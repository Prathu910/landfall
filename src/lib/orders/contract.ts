/**
 * The paid report's wire contract, shared by the browser and the Deno
 * Functions. No DOM or runtime globals; sibling imports carry `.ts` so Deno
 * can load them. Amounts never travel from the browser: they come only from
 * the `report_settings` row.
 */
import { normalizeEmail, record, validEmail } from "../submissions/contract.ts";

export type Currency = "INR" | "USD";
export const CURRENCIES: readonly Currency[] = ["INR", "USD"];

/** Founding codes: 6 digits, 10 minutes, 5 tries, one resend a minute. */
export const CODE_TTL_MINUTES = 10;

export type Quote = {
  /** Smallest unit (paise, cents). USD is null while `usd_enabled` is off. */
  prices: { INR: number; USD: number | null };
  founding: { enabled: boolean; remaining: number; limit: number };
};

export type OrderRequest = {
  profile: unknown;
  email: string;
  currency: Currency;
  consent: true;
  asOf: string;
  turnstile_token: string;
};
export type OrderErrorCode =
  | "invalid"
  | "no-data"
  | "founding-used"
  | "founding-full"
  | "usd-off"
  | "busy"
  | "verification";
export type OrderResponse =
  | { kind: "code-sent"; claimId: string; emailHint: string }
  | {
      kind: "razorpay";
      orderId: string;
      keyId: string;
      amount: number;
      currency: Currency;
    }
  | { kind: "issued"; token: string }
  | { kind: "error"; code: OrderErrorCode };

export type VerifyRequest = { claimId: string; code: string };
export type VerifyResponse =
  | { kind: "issued"; token: string }
  | {
      kind: "error";
      code: "wrong-code" | "expired" | "locked" | "founding-full";
    };

export type ConfirmRequest = {
  orderId: string;
  paymentId: string;
  signature: string;
};
export type ConfirmResponse =
  | { kind: "issued"; token: string }
  | { kind: "error"; code: "signature" | "pending" };

/** Opaque here; the frontend narrows it with plan 1's payload types. */
export type ReportPayloadJson = unknown;
export type ReportGetResponse =
  | { kind: "report"; payload: ReportPayloadJson }
  | { kind: "revoked" }
  | { kind: "expired" }
  | { kind: "not-found" };

export type ReviseRequest = { token: string; profile: unknown };
export type ReviseResponse =
  | { kind: "revised"; version: number }
  | {
      kind: "error";
      code: "closed" | "limit" | "invalid" | "occupation-changed";
    };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^\d{6}$/;
/** 32 random bytes, base64url without padding. */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const ORDER_ID = /^order_[A-Za-z0-9]{1,40}$/;
const PAYMENT_ID = /^pay_[A-Za-z0-9]{1,40}$/;
const SIGNATURE = /^[0-9a-f]{64}$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function validToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN.test(value);
}

function calendarDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return date.toISOString().slice(0, 10) === value;
}

function spamToken(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim() !== "" && value.length <= 2048
  );
}

/** Builds a fresh object from the known fields: anything else is dropped. */
export function validateOrderRequest(value: unknown): OrderRequest | null {
  if (
    !record(value) ||
    !record(value.profile) ||
    !validEmail(value.email) ||
    !CURRENCIES.some((currency) => currency === value.currency) ||
    value.consent !== true ||
    !calendarDate(value.asOf) ||
    !spamToken(value.turnstile_token)
  )
    return null;
  return {
    profile: value.profile,
    email: normalizeEmail(value.email),
    currency: value.currency as Currency,
    consent: true,
    asOf: value.asOf,
    turnstile_token: value.turnstile_token,
  };
}

export function validateVerify(value: unknown): VerifyRequest | null {
  if (
    !record(value) ||
    typeof value.claimId !== "string" ||
    !UUID.test(value.claimId) ||
    typeof value.code !== "string" ||
    !CODE.test(value.code)
  )
    return null;
  return { claimId: value.claimId.toLowerCase(), code: value.code };
}

export function validateConfirm(value: unknown): ConfirmRequest | null {
  if (
    !record(value) ||
    typeof value.orderId !== "string" ||
    !ORDER_ID.test(value.orderId) ||
    typeof value.paymentId !== "string" ||
    !PAYMENT_ID.test(value.paymentId) ||
    typeof value.signature !== "string" ||
    !SIGNATURE.test(value.signature)
  )
    return null;
  return {
    orderId: value.orderId,
    paymentId: value.paymentId,
    signature: value.signature,
  };
}

export function validateRevise(value: unknown): ReviseRequest | null {
  if (!record(value) || !validToken(value.token) || !record(value.profile))
    return null;
  return { token: value.token, profile: value.profile };
}

/** "aarav@gmail.com" becomes "a•••@gmail.com"; no "@" shows nothing. */
export function emailHint(email: string): string {
  const normal = normalizeEmail(email);
  const at = normal.lastIndexOf("@");
  if (at < 1) return "•••";
  return `${normal[0]}•••${normal.slice(at)}`;
}
