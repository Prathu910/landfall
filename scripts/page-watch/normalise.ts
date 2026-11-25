// Turns an official page into the text a reader sees, without the parts that
// change on every visit (menus, cookie notices, "last updated" stamps), so a
// changed hash means changed content. Relative imports: runs under tsx.
import { createHash } from "node:crypto";
import { decodeEntities } from "../import/rounds";

export type NormalisedPage = { title: string; text: string; hash: string };

/**
 * Lines dropped before hashing, for every host ("*") and per host. Tune on
 * the real pages until a quiet week opens no issues (spec open question).
 */
export const VOLATILE_LINES: Record<string, RegExp[]> = {
  "*": [/page last updated/i, /last updated:/i, /^\d+ (views|visits)$/i],
};

const RAW_TEXT =
  /<!--[\s\S]*?-->|<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;
const TAG = /<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g;
const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);
const CHROME = new Set(["nav", "header", "footer"]);
const BLOCK =
  /<\/?(?:p|div|li|ul|ol|h[1-6]|tr|table|thead|tbody|tfoot|section|article|aside|main|br|hr|dl|dt|dd|blockquote|pre|figure|figcaption|form|fieldset|details|summary|option|caption|label|button)\b[^>]*>/gi;
// Home Affairs (SharePoint) pages ship their content as JSON in hidden fields
// that a script renders; the importer reads the same fields (scripts/import).
const HIDDEN_FIELD =
  /<input\b[^>]*\bid="ctl00_PlaceHolderMain_\w*HiddenField_Input"[^>]*>/gi;

type Matcher = (name: string, attrs: string) => boolean;
type Span = {
  start: number;
  innerStart: number;
  innerEnd: number;
  end: number;
};

/** The first element from `from` that `matches`, balanced by tag name. */
function findElement(html: string, matches: Matcher, from = 0): Span | null {
  const tags = new RegExp(TAG.source, "g");
  tags.lastIndex = from;
  let open: {
    name: string;
    start: number;
    innerStart: number;
    depth: number;
  } | null = null;
  for (let tag = tags.exec(html); tag; tag = tags.exec(html)) {
    const closing = tag[1] === "/";
    const name = tag[2].toLowerCase();
    const selfClosing = VOID.has(name) || tag[3].endsWith("/");
    const tagEnd = tag.index + tag[0].length;
    if (open === null) {
      if (closing || !matches(name, tag[3])) continue;
      if (selfClosing)
        return {
          start: tag.index,
          innerStart: tagEnd,
          innerEnd: tagEnd,
          end: tagEnd,
        };
      open = { name, start: tag.index, innerStart: tagEnd, depth: 1 };
    } else if (name === open.name && !selfClosing) {
      open.depth += closing ? -1 : 1;
      if (open.depth === 0)
        return {
          start: open.start,
          innerStart: open.innerStart,
          innerEnd: tag.index,
          end: tagEnd,
        };
    }
  }
  // An unclosed element: only its opening tag is matched, never the rest of the page.
  return (
    open && {
      start: open.start,
      innerStart: open.innerStart,
      innerEnd: open.innerStart,
      end: open.innerStart,
    }
  );
}

function removeElements(html: string, matches: Matcher): string {
  let kept = "";
  let position = 0;
  for (
    let span = findElement(html, matches);
    span;
    span = findElement(html, matches, position)
  ) {
    kept += html.slice(position, span.start);
    position = span.end;
  }
  return kept + html.slice(position);
}

function innerHtml(html: string, matches: Matcher): string | null {
  const span = findElement(html, matches);
  return span && span.innerEnd > span.innerStart
    ? html.slice(span.innerStart, span.innerEnd)
    : null;
}

