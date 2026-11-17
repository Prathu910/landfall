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
  /** Rows the fake server leaves out of its last page, as a dropped page would. */
  missingRows?: number;
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
    onClose: () => {},
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
          const isLastPage = page.qTop + page.qHeight >= script.qcy;
          const count = Math.max(
            0,
            Math.min(page.qHeight, script.qcy - page.qTop) -
              (isLastPage ? (script.missingRows ?? 0) : 0),
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

  it("fails when the pages return fewer rows than the reported row count", async () => {
    const { session } = await open({ qcx: 3, qcy: 7000, missingRows: 5 });
    await expect(session.readTable("eymDb")).rejects.toThrow(
      /eymDb returned 6995 rows but reported 7000/,
    );
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

  it("returns the header and no rows for an empty table, without a page read", async () => {
    const { session, requests } = await open({ qcx: 3, qcy: 0 });
    const table = await session.readTable("eymDb");
    expect(table).toEqual({ header: ["a", "b", "c"], rows: [] });
    expect(session.pageReads()).toBe(0);
    expect(requests.some((r) => r.method === "GetHyperCubeData")).toBe(false);
  });

  describe("call economy", () => {
    const methods = (requests: Request[], method: string) =>
      requests.filter((r) => r.method === method);

    it("reuses field handles and skips clearing a field it already cleared", async () => {
      const { session, requests } = await open({ qcx: 3, qcy: 1 });
      await session.clear("Score");
      await session.clear("Score");
      expect(methods(requests, "GetField")).toHaveLength(1);
      expect(methods(requests, "Clear")).toHaveLength(1);
      await session.select("Score", [{ text: "65" }]);
      await session.clear("Score");
      expect(methods(requests, "GetField")).toHaveLength(1);
      expect(methods(requests, "Clear")).toHaveLength(2);
    });

    it("sets a toggle only when its value changes", async () => {
      const { session, requests } = await open({ qcx: 3, qcy: 1 });
      await session.setToggle("vShowPoints", true);
      await session.setToggle("vShowPoints", true);
      expect(methods(requests, "GetVariableByName")).toHaveLength(1);
      expect(methods(requests, "SetStringValue")).toHaveLength(1);
      await session.setToggle("vShowPoints", false);
      expect(methods(requests, "SetStringValue")).toHaveLength(2);
      expect(methods(requests, "SetStringValue")[1].params).toEqual(["N"]);
    });

    it("forgets known selections and toggles after applying a bookmark", async () => {
      const { session, requests } = await open({ qcx: 3, qcy: 1 });
      await session.clear("Score");
      await session.setToggle("vShowPoints", true);
      await session.applyBookmark("b1");
      await session.clear("Score");
      await session.setToggle("vShowPoints", true);
      expect(methods(requests, "Clear")).toHaveLength(2);
      expect(methods(requests, "SetStringValue")).toHaveLength(2);
    });

    it("reuses the table object handle across reads", async () => {
      const { session, requests } = await open({ qcx: 3, qcy: 1 });
      await session.readTable("eymDb");
      await session.readTable("eymDb");
      expect(methods(requests, "GetObject")).toHaveLength(1);
      expect(methods(requests, "GetLayout")).toHaveLength(2);
    });
  });

  it("computes the month-end Excel serial", () => {
    const days = (Date.UTC(2026, 9, 31) - Date.UTC(1899, 11, 30)) / 86_400_000;
    expect(asAtSerial("2026-10")).toBe(days);
  });

  describe("failure handling", () => {
    type Controls = {
      transport: Transport;
      closed: () => boolean;
      fireClose: (reason: Error) => void;
    };
    function stubTransport(
      onSend: (req: Request, reply: (r: unknown) => void) => void,
    ): Controls {
      let message: (m: string) => void = () => {};
      let closeHandler: (reason: Error) => void = () => {};
      let closed = false;
      return {
        closed: () => closed,
        fireClose: (reason) => closeHandler(reason),
        transport: {
          onMessage: (h) => {
            message = h;
          },
          onClose: (h) => {
            closeHandler = h;
          },
          close: () => {
            closed = true;
          },
          send: (raw) => {
            const req = JSON.parse(raw) as Request;
            onSend(req, (result) =>
              queueMicrotask(() =>
                message(JSON.stringify({ jsonrpc: "2.0", id: req.id, result })),
              ),
            );
          },
        },
      };
    }
    const opts = { throttleMs: 0, maxPageReads: 5 };

    it("rejects a call that never gets a reply after callTimeoutMs", async () => {
      const stub = stubTransport(() => {});
      await expect(
        openQlikSession({
          ...opts,
          callTimeoutMs: 20,
          transport: stub.transport,
        }),
      ).rejects.toThrow(/timed out/i);
      expect(stub.closed()).toBe(true);
    });

    it("rejects pending requests when the connection closes", async () => {
      const stub = stubTransport(() => {});
      const opening = openQlikSession({ ...opts, transport: stub.transport });
      await Promise.resolve();
      stub.fireClose(new Error("socket dropped"));
      await expect(opening).rejects.toThrow(/socket dropped/);
    });

    it("closes the transport when OpenDoc fails", async () => {
      const failing = stubTransport(() => {});
      let handler: (m: string) => void = () => {};
      failing.transport.onMessage = (h) => {
        handler = h;
      };
      failing.transport.send = (raw) => {
        const req = JSON.parse(raw) as Request;
        queueMicrotask(() =>
          handler(
            JSON.stringify({ id: req.id, error: { message: "no such app" } }),
          ),
        );
      };
      await expect(
        openQlikSession({ ...opts, transport: failing.transport }),
      ).rejects.toThrow(/OpenDoc failed/);
      expect(failing.closed()).toBe(true);
    });
  });
});
