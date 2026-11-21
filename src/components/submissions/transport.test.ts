import { afterEach, expect, it, vi } from "vitest";
import { sendSubmission } from "./transport";
const submission = { id: "89f41b59-e655-4dda-9f51-6ce1ef99ca2d" };
const config = {
  url: "https://project.supabase.co",
  siteKey: "public-site-key",
  privacyEmail: "privacy@example.com",
};
afterEach(() => vi.unstubAllGlobals());
it("requires a server receipt for this exact submission", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "other" }), { status: 201 }),
      ),
  );
  await expect(
    sendSubmission("calculation", submission, "token", config),
  ).rejects.toThrow("could not confirm");
});
it("sends only the selected payload and token, without cookies", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(submission), { status: 201 }),
    );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    sendSubmission("calculation", submission, "token", config),
  ).resolves.toEqual({ id: submission.id, readToken: null });
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe(
    "https://project.supabase.co/functions/v1/submit-calculation",
  );
  expect(init.credentials).toBe("omit");
  expect(JSON.parse(init.body)).toEqual({
    submission,
    turnstile_token: "token",
  });
});
it("accepts an idempotent receipt and maps storage failures without exposing server details", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(submission), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response("database password detail", { status: 503 }),
      ),
  );
  await expect(
    sendSubmission("feedback", submission, "token", config),
  ).resolves.toEqual({ id: submission.id, readToken: null });
  await expect(
    sendSubmission("feedback", submission, "token", config),
  ).rejects.toThrow("temporarily unavailable");
});
it("does not send unconfigured submissions or missing spam tokens", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(
    sendSubmission("feedback", submission, "", config),
  ).rejects.toThrow("verification");
  expect(fetcher).not.toHaveBeenCalled();
});
it("handles network failures as retryable errors", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
  await expect(
    sendSubmission("feedback", submission, "token", config),
  ).rejects.toThrow("connection");
});

it("aborts a stalled save and leaves it retryable", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    ),
  );
  try {
    const result = sendSubmission("feedback", submission, "token", config);
    const assertion = expect(result).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(20000);
    await assertion;
  } finally {
    vi.useRealTimers();
  }
});
it("returns the read token from a created receipt and tolerates its absence", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...submission, read_token: "abc.123" }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...submission, read_token: 42 }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(submission), { status: 201 }),
      ),
  );
  const send = () => sendSubmission("calculation", submission, "token", config);
  await expect(send()).resolves.toEqual({
    id: submission.id,
    readToken: "abc.123",
  });
  await expect(send()).resolves.toEqual({ id: submission.id, readToken: null });
  await expect(send()).resolves.toEqual({ id: submission.id, readToken: null });
});
