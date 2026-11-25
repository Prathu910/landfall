// Reads the cited pages for the page watcher. The founder's rules for
// automated jobs (25 Nov 2026, docs/STRATEGY.md): at most one request per
// page per day (so no retries), a gap of at least HOST_GAP_MS per site, never
// retry a refusal, and skip any URL that robots.txt disallows. A host that
// answers 429, doesn't answer, refuses or fails its robots.txt, or answers 403
// to a second page is not asked again that run, and a run stops requesting at
// its deadline so it always saves state and summary.
import { isLoginPage, normaliseResponse } from "./normalise";
import {
  isAllowed,
  parseRobots,
  productToken,
  type RobotsRule,
} from "./robots";
import { hostOf, type WatchResult } from "./watch";

export const GAP_MS = 1_000;
export const HOST_GAP_MS = 10_000;
export const TIMEOUT_MS = 30_000;
const ACCEPT =
  "text/html,application/xhtml+xml,text/csv,application/pdf;q=0.9,*/*;q=0.8";
/** A page answer that stops its host at once; a 403 does on the second page. */
const STOPS_HOST = new Set([429]);
const FORBIDDEN = 403;
const FORBIDDEN_LIMIT = 2;

export type ReadDeps = {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  log: (line: string) => void;
  userAgent: string;
  /** Epoch ms after which no request starts. */
  deadline: number;
};

type Reply =
  | { kind: "response"; status: number; type: string; body: Buffer }
  | { kind: "timeout" }
  | { kind: "error"; reason: string };

