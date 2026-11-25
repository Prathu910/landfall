import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { USER_AGENT } from "../state-lists/shared";
import {
  GAP_MS,
  HOST_GAP_MS,
  TIMEOUT_MS,
  readAll,
  readPage,
  readRobots,
  type ReadDeps,
} from "./fetch-pages";

const robotsFixture = readFileSync(
  join(__dirname, "__fixtures__", "robots.txt"),
  "utf8",
);
const html = (body: string) =>
  `<html><head><title>T</title></head><body><main><p>${body}</p></main></body></html>`;

type Reply = Response | "timeout" | Error;

/** A fake network and clock: each request takes 200 ms (a timeout, TIMEOUT_MS). */
function fake(reply: (url: string) => Reply, deadline = Infinity) {
  let clock = 0;
  const requests: { url: string; at: number; userAgent: string | null }[] = [];
  const deps: ReadDeps = {
    fetch: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push({
        url,
        at: clock,
        userAgent: new Headers(init?.headers).get("User-Agent"),
      });
      const answer = reply(url);
      if (answer === "timeout") {
        clock += TIMEOUT_MS;
        throw new DOMException("The operation timed out.", "TimeoutError");
      }
      clock += 200;
      if (answer instanceof Error) throw answer;
      return answer;
    }) as typeof fetch,
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
    log: () => {},
    userAgent: USER_AGENT,
    deadline,
  };
  return {
    deps,
    requests,
    pages: () =>
      requests.filter((r) => !r.url.endsWith("/robots.txt")).map((r) => r.url),
  };
}

const page = (body = "Rules") =>
  new Response(html(body), {
    status: 200,
    headers: { "content-type": "text/html" },
  });
const status = (code: number) =>
  new Response("no", {
    status: code,
    headers: { "content-type": "text/html" },
  });
