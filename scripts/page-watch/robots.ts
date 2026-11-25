// robots.txt rules for the page watcher (founder decision 25 Nov 2026: skip
// any URL that robots.txt disallows). Follows RFC 9309 matching: the longest
// matching rule wins, Allow wins a tie, `*` matches any run and a trailing `$`
// anchors the end. The watcher obeys both the `*` group and any group naming
// its User-Agent's product token, the stricter reading of the founder's rule.

export type RobotsRule = { allow: boolean; pattern: string };

/** "Mozilla" for "Mozilla/5.0 (…) …": the token robots.txt groups name. */
export function productToken(userAgent: string): string {
  return userAgent.split(/[/\s]/)[0];
}

type Group = { agents: string[]; rules: RobotsRule[] };

function groupsOf(text: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "user-agent") {
      // Consecutive User-agent lines share one group of rules.
      if (current === null || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && current) {
      // An empty Disallow allows everything; it adds no rule.
      if (value !== "")
        current.rules.push({ allow: key === "allow", pattern: value });
    }
  }
  return groups;
}

/** The rules from the `*` group and any group naming `token`. */
export function parseRobots(text: string, token: string): RobotsRule[] {
  const wanted = new Set(["*", token.toLowerCase()]);
  return groupsOf(text)
    .filter((group) => group.agents.some((agent) => wanted.has(agent)))
    .flatMap((group) => group.rules);
}

function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}${anchored ? "$" : ""}`).test(path);
}

export function isAllowed(rules: RobotsRule[], url: string): boolean {
  const { pathname, search } = new URL(url);
  const path = `${pathname}${search}`;
  if (pathname === "/robots.txt") return true;
  let best: RobotsRule | null = null;
  for (const rule of rules) {
    if (!matches(rule.pattern, path)) continue;
    const longer = best === null || rule.pattern.length > best.pattern.length;
    const tieAllows =
      best !== null &&
      rule.pattern.length === best.pattern.length &&
      rule.allow;
    if (longer || tieAllows) best = rule;
  }
  return best === null || best.allow;
}
