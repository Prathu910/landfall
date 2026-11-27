// Razorpay: creating orders, checking payment and webhook signatures, and
// reading webhook events. Secrets never reach an error message; callers pass
// the fetch, so tests make no network calls.

import type { Currency } from "../../../../src/lib/orders/contract.ts";
import { record } from "../../../../src/lib/submissions/contract.ts";
import { constantTimeEqual } from "../read-token.ts";

const ORDERS_URL = "https://api.razorpay.com/v1/orders";
const TIMEOUT_MS = 15_000;

/** A failed order request. The message names only the HTTP status. */
export class RazorpayError extends Error {
  constructor(public status: number) {
    super(
      status
        ? `Razorpay order request failed (HTTP ${status})`
        : "Razorpay order request failed",
    );
    this.name = "RazorpayError";
  }
}

export async function createRazorpayOrder(
  cfg: { keyId: string; keySecret: string },
  order: {
    amount: number;
    currency: Currency;
    receipt: string;
    notes: Record<string, string>;
  },
  fetcher: typeof fetch,
): Promise<{ id: string; amount: number; currency: Currency }> {
  let result: Response;
  try {
    result = await fetcher(ORDERS_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${cfg.keyId}:${cfg.keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // The cause may echo request details; drop it.
    throw new RazorpayError(0);
  }
  if (!result.ok) {
    await result.body?.cancel();
    throw new RazorpayError(result.status);
  }
  let value: unknown;
  try {
    value = await result.json();
  } catch {
    throw new RazorpayError(result.status);
  }
  if (
    !record(value) ||
    typeof value.id !== "string" ||
    !value.id.startsWith("order_") ||
    value.amount !== order.amount ||
    value.currency !== order.currency
  )
    throw new RazorpayError(result.status);
  return { id: value.id, amount: value.amount, currency: order.currency };
}

/** HMAC-SHA256 of the message, as lowercase hex. */
export async function hmacHex(
  secret: string,
  message: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signed), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function signed(
  message: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!secret || !signature) return false;
  return constantTimeEqual(signature, await hmacHex(secret, message));
}

/** Checkout's razorpay_signature: HMAC of "order_id|payment_id" with the key secret. */
export function validPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): Promise<boolean> {
  return signed(`${orderId}|${paymentId}`, signature, keySecret);
}

/** X-Razorpay-Signature: HMAC of the raw request body with the webhook secret. */
export function validWebhookSignature(
  rawBody: string,
  header: string,
  webhookSecret: string,
): Promise<boolean> {
  return signed(rawBody, header, webhookSecret);
}

export type RazorpayEvent = {
  event: string;
  payment?: {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
  };
  refund?: { payment_id: string };
};

function entity(
  payload: unknown,
  name: string,
): Record<string, unknown> | null {
  if (!record(payload)) return null;
  const wrapper = payload[name];
  return record(wrapper) && record(wrapper.entity) ? wrapper.entity : null;
}

function payment(
  value: Record<string, unknown> | null,
): RazorpayEvent["payment"] {
  if (
    !value ||
    typeof value.id !== "string" ||
    !value.id.startsWith("pay_") ||
    typeof value.order_id !== "string" ||
    !value.order_id.startsWith("order_") ||
    typeof value.amount !== "number" ||
    !Number.isInteger(value.amount) ||
    typeof value.currency !== "string" ||
    typeof value.status !== "string"
  )
    return undefined;
  return {
    id: value.id,
    order_id: value.order_id,
    amount: value.amount,
    currency: value.currency,
    status: value.status,
  };
}

/**
 * The parts of a webhook body the Functions use. Null only when it isn't an
 * event; a payment or refund that doesn't fit is left out, so callers ignore it.
 */
export function parseRazorpayEvent(v: unknown): RazorpayEvent | null {
  if (!record(v) || typeof v.event !== "string") return null;
  const event: RazorpayEvent = { event: v.event };
  const paid = payment(entity(v.payload, "payment"));
  if (paid) event.payment = paid;
  const refund = entity(v.payload, "refund");
  if (
    refund &&
    typeof refund.payment_id === "string" &&
    refund.payment_id.startsWith("pay_")
  )
    event.refund = { payment_id: refund.payment_id };
  return event;
}
