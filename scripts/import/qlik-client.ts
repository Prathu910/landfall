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
  /** Called once if the connection errors or closes; pending requests are failed. */
  onClose(handler: (reason: Error) => void): void;
  close(): void;
};

export type QlikSessionOptions = {
  throttleMs: number;
  transport?: Transport;
  maxPageReads: number;
  /** Per-call timeout in milliseconds. Defaults to 60000. */
  callTimeoutMs?: number;
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
  /**
   * Every As At Month the dashboard lists, oldest first. A session list
   * object on the field: no table read, no variable or toggle change, and not
   * counted as a page read.
   */
  listAsAtMonths(): Promise<MonthKey[]>;
  pageReads(): number;
  close(): void;
};

const MAX_CELLS_PER_PAGE = 10_000;
const GUARDRAIL_ERROR_CODE = 7005;
const GLOBAL_HANDLE = -1;
const AS_AT_FIELD = "As At Month";
// Far more than the dashboard will ever list (one value a month).
const MAX_AS_AT_VALUES = 500;

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

/** The month a serial from `asAtSerial` (or any day within it) falls in. */
export function monthFromSerial(serial: number): MonthKey {
  const date = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
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
      () => {
        socket.close();
        reject(new Error("WebSocket failed to open"));
      },
      { once: true },
    );
  });
  return {
    send: (message) => socket.send(message),
    onMessage: (handler) =>
      socket.addEventListener("message", (event) =>
        handler(String(event.data)),
      ),
    onClose: (handler) => {
      socket.addEventListener("error", () =>
        handler(new Error("WebSocket error")),
      );
      socket.addEventListener("close", () =>
        handler(new Error("WebSocket closed")),
      );
    },
    close: () => socket.close(),
  };
}

export async function openQlikSession(
  options: QlikSessionOptions,
): Promise<QlikSession> {
  const transport = options.transport ?? (await openLiveTransport());
  const timeoutMs = options.callTimeoutMs ?? 60_000;
  const pending = new Map<
    number,
    { resolve: (reply: Reply) => void; reject: (reason: Error) => void }
  >();
  transport.onMessage((raw) => {
    const reply = JSON.parse(raw) as Reply;
    if (typeof reply.id === "number") pending.get(reply.id)?.resolve(reply);
  });

  transport.onClose((reason) => {
    for (const entry of pending.values()) entry.reject(reason);
    pending.clear();
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reply = new Promise<Reply>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      timer = setTimeout(
        () =>
          reject(new Error(`Qlik ${method} timed out after ${timeoutMs} ms`)),
        timeoutMs,
      );
    });
    let message: Reply;
    try {
      transport.send(
        JSON.stringify({ jsonrpc: "2.0", id, handle, method, params }),
      );
      message = await reply;
    } finally {
      clearTimeout(timer);
      pending.delete(id);
    }
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

  let app: number;
  try {
    app = handleOf(await call<Handle>(GLOBAL_HANDLE, "OpenDoc", [QLIK_APP_ID]));
    await call(app, "ApplyBookmark", [QLIK_BOOKMARK_ID]);
  } catch (error) {
    transport.close();
    throw error;
  }

  // Engine handles stay valid for the whole session, so each is fetched once.
  const handles = new Map<string, number>();
  async function cachedHandle(
    method: "GetField" | "GetVariableByName" | "GetObject",
    name: string,
  ): Promise<number> {
    const key = `${method} ${name}`;
    let handle = handles.get(key);
    if (handle === undefined) {
      handle = handleOf(await call<Handle>(app, method, [name]));
      handles.set(key, handle);
    }
    return handle;
  }

  // Only this session's own calls change selections and toggles after the
  // bookmark, so repeating a known state would just load the server.
  const clearedFields = new Set<string>();
  const toggles = new Map<string, boolean>();

  return {
    async applyBookmark(id) {
      clearedFields.clear();
      toggles.clear();
      await call(app, "ApplyBookmark", [id]);
    },
    async setToggle(name, on) {
      if (!name.startsWith("vShow")) {
        throw new Error(
          `Refusing to set variable "${name}": only vShow* toggles are allowed`,
        );
      }
      if (toggles.get(name) === on) return;
      const variable = await cachedHandle("GetVariableByName", name);
      toggles.delete(name);
      await call(variable, "SetStringValue", [on ? "Y" : "N"]);
      toggles.set(name, on);
    },
    async select(name, values) {
      const qValues = values.map((value) =>
        value.number !== undefined
          ? { qNumber: value.number, qIsNumeric: true }
          : { qText: value.text },
      );
      const field = await cachedHandle("GetField", name);
      clearedFields.delete(name);
      await call(field, "SelectValues", [qValues, false, false]);
    },
    async clear(name) {
      if (clearedFields.has(name)) return;
      await call(await cachedHandle("GetField", name), "Clear", []);
      clearedFields.add(name);
    },
    async readTable(objectId) {
      const object = await cachedHandle("GetObject", objectId);
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
      // A short page would silently turn missing rows into zeros downstream.
      if (rows.length !== qcy) {
        throw new Error(
          `Incomplete table: ${objectId} returned ${rows.length} rows but reported ${qcy}`,
        );
      }
      return { header, rows };
    },
    async listAsAtMonths() {
      const { qReturn } = await call<{ qReturn: { qHandle: number } }>(
        app,
        "CreateSessionObject",
        [
          {
            qInfo: { qType: "ListObject" },
            qListObjectDef: {
              qDef: { qFieldDefs: [AS_AT_FIELD] },
              qInitialDataFetch: [
                { qTop: 0, qLeft: 0, qHeight: MAX_AS_AT_VALUES, qWidth: 1 },
              ],
            },
          },
        ],
      );
      const { qLayout } = await call<{
        qLayout: {
          qListObject?: {
            qDataPages?: { qMatrix: { qNum?: number | "NaN" }[][] }[];
          };
        };
      }>(qReturn.qHandle, "GetLayout", []);
      const cells = (qLayout.qListObject?.qDataPages ?? []).flatMap((page) =>
        page.qMatrix.map((row) => row[0]?.qNum),
      );
      const serials = cells.filter(
        (value): value is number => typeof value === "number",
      );
      if (serials.length === 0) {
        throw new Error(`The dashboard listed no ${AS_AT_FIELD} values`);
      }
      return serials.sort((a, b) => a - b).map(monthFromSerial);
    },
    pageReads: () => pageReads,
    close: () => transport.close(),
  };
}
