import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getQuote, postGet, postOrder } from "./transport";

const QUOTE = {
  prices: { INR: 69900, USD: null },
  founding: { enabled: true, remaining: 63, limit: 100 },
};

function reply(body: unknown, status = 200) {
  return vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "public-site-key");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("reads the quote with a GET and checks every field", async () => {
  const fetcher = reply(QUOTE);
  vi.stubGlobal("fetch", fetcher);
  await expect(getQuote()).resolves.toEqual(QUOTE);
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe("https://project.supabase.co/functions/v1/report-quote");
  expect(init).toMatchObject({ method: "GET", credentials: "omit" });
  vi.stubGlobal("fetch", reply({ prices: { INR: "699" }, founding: {} }));
  await expect(getQuote()).rejects.toThrow("Something went wrong");
});

it("returns a business outcome at any status", async () => {
  vi.stubGlobal("fetch", reply({ kind: "error", code: "busy" }, 503));
  await expect(
    postOrder({
      profile: {},
      email: "a@b.co",
      currency: "INR",
      consent: true,
      asOf: "2026-11-26",
      turnstile_token: "t",
    }),
  ).resolves.toEqual({ kind: "error", code: "busy" });
});

it("sends the token only in the body", async () => {
  const fetcher = reply({ kind: "not-found" });
  vi.stubGlobal("fetch", fetcher);
  await postGet("x".repeat(43));
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe("https://project.supabase.co/functions/v1/report-get");
  expect(JSON.parse(init.body)).toEqual({ token: "x".repeat(43) });
});

it("words a lost connection", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await expect(getQuote()).rejects.toThrow("Check your connection");
});

it("makes no request without the public configuration", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  const fetcher = reply(QUOTE);
  vi.stubGlobal("fetch", fetcher);
  await expect(getQuote()).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
