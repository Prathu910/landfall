import type { ReportFacts } from "../../../src/lib/outlook/read-contract.ts";
import { record } from "../../../src/lib/submissions/contract.ts";

// The facts go to the model, so the shape is checked exactly: an unknown key
// could carry a name, email or date of birth, which spec 7 forbids sending.

const MAX_TEXT = 400;
const MAX_ITEMS = 24;

type Check = (value: unknown) => boolean;

function text(value: unknown): boolean {
  return typeof value === "string" && value.length <= MAX_TEXT;
}
function textOrNull(value: unknown): boolean {
  return value === null || text(value);
}
function finite(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}
function boolean(value: unknown): boolean {
  return typeof value === "boolean";
}
function oneOf(...allowed: string[]): Check {
  return (value) => typeof value === "string" && allowed.includes(value);
}
function list(item: Check): Check {
  return (value) =>
    Array.isArray(value) && value.length <= MAX_ITEMS && value.every(item);
}
/** An object with exactly these keys, each passing its check. */
function shape(fields: Record<string, Check>): Check {
  return (value) => {
    if (!record(value)) return false;
    const keys = Object.keys(value);
    const expected = Object.keys(fields);
    return (
      keys.length === expected.length &&
      expected.every(
        (key) => Object.hasOwn(value, key) && fields[key](value[key]),
      )
    );
  };
}

const factsShape = shape({
  occupation: text,
  dataMonth: text,
  situation: oneOf("189", "state", "combined"),
  lodged: boolean,
  stamp: shape({ visa: text, state: textOrNull, label: text }),
  visas: list(
    shape({
      visa: text,
      label: text,
      state: textOrNull,
      points: finite,
      caption: text,
    }),
  ),
  counts: list(shape({ name: text, text, numbers: list(finite) })),
  route: list(text),
  wait: text,
  changes: list(
    shape({
      title: text,
      fromPoints: finite,
      toPoints: finite,
      toLabel: text,
      month: textOrNull,
    }),
  ),
  extraNumbers: list(finite),
});

export function validFacts(value: unknown): value is ReportFacts {
  return factsShape(value);
}
