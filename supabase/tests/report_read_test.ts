import {
  getHandler,
  reviseHandler,
} from "../functions/_shared/report/handlers.ts";
import { decryptToken } from "../functions/_shared/report/crypto.ts";
import input from "../../src/lib/report-issue/__fixtures__/engine-input-261313.json" with { type: "json" };
import {
  browser,
  equal,
  issueFounding,
  PROFILE,
  TOKEN_KEY,
  world,
  type World,
} from "./report_fake.ts";

const DAY = 24 * 60 * 60 * 1000;
const UNKNOWN = "Z".repeat(43);

async function get(w: World, token: unknown, ip = "203.0.113.7") {
  const res = await getHandler(w.deps)(
    browser(
      "report-get",
      { token },
      { headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } },
    ),
  );
  return { status: res.status, body: await res.json() };
}

async function revise(w: World, token: string, profile: unknown) {
  const res = await reviseHandler(w.deps)(
    browser("report-revise", { token, profile }),
  );
  return { status: res.status, body: await res.json() };
}

type Meta = { reportNo: string; version: number; revisionsLeft: number };
const meta = (w: World) => w.db.reports[0].payload.meta as Meta;

Deno.test("get returns the payload", async () => {
  const w = world();
  const token = await issueFounding(w);
  const { status, body } = await get(w, token);
  equal(status, 200);
  equal(body.kind, "report");
  equal(body.payload, w.db.reports[0].payload);
  equal(body.profile, PROFILE);
  equal(body.payload.meta.reportNo, w.db.reports[0].report_no);
});

Deno.test("get: revoked and expired states", async () => {
  const w = world();
  const token = await issueFounding(w);
  w.db.reports[0].status = "revoked";
  equal((await get(w, token)).body, { kind: "revoked" });
  w.db.reports[0].status = "issued";
  w.clock.now += 366 * DAY;
  equal((await get(w, token)).body, { kind: "expired" });
});

Deno.test("get: unknown token is not-found, same timing path", async () => {
  const w = world();
  const token = await issueFounding(w);
  const start = w.rpcCalls.length;
  await get(w, token);
  const known = w.rpcCalls.slice(start).map((c) => c.name);
  const middle = w.rpcCalls.length;
  const { status, body } = await get(w, UNKNOWN);
  equal(status, 200);
  equal(body, { kind: "not-found" });
  equal(
    w.rpcCalls.slice(middle).map((c) => c.name),
    known,
  );
  equal(known, ["report_rate", "report_by_token"]);
  equal(JSON.stringify(w.rpcCalls).includes(token), false);
  equal((await get(w, "short")).status, 400);
  const noBody = await getHandler(w.deps)(browser("report-get"));
  equal(noBody.status, 405);
});

Deno.test(
  "get: more than 30 a minute from one address is limited",
  async () => {
    const w = world();
    for (let i = 0; i < 30; i++) equal((await get(w, UNKNOWN)).status, 200);
    const limited = await get(w, UNKNOWN);
    equal(limited.status, 429);
    equal(limited.body, { kind: "error", code: "limited" });
    equal((await get(w, UNKNOWN, "198.51.100.2")).status, 200);
    w.clock.now += 60_000;
    equal((await get(w, UNKNOWN)).status, 200);
    const keys = w.rpcCalls.filter((c) => c.name === "report_rate");
    equal(String(keys[0].args.p_key).includes("203.0.113.7"), true);
    equal(keys[0].args.p_limit, 30);
  },
);

Deno.test(
  "revise within 7 days bumps the version and keeps the report number",
  async () => {
    const w = world();
    const token = await issueFounding(w);
    const number = w.db.reports[0].report_no;
    w.db.reports[0].token_enc = null; // delivery already cleared it
    w.db.reports[0].pdf_status = "done";
    w.clock.now += 6 * DAY;
    const { status, body } = await revise(w, token, {
      ...PROFILE,
      name: "Rahul K",
    });
    equal(status, 200);
    equal(body, { kind: "revised", version: 2 });
    const report = w.db.reports[0];
    equal(report.report_no, number);
    equal(meta(w).reportNo, number);
    equal(meta(w).version, 2);
    equal(report.profile.name, "Rahul K");
    equal(report.pdf_status, "pending");
    equal(await decryptToken(report.token_enc!, TOKEN_KEY), token);
    equal((await get(w, token)).body.payload.meta.version, 2);
  },
);

Deno.test("revise after 7 days: closed", async () => {
  const w = world();
  const token = await issueFounding(w);
  w.clock.now += 7 * DAY;
  equal((await revise(w, token, PROFILE)).body, {
    kind: "error",
    code: "closed",
  });
  equal(w.db.reports[0].version, 1);
});

Deno.test("fourth revise: limit", async () => {
  const w = world();
  const token = await issueFounding(w);
  for (const version of [2, 3, 4])
    equal((await revise(w, token, PROFILE)).body, { kind: "revised", version });
  equal((await revise(w, token, PROFILE)).body, {
    kind: "error",
    code: "limit",
  });
  equal(meta(w).revisionsLeft, 0);
});

Deno.test(
  "revise with a different occupation: occupation-changed",
  async () => {
    const w = world();
    const token = await issueFounding(w);
    const { status, body } = await revise(w, token, {
      ...PROFILE,
      occupation: "254499",
    });
    equal(status, 200);
    equal(body, { kind: "error", code: "occupation-changed" });
    equal(w.db.reports[0].version, 1);
    equal(w.urls.filter((u) => u.includes("254499")).length, 0);
  },
);

Deno.test("revise: an unknown token or a bad profile is invalid", async () => {
  const w = world();
  const token = await issueFounding(w);
  equal((await revise(w, UNKNOWN, PROFILE)).body, {
    kind: "error",
    code: "invalid",
  });
  equal((await revise(w, token, { occupation: "261313" })).status, 400);
  w.state.siteDown = true;
  equal((await revise(w, token, PROFILE)).body, {
    kind: "error",
    code: "busy",
  });
  equal(w.db.reports[0].version, 1);
});

Deno.test(
  "revise uses the stored engine data even after the live month moves",
  async () => {
    const w = world();
    const token = await issueFounding(w);
    const before = w.db.reports[0].payload as {
      view: { dataMonth: string };
      source: unknown;
    };
    w.site.set("/data/manifest.json", {
      ...input.data.manifest,
      asAt: "2026-11",
      checkedAt: "2026-12-02",
    });
    w.site.set("/data/occupations/261313.json", {
      ...input.data.core,
      asAt: "2026-11",
    });
    w.clock.now += DAY;
    const fetched = w.urls.length;
    equal((await revise(w, token, PROFILE)).body, {
      kind: "revised",
      version: 2,
    });
    equal(
      w.urls.slice(fetched).some((url) => url.includes("/occupations/")),
      false,
    );
    const after = w.db.reports[0].payload as typeof before;
    equal(after.view.dataMonth, "October 2026");
    equal(after.view.dataMonth, before.view.dataMonth);
    equal(after.source, before.source);
    equal(w.db.reports[0].data_as_at, "2026-10");
  },
);
