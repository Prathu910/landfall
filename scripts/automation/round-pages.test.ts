import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  CURRENT_ROUNDS_URL,
  PREVIOUS_ROUNDS_URL,
  ROUND_PAGE_GAP_MS,
} from "../import/rounds";
import type { ReadDeps } from "../page-watch/fetch-pages";
import { USER_AGENT } from "../state-lists/shared";
import { savedRoundPage } from "./round-pages";

const ROBOTS = "https://immi.homeaffairs.gov.au/robots.txt";
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true });
});
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), "round-pages-"));
  dirs.push(dir);
  return dir;
};

/** A fake site and clock: each request takes 300 ms. */
function fake(robots: () => Response) {
  let clock = 1_000_000;
  const requests: { url: string; at: number; agent: string | null }[] = [];
  const deps: ReadDeps = {
    fetch: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push({
        url,
        at: clock,
        agent: new Headers(init?.headers).get("User-Agent"),
      });
      clock += 300;
      return url === ROBOTS ? robots() : new Response(`<html>${url}</html>`);
    }) as typeof fetch,
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
    log: () => {},
    userAgent: USER_AGENT,
    deadline: Infinity,
  };
  return { deps, requests };
}

const allowAll = () => new Response("User-agent: *\nDisallow:\n");

describe("savedRoundPage", () => {
  it("reads robots.txt once, then each page once, 10 s apart, and saves them", async () => {
    const dir = tempDir();
    const { deps, requests } = fake(allowAll);
    const current = await savedRoundPage(dir, "current", deps);
    // A second detection and the previous page, in later processes.
    expect(await savedRoundPage(dir, "current", deps)).toBe(current);
    await savedRoundPage(dir, "previous", deps);
    expect(requests.map((r) => r.url)).toEqual([
      ROBOTS,
      CURRENT_ROUNDS_URL,
      PREVIOUS_ROUNDS_URL,
    ]);
    for (let i = 1; i < requests.length; i++)
      expect(requests[i].at - requests[i - 1].at).toBeGreaterThanOrEqual(
        ROUND_PAGE_GAP_MS,
      );
    expect(requests.every((r) => r.agent === USER_AGENT)).toBe(true);
    expect(readFileSync(join(dir, "invitation-rounds.html"), "utf8")).toBe(
      current,
    );
    expect(readFileSync(join(dir, "previous-rounds.html"), "utf8")).toContain(
      "previous-rounds",
    );
  });

  it("requests nothing for a page the folder has (a dry run's saved pages)", async () => {
    const dir = tempDir();
    writeFileSync(join(dir, "invitation-rounds.html"), "<html>saved</html>");
    const { deps, requests } = fake(allowAll);
    expect(await savedRoundPage(dir, "current", deps)).toBe(
      "<html>saved</html>",
    );
    expect(requests).toEqual([]);
  });

  it("doesn't request a page robots.txt disallows", async () => {
    const dir = tempDir();
    const { deps, requests } = fake(
      () =>
        new Response(
          "User-agent: *\nDisallow: /visas/working-in-australia/skillselect/previous-rounds\n",
        ),
    );
    await savedRoundPage(dir, "current", deps);
    await expect(savedRoundPage(dir, "previous", deps)).rejects.toThrow(
      /robots\.txt disallows .*previous-rounds/,
    );
    expect(requests.map((r) => r.url)).toEqual([ROBOTS, CURRENT_ROUNDS_URL]);
  });

  it("stops when robots.txt refuses or fails, requesting no page", async () => {
    for (const code of [403, 503]) {
      const dir = tempDir();
      const { deps, requests } = fake(
        () => new Response("no", { status: code }),
      );
      await expect(savedRoundPage(dir, "current", deps)).rejects.toThrow(
        `robots.txt answered HTTP ${code}`,
      );
      expect(requests.map((r) => r.url)).toEqual([ROBOTS]);
    }
  });

  it("never retries a refused page", async () => {
    const dir = tempDir();
    const { deps, requests } = fake(allowAll);
    deps.fetch = (async (input: string | URL | Request) => {
      requests.push({ url: String(input), at: 0, agent: null });
      return String(input) === ROBOTS
        ? allowAll()
        : new Response("no", { status: 403 });
    }) as typeof fetch;
    await expect(savedRoundPage(dir, "current", deps)).rejects.toThrow(
      /HTTP 403/,
    );
    expect(requests.map((r) => r.url)).toEqual([ROBOTS, CURRENT_ROUNDS_URL]);
  });
});
