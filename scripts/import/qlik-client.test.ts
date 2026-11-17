import { describe, expect, it } from "vitest";
import {
  asAtSerial,
  BudgetExceededError,
  GuardrailError,
  openQlikSession,
  type Transport,
} from "./qlik-client";

type Request = {
  id: number;
  handle: number;
  method: string;
  params: unknown[];
};

type Script = {
  qcx: number;
  qcy: number;
  qError?: { qErrorCode: number };
  header?: string[];
};

function fakeTransport(script: Script) {
  const requests: Request[] = [];
  let handler: (message: string) => void = () => {};
  const header = script.header ?? ["a", "b", "c"].slice(0, script.qcx);
  const reply = (id: number, result: unknown) =>
    queueMicrotask(() =>
      handler(JSON.stringify({ jsonrpc: "2.0", id, result })),
    );
  const transport: Transport = {
    onMessage: (h) => {
      handler = h;
    },
    close: () => {},
    send: (message) => {
      const req = JSON.parse(message) as Request;
      requests.push(req);
      // Unsolicited push that must be ignored.
      queueMicrotask(() => handler(JSON.stringify({ method: "OnConnected" })));
      switch (req.method) {
        case "GetLayout":
          return reply(req.id, {
            qLayout: {
              qHyperCube: {
                qSize: { qcx: script.qcx, qcy: script.qcy },
                ...(script.qError ? { qError: script.qError } : {}),
                qDimensionInfo: [
                  { qFallbackTitle: header[0] },
                  {},
                  ...header
                    .slice(1, -1)
                    .map((qFallbackTitle) => ({ qFallbackTitle })),
                ],
                qMeasureInfo: [{ qFallbackTitle: header[header.length - 1] }],
              },
            },
          });
        case "GetHyperCubeData": {
          const page = (
            req.params[1] as { qTop: number; qHeight: number }[]
          )[0];
          const count = Math.max(
            0,
            Math.min(page.qHeight, script.qcy - page.qTop),
          );
          return reply(req.id, {
            qDataPages: [
              {
                qMatrix: Array.from({ length: count }, (_, i) =>
                  Array.from({ length: script.qcx }, () => ({
                    qText: String(page.qTop + i),
                  })),
                ),
              },
            ],
          });
        }
        default:
          return reply(req.id, { qReturn: { qHandle: 7 } });
      }
    },
  };
  return { transport, requests };
}

const open = (script: Script, maxPageReads = 10) => {
  const fake = fakeTransport(script);
  return openQlikSession({
    throttleMs: 0,
    maxPageReads,
    transport: fake.transport,
  }).then((session) => ({ session, ...fake }));
};

describe("qlik client", () => {
  it("pages a wide table by floor(10000 / width)", async () => {
    const { session, requests } = await open({ qcx: 3, qcy: 7000 });
    const table = await session.readTable("eymDb");
    expect(table.header).toEqual(["a", "b", "c"]);
    expect(table.rows).toHaveLength(7000);
    expect(session.pageReads()).toBe(3);
    const heights = requests
      .filter((r) => r.method === "GetHyperCubeData")
      .map((r) => (r.params[1] as { qHeight: number }[])[0].qHeight);
    expect(heights).toEqual([3333, 3333, 3333]);
  });

  it("rejects a guardrail refusal", async () => {
    const { session } = await open({
      qcx: 3,
      qcy: 0,
      qError: { qErrorCode: 7005 },
    });
    await expect(session.readTable("eymDb")).rejects.toBeInstanceOf(
      GuardrailError,
    );
  });

  it("throws when the header does not match the table width", async () => {
    const { session } = await open({ qcx: 3, qcy: 1, header: ["a", "b"] });
    await expect(session.readTable("eymDb")).rejects.toThrow(/shape/i);
  });

  it("rejects toggles that are not vShow variables", async () => {
    const { session } = await open({ qcx: 3, qcy: 1 });
    await expect(
      session.setToggle("vSelectionsLimit" as never, true),
    ).rejects.toThrow(/vShow/);
    await expect(
      session.setToggle("vShowPoints", true),
    ).resolves.toBeUndefined();
  });

  it("enforces the page-read budget", async () => {
    const { session } = await open({ qcx: 3, qcy: 7000 }, 2);
    await expect(session.readTable("eymDb")).rejects.toBeInstanceOf(
      BudgetExceededError,
    );
  });

  it("computes the month-end Excel serial", () => {
    const days = (Date.UTC(2026, 9, 31) - Date.UTC(1899, 11, 30)) / 86_400_000;
    expect(asAtSerial("2026-10")).toBe(days);
  });
});
