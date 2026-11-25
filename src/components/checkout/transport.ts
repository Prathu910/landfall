import type {
  ConfirmRequest,
  ConfirmResponse,
  OrderRequest,
  OrderResponse,
  Quote,
  ReportGetResponse,
  ReviseRequest,
  ReviseResponse,
  VerifyRequest,
  VerifyResponse,
} from "../../lib/orders/contract";
import { BUSY } from "../../lib/checkout/messages";
import { checkoutConfig } from "../submissions/config";

const TIMEOUT_MS = 20000;
export const OFFLINE =
  "Check your connection and try again. Your answers are still here.";
const SLOW = "This is taking too long. Check your connection and try again.";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function count(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Prices are rendered from this, so every field is checked. */
export function isQuote(value: unknown): value is Quote {
  if (!record(value) || !record(value.prices) || !record(value.founding))
    return false;
  const { prices, founding } = value;
  return (
    count(prices.INR) &&
    (prices.USD === null || count(prices.USD)) &&
    typeof founding.enabled === "boolean" &&
    count(founding.remaining) &&
    count(founding.limit) &&
    founding.limit > 0
  );
}

/** A Function's reply: a business outcome carries a `kind`, at any status. */
function hasKind(value: unknown): value is { kind: string } {
  return record(value) && typeof value.kind === "string";
}

async function call(
  name: string,
  init: { method: "GET" } | { method: "POST"; body: unknown },
): Promise<unknown> {
  const config = checkoutConfig();
  if (!config) throw new Error(BUSY);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}/functions/v1/${name}`, {
      method: init.method,
      credentials: "omit",
      cache: "no-store",
      headers:
        init.method === "POST"
          ? { "Content-Type": "application/json" }
          : undefined,
      body: init.method === "POST" ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (name === "report-quote" && response.ok) return body;
    if (hasKind(body)) return body;
    throw new Error(BUSY);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error(SLOW);
    if (error instanceof TypeError) throw new Error(OFFLINE);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getQuote(): Promise<Quote> {
  const body = await call("report-quote", { method: "GET" });
  if (!isQuote(body)) throw new Error(BUSY);
  return body;
}

export async function postOrder(req: OrderRequest): Promise<OrderResponse> {
  return (await call("report-order", {
    method: "POST",
    body: req,
  })) as OrderResponse;
}

export async function postVerify(req: VerifyRequest): Promise<VerifyResponse> {
  return (await call("report-verify", {
    method: "POST",
    body: req,
  })) as VerifyResponse;
}

export async function postConfirm(
  req: ConfirmRequest,
): Promise<ConfirmResponse> {
  return (await call("report-confirm", {
    method: "POST",
    body: req,
  })) as ConfirmResponse;
}

/** The token travels only in the body, never in a URL. */
export async function postGet(token: string): Promise<ReportGetResponse> {
  return (await call("report-get", {
    method: "POST",
    body: { token },
  })) as ReportGetResponse;
}

export async function postRevise(req: ReviseRequest): Promise<ReviseResponse> {
  return (await call("report-revise", {
    method: "POST",
    body: req,
  })) as ReviseResponse;
}