const robots = (text: string) =>
  new Response(text, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
const noRobots = () => status(404);

describe("readPage", () => {
  it("reads a page with the browser User-Agent", async () => {
    const { deps, requests } = fake(() => page("Points: 65"));
    const { result, stopsHost } = await readPage("https://a.gov.au/p", deps);
    expect(result).toMatchObject({ ok: true, page: { text: "Points: 65" } });
    expect(stopsHost).toBe(false);
    expect(requests[0].userAgent).toBe(USER_AGENT);
  });

  it("never retries: a refusal or a server error costs one request", async () => {
    for (const [code, kind, stops] of [
      [403, "refused", false],
      [429, "refused", true],
      [404, "refused", false],
      [503, "error", false],
    ] as const) {
      const { deps, requests } = fake(() => status(code));
      expect(await readPage("https://a.gov.au/p", deps)).toEqual({
        result: { ok: false, kind, reason: `HTTP ${code}` },
        stopsHost: stops,
        forbidden: code === 403,
      });
      expect(requests).toHaveLength(1);
    }
  });

  it("counts a sign-in page as a refusal", async () => {
    const { deps } = fake(() => page('<form><input type="password"></form>'));
    expect((await readPage("https://a.gov.au/p", deps)).result).toEqual({
      ok: false,
      kind: "refused",
      reason: "a sign-in page",
    });
  });

  it("handles a timeout and a network error", async () => {
    const slow = fake(() => "timeout");
    expect(await readPage("https://a.gov.au/p", slow.deps)).toEqual({
      result: { ok: false, kind: "timeout", reason: "no answer within 30 s" },
      stopsHost: true,
      forbidden: false,
    });
    expect(slow.requests).toHaveLength(1);
    const broken = fake(() =>
      Object.assign(new TypeError("fetch failed"), {
        cause: { code: "ENOTFOUND" },
      }),
    );
    expect((await readPage("https://a.gov.au/p", broken.deps)).result).toEqual({
      ok: false,
      kind: "error",
      reason: "network error (ENOTFOUND)",
    });
  });
});

describe("readRobots", () => {
  it("parses the rules for our product token and *", async () => {
    const { deps, requests } = fake(() => robots(robotsFixture));
    const read = await readRobots("www.example.gov.au", deps);
    expect(requests[0].url).toBe("https://www.example.gov.au/robots.txt");
    expect(read.rules).toContainEqual({ allow: false, pattern: "/private/" });
    expect(read).toMatchObject({ note: null, stop: null });
  });

  it("allows everything when robots.txt is missing: a 404 or another 4xx (RFC 9309)", async () => {
    for (const code of [404, 410, 400])
      expect(
        await readRobots("a.gov.au", fake(() => status(code)).deps),
      ).toEqual({ rules: [], note: null, stop: null });
  });

  it("stops the host on a 401 or 403 robots.txt: refused", async () => {
    for (const code of [401, 403])
      expect(
        await readRobots("a.gov.au", fake(() => status(code)).deps),
      ).toEqual({
        rules: [],
        note: `a.gov.au: robots.txt answered HTTP ${code}; the site's pages were not requested.`,
        stop: { ok: false, kind: "refused", reason: `HTTP ${code}` },
      });
  });

  it("stops the host on a 5xx or a network error: unreachable (RFC 9309)", async () => {
    expect(await readRobots("a.gov.au", fake(() => status(503)).deps)).toEqual({
      rules: [],
      note: "a.gov.au: robots.txt answered HTTP 503; the site's pages were not requested.",
      stop: { ok: false, kind: "error", reason: "HTTP 503" },
    });
    const broken = fake(() =>
      Object.assign(new TypeError("fetch failed"), {
        cause: { code: "ECONNRESET" },
      }),
    );
    expect(await readRobots("a.gov.au", broken.deps)).toEqual({
      rules: [],
      note: "a.gov.au: robots.txt could not be read (network error (ECONNRESET)); the site's pages were not requested.",
      stop: { ok: false, kind: "error", reason: "network error (ECONNRESET)" },
    });
  });
});

describe("readAll", () => {
  it("skips a page robots.txt disallows without requesting it, fetching robots.txt once per host", async () => {
    const { deps, requests, pages } = fake((url) =>
      url.endsWith("/robots.txt") ? robots(robotsFixture) : page(),
    );
    const { results } = await readAll(
      [
        "https://www.example.gov.au/private/fees",
        "https://www.example.gov.au/visas",
        "https://www.example.gov.au/core/x",
      ],
      new Set(),
      deps,
    );
    expect(pages()).toEqual(["https://www.example.gov.au/visas"]);
    expect(requests.filter((r) => r.url.endsWith("/robots.txt"))).toHaveLength(
      1,
    );
    expect(results["https://www.example.gov.au/private/fees"]).toEqual({
      ok: false,
      kind: "disallowed",
      reason: "not fetched: disallowed by robots.txt",
    });
    expect(results["https://www.example.gov.au/visas"].ok).toBe(true);
  });

  it("keeps asking a host after one page's 403", async () => {
    const { deps, pages } = fake((url) =>
      url.endsWith("/robots.txt")
        ? noRobots()
        : url.endsWith("/1")
          ? status(403)
          : page(),
    );
    const urls = ["https://act.gov.au/1", "https://act.gov.au/2"];
    const { results } = await readAll(urls, new Set(), deps);
    expect(pages()).toEqual(urls);
    expect(results["https://act.gov.au/1"]).toEqual({
      ok: false,
      kind: "refused",
      reason: "HTTP 403",
    });
    expect(results["https://act.gov.au/2"].ok).toBe(true);
  });

  it("asks a host nothing more after a second 403, giving its other pages the same reason", async () => {
    const { deps, pages } = fake((url) =>
      url.endsWith("/robots.txt")
        ? noRobots()
        : url.includes("act")
          ? status(403)
          : page(),
    );
    const urls = [
      "https://act.gov.au/1",
      "https://act.gov.au/2",
      "https://act.gov.au/3",
      "https://nsw.gov.au/1",
    ];
    const { results } = await readAll(urls, new Set(), deps);
    expect(pages()).toEqual([
      "https://act.gov.au/1",
      "https://nsw.gov.au/1",
      "https://act.gov.au/2",
    ]);
    for (const url of urls.slice(0, 3))
      expect(results[url]).toEqual({
        ok: false,
        kind: "refused",
        reason: "HTTP 403",
      });
    expect(results["https://nsw.gov.au/1"].ok).toBe(true);
  });

  it("skips, not fails, a page with a baseline when its host stopped", async () => {
    const { deps, pages } = fake((url) =>
      url.endsWith("/robots.txt") ? noRobots() : status(429),
    );
    const urls = [
      "https://qld.gov.au/1",
      "https://qld.gov.au/2",
      "https://qld.gov.au/3",
    ];
    const { results } = await readAll(
      urls,
      new Set(),
      deps,
      new Set(["https://qld.gov.au/2"]),
    );
    expect(pages()).toEqual(["https://qld.gov.au/1"]);
    // The page that was asked keeps its own failure; a page never read keeps the host's.
    expect(results["https://qld.gov.au/1"]).toMatchObject({ kind: "refused" });
    expect(results["https://qld.gov.au/2"]).toEqual({
      ok: false,
      kind: "skipped",
      reason: "not requested: qld.gov.au stopped earlier this run (HTTP 429)",
    });
    expect(results["https://qld.gov.au/3"]).toEqual({
      ok: false,
      kind: "refused",
      reason: "HTTP 429",
    });
  });

  it("skips a baselined page when robots.txt stops its host", async () => {
    const { deps, pages } = fake((url) =>
      url.endsWith("/robots.txt") ? status(503) : page(),
    );
    const { results, notes } = await readAll(
      ["https://sa.gov.au/1", "https://sa.gov.au/2"],
      new Set(),
      deps,
      new Set(["https://sa.gov.au/1"]),
    );
    expect(pages()).toEqual([]);
    expect(results["https://sa.gov.au/1"]).toMatchObject({ kind: "skipped" });
    expect(results["https://sa.gov.au/2"]).toEqual({
      ok: false,
      kind: "error",
      reason: "HTTP 503",
    });
    expect(notes[0]).toMatch(/sa\.gov\.au: robots\.txt answered HTTP 503/);
  });

  it("asks a host nothing more after a timeout, on robots.txt or a page", async () => {
    const dropping = fake((url) =>
      url.includes("tas")
        ? "timeout"
        : url.endsWith("/robots.txt")
          ? noRobots()
          : page(),
    );
    const { results, notes } = await readAll(
      ["https://tas.gov.au/1", "https://tas.gov.au/2"],
      new Set(),
      dropping.deps,
    );
    expect(dropping.requests.map((r) => r.url)).toEqual([
      "https://tas.gov.au/robots.txt",
    ]);
    expect(results["https://tas.gov.au/2"]).toEqual({
      ok: false,
      kind: "timeout",
      reason: "no answer within 30 s",
    });
    expect(notes[0]).toMatch(/tas\.gov\.au: robots\.txt got no answer/);
    const slowPage = fake((url) =>
      url.endsWith("/robots.txt") ? noRobots() : "timeout",
    );
    await readAll(
      ["https://qld.gov.au/1", "https://qld.gov.au/2"],
      new Set(),
      slowPage.deps,
    );
    expect(slowPage.pages()).toEqual(["https://qld.gov.au/1"]);
  });

  it("stops a host whose robots.txt answers 429", async () => {
    const { deps, pages } = fake((url) =>
      url.endsWith("/robots.txt") ? status(429) : page(),
    );
    const { results } = await readAll(
      ["https://qld.gov.au/1"],
      new Set(),
      deps,
    );
    expect(pages()).toEqual([]);
    expect(results["https://qld.gov.au/1"]).toEqual({
      ok: false,
      kind: "refused",
      reason: "HTTP 429",
    });
  });

  it("keeps 10 s between requests to one host and 1 s between any two", async () => {
    const { deps, requests } = fake((url) =>
      url.endsWith("/robots.txt") ? noRobots() : page(),
    );
    await readAll(
      ["https://a.gov.au/1", "https://a.gov.au/2", "https://b.gov.au/1"],
      new Set(),
      deps,
    );
    for (const [index, request] of requests.entries()) {
      if (index === 0) continue;
      expect(request.at - requests[index - 1].at).toBeGreaterThanOrEqual(
        GAP_MS,
      );
      const sameHost = requests
        .slice(0, index)
        .filter((r) => new URL(r.url).host === new URL(request.url).host);
      if (sameHost.length > 0)
        expect(request.at - sameHost.at(-1)!.at).toBeGreaterThanOrEqual(
          HOST_GAP_MS,
        );
    }
  });

  it("requests nothing after the run's deadline and says so", async () => {
    const { deps, pages } = fake(
      (url) => (url.endsWith("/robots.txt") ? noRobots() : page()),
      15_000,
    );
    const urls = [
      "https://a.gov.au/1",
      "https://a.gov.au/2",
      "https://a.gov.au/3",
    ];
    const { results, notes } = await readAll(urls, new Set(), deps);
    expect(pages()).toEqual(["https://a.gov.au/1"]);
    expect(results["https://a.gov.au/3"]).toEqual({
      ok: false,
      kind: "skipped",
      reason: "not fetched: the run's time budget ran out",
    });
    expect(notes).toContain(
      "The run's time budget ran out: the pages not requested keep their saved state.",
    );
  });

  it("does not request a page already read today, nor its host's robots.txt", async () => {
    const { deps, requests } = fake(() => page());
    const { results } = await readAll(
      ["https://a.gov.au/1"],
      new Set(["https://a.gov.au/1"]),
      deps,
    );
    expect(requests).toEqual([]);
    expect(results["https://a.gov.au/1"]).toEqual({
      ok: false,
      kind: "skipped",
      reason: "already read today",
    });
  });
});