async function request(url: string, deps: ReadDeps): Promise<Reply> {
  try {
    const response = await deps.fetch(url, {
      headers: { "User-Agent": deps.userAgent, Accept: ACCEPT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = Buffer.from(await response.arrayBuffer());
    return {
      kind: "response",
      status: response.status,
      type: response.headers.get("content-type") ?? "",
      body,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError")
      return { kind: "timeout" };
    const cause = (error as { cause?: { code?: string } }).cause?.code;
    return {
      kind: "error",
      reason: `network error${cause ? ` (${cause})` : ""}`,
    };
  }
}

const NO_ANSWER = `no answer within ${TIMEOUT_MS / 1000} s`;

export type PageRead = {
  result: WatchResult;
  /** The site asked us to stop (429) or didn't answer. */
  stopsHost: boolean;
  /** The page answered 403, which stops its host the second time in a run. */
  forbidden: boolean;
};

/** One request, never retried. */
export async function readPage(url: string, deps: ReadDeps): Promise<PageRead> {
  const read = (result: WatchResult, stopsHost = false, forbidden = false) => ({
    result,
    stopsHost,
    forbidden,
  });
  const reply = await request(url, deps);
  if (reply.kind === "timeout")
    return read({ ok: false, kind: "timeout", reason: NO_ANSWER }, true);
  if (reply.kind === "error")
    return read({ ok: false, kind: "error", reason: reply.reason });
  const { status, type, body } = reply;
  if (status >= 400)
    return read(
      {
        ok: false,
        kind: status < 500 ? "refused" : "error",
        reason: `HTTP ${status}`,
      },
      STOPS_HOST.has(status),
      status === FORBIDDEN,
    );
  if (/html/i.test(type) && isLoginPage(body.toString("utf8")))
    return read({ ok: false, kind: "refused", reason: "a sign-in page" });
  return read({ ok: true, page: normaliseResponse(body, type, url) });
}

export type RobotsRead = {
  rules: RobotsRule[];
  note: string | null;
  stop: WatchResult | null;
};

/**
 * RFC 9309: a robots.txt the site doesn't have (404 or any other 4xx) allows
 * everything; 401 and 403 refuse the site, as does 429; a 5xx, a network
 * error or no answer leaves it unreachable, so its pages are not requested.
 */
export async function readRobots(
  host: string,
  deps: ReadDeps,
): Promise<RobotsRead> {
  const stopped = (stop: WatchResult, what: string): RobotsRead => ({
    rules: [],
    note: `${host}: robots.txt ${what}; the site's pages were not requested.`,
    stop,
  });
  const reply = await request(`https://${host}/robots.txt`, deps);
  if (reply.kind === "timeout")
    return stopped(
      { ok: false, kind: "timeout", reason: NO_ANSWER },
      `got ${NO_ANSWER}`,
    );
  if (reply.kind === "error")
    return stopped(
      { ok: false, kind: "error", reason: reply.reason },
      `could not be read (${reply.reason})`,
    );
  const { status } = reply;
  const reason = `HTTP ${status}`;
  if (status === 401 || status === 403 || status === 429)
    return stopped(
      { ok: false, kind: "refused", reason },
      `answered ${reason}`,
    );
  if (status >= 500)
    return stopped({ ok: false, kind: "error", reason }, `answered ${reason}`);
  if (status >= 400) return { rules: [], note: null, stop: null };
  return {
    rules: parseRobots(
      reply.body.toString("utf8"),
      productToken(deps.userAgent),
    ),
    note: null,
    stop: null,
  };
}

/** The items with their hosts taken in turn, so one site is never read twice in a row when another is waiting. */
export function politeOrder<T>(items: T[], host: (item: T) => string): T[] {
  const byHost = new Map<string, T[]>();
  for (const item of items)
    byHost.set(host(item), [...(byHost.get(host(item)) ?? []), item]);
  const queues = [...byHost.values()];
  const ordered: T[] = [];
  for (let round = 0; ordered.length < items.length; round++)
    for (const queue of queues)
      if (round < queue.length) ordered.push(queue[round]);
  return ordered;
}

/** A host's robots.txt (`url: null`) comes before its pages. */
type Step = { host: string; url: string | null };

function stepsFor(urls: string[]): Step[] {
  const hosts = [...new Set(urls.map(hostOf))];
  return hosts.flatMap((host) => [
    { host, url: null },
    ...urls.filter((url) => hostOf(url) === host).map((url) => ({ host, url })),
  ]);
}

export type ReadAll = { results: Record<string, WatchResult>; notes: string[] };

/**
 * Reads `urls` (each at most once); `alreadyRead` were read today and are not
 * requested again. A page not requested because its host stopped is
 * "skipped" when it has a baseline (`baselined`), so the stop doesn't count
 * as a failed day; a page never read takes the host's failure.
 */
export async function readAll(
  urls: string[],
  alreadyRead: Set<string>,
  deps: ReadDeps,
  baselined: Set<string> = new Set(),
): Promise<ReadAll> {
  const results: Record<string, WatchResult> = {};
  const notes: string[] = [];
  for (const url of urls.filter((url) => alreadyRead.has(url)))
    results[url] = { ok: false, kind: "skipped", reason: "already read today" };
  const robots = new Map<string, RobotsRule[]>();
  const stopped = new Map<string, WatchResult>();
  const forbidden = new Map<string, number>();
  const lastRequest = new Map<string, number>();
  let previous = -Infinity;
  let outOfTime = false;
  for (const step of politeOrder(
    stepsFor(urls.filter((url) => !alreadyRead.has(url))),
    (s) => s.host,
  )) {
    const { host, url } = step;
    const stop = stopped.get(host);
    if (stop) {
      if (url === null) continue;
      results[url] =
        !stop.ok && baselined.has(url)
          ? {
              ok: false,
              kind: "skipped",
              reason: `not requested: ${host} stopped earlier this run (${stop.reason})`,
            }
          : stop;
      deps.log(`not requested (${host} stopped earlier): ${url}`);
      continue;
    }
    if (url && !isAllowed(robots.get(host) ?? [], url)) {
      results[url] = {
        ok: false,
        kind: "disallowed",
        reason: "not fetched: disallowed by robots.txt",
      };
      continue;
    }
    const due = Math.max(
      previous + GAP_MS,
      (lastRequest.get(host) ?? -Infinity) + HOST_GAP_MS,
    );
    if (Math.max(due, deps.now()) >= deps.deadline) {
      if (url)
        results[url] = {
          ok: false,
          kind: "skipped",
          reason: "not fetched: the run's time budget ran out",
        };
      outOfTime = true;
      continue;
    }
    await deps.sleep(Math.max(0, due - deps.now()));
    if (url === null) {
      const read = await readRobots(host, deps);
      robots.set(host, read.rules);
      if (read.note) notes.push(read.note);
      if (read.stop) stopped.set(host, read.stop);
    } else {
      const read = await readPage(url, deps);
      const { result } = read;
      results[url] = result;
      const refusals = (forbidden.get(host) ?? 0) + (read.forbidden ? 1 : 0);
      forbidden.set(host, refusals);
      if (read.stopsHost || refusals >= FORBIDDEN_LIMIT)
        stopped.set(host, result);
      deps.log(`${result.ok ? "read" : `failed (${result.reason})`}: ${url}`);
    }
    previous = deps.now();
    lastRequest.set(host, previous);
  }
  if (outOfTime)
    notes.push(
      "The run's time budget ran out: the pages not requested keep their saved state.",
    );
  return { results, notes };
}
