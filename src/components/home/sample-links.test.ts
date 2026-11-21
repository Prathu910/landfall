import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HOME_FAQ } from "./home-faq";

const REPORT = join(__dirname, "../report");
const HOME = __dirname;

/** Every literal id="…" in the report components: the targets /sample/ renders. */
function reportIds(): Set<string> {
  const ids = new Set<string>();
  for (const file of readdirSync(REPORT).filter((f) => f.endsWith(".tsx"))) {
    const text = readFileSync(join(REPORT, file), "utf8");
    for (const match of text.matchAll(/\bid=\{?(?:anchor \? )?"([\w-]+)"/g)) {
      ids.add(match[1]);
    }
  }
  return ids;
}

function sampleHashes(): string[] {
  const questions = readFileSync(join(HOME, "three-questions.tsx"), "utf8");
  const fromQuestions = [...questions.matchAll(/"\/sample\/#([\w-]+)"/g)].map(
    (m) => m[1],
  );
  const fromFaq = HOME_FAQ.flatMap((item) => {
    const match = /^\/sample\/#([\w-]+)$/.exec(item.link?.href ?? "");
    return match ? [match[1]] : [];
  });
  return [...fromQuestions, ...fromFaq];
}

describe("homepage links into the sample report", () => {
  it("point at ids the report renders", () => {
    const ids = reportIds();
    const hashes = sampleHashes();
    expect(hashes.length).toBeGreaterThan(0);
    for (const hash of hashes) expect(ids, hash).toContain(hash);
  });
});
