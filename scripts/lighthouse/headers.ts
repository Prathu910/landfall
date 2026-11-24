/**
 * Reads the Cloudflare Pages `_headers` file (public/_headers, copied to
 * out/), so the local Lighthouse server sends the same caching headers as
 * production. Format: https://developers.cloudflare.com/pages/configuration/headers/
 * Only the `*` splat is supported, which is all the file uses.
 */
export interface HeaderRule {
  pattern: string;
  headers: Record<string, string>;
}

export function parseHeadersFile(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), headers: {} });
      continue;
    }
    const current = rules.at(-1);
    const colon = line.indexOf(":");
    if (!current || colon < 0) {
      throw new Error(`_headers: header line outside a rule: ${line}`);
    }
    const name = line.slice(0, colon).trim().toLowerCase();
    current.headers[name] = line.slice(colon + 1).trim();
  }
  return rules;
}

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`);
}

/** Every matching rule applies; a later rule's value wins for the same header. */
export function headersFor(
  rules: readonly HeaderRule[],
  pathname: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rule of rules) {
    if (patternToRegExp(rule.pattern).test(pathname)) {
      Object.assign(result, rule.headers);
    }
  }
  return result;
}