function attrValues(attrs: string, names: string[]): string[] {
  const pattern = /\b([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  return [...attrs.matchAll(pattern)]
    .filter((attr) => names.includes(attr[1].toLowerCase()))
    .map((attr) => attr[2] ?? attr[3] ?? attr[4]);
}

const isChrome: Matcher = (name, attrs) =>
  CHROME.has(name) ||
  attrValues(attrs, ["id", "class"]).some((value) => /cookie/i.test(value));
const isMain: Matcher = (name, attrs) =>
  name === "main" ||
  attrValues(attrs, ["role"]).some((value) => value.toLowerCase() === "main");

/** The page's main region (else its body) with scripts, menus and cookie notices removed. */
function contentHtml(html: string): string {
  const cleaned = removeElements(html.replace(RAW_TEXT, " "), isChrome);
  return (
    innerHtml(cleaned, isMain) ??
    innerHtml(cleaned, (name) => name === "body") ??
    cleaned
  );
}

function volatileLines(url: string): RegExp[] {
  const host = new URL(url).host;
  return [...VOLATILE_LINES["*"], ...(VOLATILE_LINES[host] ?? [])];
}

function textLines(text: string, volatile: RegExp[]): string[] {
  return (
    text
      .split("\n")
      // Zero-width spaces pepper the Home Affairs pages; JavaScript's \s skips them.
      .map((line) =>
        line
          .replace(/[\u200b-\u200d\ufeff]/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(
        (line) =>
          line !== "" && !volatile.some((pattern) => pattern.test(line)),
      )
  );
}

function htmlLines(html: string, volatile: RegExp[]): string[] {
  const text = html
    .replace(RAW_TEXT, " ")
    // Line breaks in the source are only spacing; blocks make the lines.
    .replace(/\s+/g, " ")
    .replace(/<\/?t[dh]\b[^>]*>/gi, " ")
    .replace(BLOCK, "\n")
    .replace(/<[^>]*>/g, "");
  return textLines(decodeEntities(text), volatile);
}

function stringLeaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringLeaves);
}

function hiddenFieldLines(html: string, volatile: RegExp[]): string[] {
  return [...html.matchAll(HIDDEN_FIELD)].flatMap(([input]) => {
    const value = /\svalue="([^"]*)"/i.exec(input);
    if (!value) return [];
    const decoded = decodeEntities(value[1]);
    let leaves: string[];
    try {
      leaves = stringLeaves(JSON.parse(decoded));
    } catch {
      leaves = [decoded];
    }
    return leaves.flatMap((leaf) => htmlLines(leaf, volatile));
  });
}

function pageTitle(html: string, content: string): string {
  const heading = innerHtml(content, (name) => name === "h1");
  if (heading !== null) return htmlLines(heading, []).join(" ");
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!title) return "";
  return htmlLines(title[1], [])
    .join(" ")
    .split(/\s+[|–—-]\s+/)[0];
}

const sha256 = (data: string | Buffer) =>
  createHash("sha256").update(data).digest("hex");

function fromLines(title: string, lines: string[]): NormalisedPage {
  const text = lines.join("\n");
  return { title, text, hash: sha256(text) };
}

export function normalisePage(html: string, url: string): NormalisedPage {
  const volatile = volatileLines(url);
  const content = contentHtml(html);
  return fromLines(pageTitle(html, content), [
    ...htmlLines(content, volatile),
    ...hiddenFieldLines(html, volatile),
  ]);
}

/** A sign-in wall: a password field in the page's content. */
export function isLoginPage(html: string): boolean {
  return /<input\b[^>]*\btype\s*=\s*["']?password\b/i.test(contentHtml(html));
}

const fileName = (url: string) =>
  new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";

/** HTML is read as a page, other text line by line; a PDF or other file by its fingerprint. */
export function normaliseResponse(
  body: Buffer,
  contentType: string,
  url: string,
): NormalisedPage {
  const type = contentType.split(";")[0].trim().toLowerCase() || "unknown";
  if (/html|xml/.test(type)) return normalisePage(body.toString("utf8"), url);
  if (type.startsWith("text/"))
    return fromLines(
      fileName(url),
      textLines(body.toString("utf8"), volatileLines(url)),
    );
  return fromLines(fileName(url), [
    `${type} file, ${body.length} bytes, SHA-256 ${sha256(body)}`,
  ]);
}
