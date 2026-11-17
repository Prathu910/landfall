import type { MonthKey } from "../../src/lib/data/types";
import {
  DASHBOARD_ORIGIN,
  DASHBOARD_PAGE_URL,
  QLIK_APP_ID,
  QLIK_BOOKMARK_ID,
  QLIK_WEBSOCKET_URL,
} from "./qlik-constants";

export type Transport = {
  send(message: string): void;
  onMessage(handler: (message: string) => void): void;
  close(): void;
};

export type QlikSessionOptions = {
  throttleMs: number;
  transport?: Transport;
  maxPageReads: number;
};

export class GuardrailError extends Error {}
export class BudgetExceededError extends Error {}

export type QlikSession = {
  applyBookmark(id: string): Promise<void>;
  setToggle(name: `vShow${string}`, on: boolean): Promise<void>;
  select(
    field: string,
    values: { text?: string; number?: number }[],
  ): Promise<void>;
  clear(field: string): Promise<void>;
  readTable(objectId: string): Promise<{ header: string[]; rows: string[][] }>;
  pageReads(): number;
  close(): void;
};

const MAX_CELLS_PER_PAGE = 10_000;
const GUARDRAIL_ERROR_CODE = 7005;
const GLOBAL_HANDLE = -1;

type Titled = { qFallbackTitle?: string };
type Hypercube = {
  qSize: { qcx: number; qcy: number };
  qError?: { qErrorCode: number };
  qDimensionInfo?: Titled[];
  qMeasureInfo?: Titled[];
};
type Reply = { id?: number; result?: unknown; error?: unknown };

/** Excel serial (days since 1899-12-30) of the last day of the month. */
export function asAtSerial(month: MonthKey): number {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthEnd = Date.UTC(year, monthNumber, 0);
  return (monthEnd - Date.UTC(1899, 11, 30)) / 86_400_000;
}

const sleep = (ms: number) =>
  ms > 0
    ? new Promise<void>((resolve) => setTimeout(resolve, ms))
    : Promise.resolve();

async function openLiveTransport(): Promise<Transport> {
  const page = await fetch(DASHBOARD_PAGE_URL);
  if (!page.ok) throw new Error(`Dashboard page returned ${page.status}`);
  const cookie = page.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const socket = new WebSocket(QLIK_WEBSOCKET_URL, {
    headers: { cookie, origin: DASHBOARD_ORIGIN },
  } as never);
  await new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener(
      "error",
      () => reject(new Error("WebSocket failed to open")),
      {
        once: true,
      },
    );
  });
  return {
    send: (message) => socket.send(message),
    onMessage: (handler) =>
      socket.addEventListener("message", (event) =>
        handler(String(event.data)),
      ),
    close: () => socket.close(),
  };
}

export async function openQlikSession(
  options: QlikSessionOptions,
): Promise<QlikSession> {
  const transport = options.transport ?? (await openLiveTransport());
  const pending = new Map<number, (reply: Reply) => void>();
  transport.onMessage((raw) => {
    const reply = JSON.parse(raw) as Reply;
    if (typeof reply.id === "number") pending.get(reply.id)?.(reply);
  });

  let nextId = 0;
  let lastCallAt = 0;
  let pageReads = 0;

  async function call<T>(
    handle: number,
    method: string,
    params: unknown[],
  ): Promise<T> {
    const wait = lastCallAt + options.throttleMs - Date.now();
    if (lastCallAt && wait > 0) await sleep(wait);
    const id = ++nextId;
    const reply = new Promise<Reply>((resolve) => pending.set(id, resolve));
    transport.send(
      JSON.stringify({ jsonrpc: "2.0", id, handle, method, params }),
    );
    const message = await reply;
    pending.delete(id);
    lastCallAt = Date.now();
    if (message.error !== undefined) {
      throw new Error(
        `Qlik ${method} failed: ${JSON.stringify(message.error)}`,
      );
    }
    return message.result as T;
  }

  type Handle = { qReturn: { qHandle: number } };
  const handleOf = (result: Handle) => result.qReturn.qHandle;

  const app = handleOf(
    await call<Handle>(GLOBAL_HANDLE, "OpenDoc", [QLIK_APP_ID]),
  );

  await call(app, "ApplyBookmark", [QLIK_BOOKMARK_ID]);

  async function field(name: string): Promise<number> {
    return handleOf(await call<Handle>(app, "GetField", [name]));
  }

  return {
    async applyBookmark(id) {
      await call(app, "ApplyBookmark", [id]);
    },
    async setToggle(name, on) {
      if (!name.startsWith("vShow")) {
        throw new Error(
          `Refusing to set variable "${name}": only vShow* toggles are allowed`,
        );
      }
      const variable = handleOf(
        await call<Handle>(app, "GetVariableByName", [name]),
      );
      await call(variable, "SetStringValue", [on ? "Y" : "N"]);
    },
    async select(name, values) {
      const qValues = values.map((value) =>
        value.number !== undefined
          ? { qNumber: value.number, qIsNumeric: true }
          : { qText: value.text },
      );
      await call(await field(name), "SelectValues", [qValues, false, false]);
    },
    async clear(name) {
      await call(await field(name), "Clear", []);
    },
    async readTable(objectId) {
      const object = handleOf(await call<Handle>(app, "GetObject", [objectId]));
      const { qLayout } = await call<{ qLayout: { qHyperCube: Hypercube } }>(
        object,
        "GetLayout",
        [],
      );
      const cube = qLayout.qHyperCube;
      if (cube.qError?.qErrorCode === GUARDRAIL_ERROR_CODE) {
        throw new GuardrailError(
          `Dashboard refused to calculate ${objectId} (error ${GUARDRAIL_ERROR_CODE}); too many detail columns or filtered fields`,
        );
      }
      const { qcx, qcy } = cube.qSize;
      const header = [
        ...(cube.qDimensionInfo ?? []).filter((d) => d.qFallbackTitle),
        ...(cube.qMeasureInfo ?? []),
      ].map((info) => info.qFallbackTitle ?? "");
      if (header.length !== qcx) {
        throw new Error(
          `Table shape changed for ${objectId}: ${header.length} titled columns but width ${qcx}`,
        );
      }
      const height = Math.floor(MAX_CELLS_PER_PAGE / qcx);
      const rows: string[][] = [];
      for (let top = 0; top < qcy; top += height) {
        if (pageReads >= options.maxPageReads) {
          throw new BudgetExceededError(
            `Page-read budget of ${options.maxPageReads} exhausted`,
          );
        }
        pageReads += 1;
        const { qDataPages } = await call<{
          qDataPages: { qMatrix: { qText: string }[][] }[];
        }>(object, "GetHyperCubeData", [
          "/qHyperCubeDef",
          [{ qTop: top, qLeft: 0, qHeight: height, qWidth: qcx }],
        ]);
        for (const row of qDataPages[0].qMatrix)
          rows.push(row.map((cell) => cell.qText));
      }
      return { header, rows };
    },
    pageReads: () => pageReads,
    close: () => transport.close(),
  };
}
