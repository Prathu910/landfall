import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { keepStoredRounds, writeRoundPage } from "./round-store";
import { decodeEntities, parseRoundPagesDetailed } from "./rounds";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
const current = fixture("invitation-rounds.html");
const previous = fixture("previous-rounds.html");

type Schema = Record<string, { [key: string]: string }[]>;
const SCHEMA_VALUE =
  /(id="ctl00_PlaceHolderMain_PageSchemaHiddenField_Input"[^>]*\svalue=")([^"]*)"/;

/** Rewrites a captured page's schema JSON, re-encoded as the page encodes it. */
function withSchema(html: string, change: (schema: Schema) => void): string {
  const match = SCHEMA_VALUE.exec(html);
  if (!match) throw new Error("fixture has no schema input");
  const schema = JSON.parse(decodeEntities(match[2])) as Schema;
  change(schema);
  const encoded = JSON.stringify(schema)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return html.replace(match[0], `${match[1]}${encoded}"`);
}

describe("keepStoredRounds", () => {
  const stored = parseRoundPagesDetailed(current, previous);
  const octBlock = (schema: Schema) =>
    schema.content.find((item) => item.text === "Current round")!.block;

  // The page after a November round: October has moved to the previous-rounds
  // page, which carries no per-row tie-breaks and no nominations table.
  const laterCurrent = withSchema(current, (schema) => {
    const item = schema.content.find((i) => i.text === "Current round")!;
    item.block = item.block.replace(
      "Invitations issued on 15 October 2026",
      "Invitations issued on 12 November 2026",
    );
  });
  const laterPrevious = withSchema(previous, (schema) => {
    const currentSchema = JSON.parse(
      decodeEntities(SCHEMA_VALUE.exec(current)![2]),
    ) as Schema;
    const block = octBlock(currentSchema)
      .replace(/<th scope="col">Tie break date<\/th>/, "")
      .replace(/<td>\d{2}\/\d{2}\/\d{4}<\/td>/g, "");
    schema.criteria.unshift({ title: "15 October 2026", description: block });
  });
  const later = parseRoundPagesDetailed(laterCurrent, laterPrevious);

  it("never re-derives a stored round from the previous-rounds page", () => {
    const reparsed = later.rounds.find((r) => r.date === "2026-10-15")!;
    expect(reparsed.nominations).toBeNull();
    expect(reparsed.rows.every((row) => row.tieBreak === null)).toBe(true);

    const kept = keepStoredRounds(stored, later);
    const oct = kept.rounds.find((r) => r.date === "2026-10-15");
    const storedOct = stored.rounds.find((r) => r.date === "2026-10-15");
    expect(oct).toEqual(storedOct);
    expect(
      oct?.rows.find((r) => r.occupationName === "Actuary")?.tieBreak,
    ).toBe("2026-09-03");
    expect(oct?.nominations?.programYear).toBe("2026-27");
  });

  it("adds only the new rounds, newest first", () => {
    const kept = keepStoredRounds(stored, later);
    expect(kept.rounds.map((r) => r.date)).toEqual([
      "2026-11-12",
      ...stored.rounds.map((r) => r.date),
    ]);
    expect(kept.rounds[0]).toEqual(later.rounds[0]);
    expect(kept.skipped).toEqual(stored.skipped);
  });

  it("keeps a stored round the pages no longer show", () => {
    const pages = { rounds: later.rounds.slice(0, 1), skipped: [] };
    const kept = keepStoredRounds(stored, pages);
    expect(kept.rounds).toHaveLength(stored.rounds.length + 1);
    expect(kept.skipped).toEqual(stored.skipped);
  });

  it("drops a skip once the round is stored, and takes every round with nothing stored", () => {
    const date = stored.rounds[1].date;
    const pages = {
      rounds: stored.rounds,
      skipped: [...stored.skipped, { date, reason: "unreadable" }],
    };
    expect(keepStoredRounds(stored, pages).skipped).toEqual(stored.skipped);
    expect(keepStoredRounds(null, later)).toEqual(later);
  });
});

describe("writeRoundPage", () => {
  let root: string;
  afterEach(() => {
    chmodSync(join(root, "rounds"), 0o755);
    rmSync(root, { recursive: true, force: true });
  });

  it("stores the page at rounds/<date>.html and skips an identical rewrite", () => {
    root = mkdtempSync(join(tmpdir(), "round-store-"));
    const path = writeRoundPage(root, "2026-10-15", current);
    expect(path).toBe(join(root, "rounds", "2026-10-15.html"));
    expect(readFileSync(path, "utf8")).toBe(current);
    // A read-only folder makes any write throw, so this proves a no-op.
    chmodSync(join(root, "rounds"), 0o555);
    expect(writeRoundPage(root, "2026-10-15", current)).toBe(path);
    chmodSync(join(root, "rounds"), 0o755);
    writeRoundPage(root, "2026-10-15", "changed");
    expect(readFileSync(path, "utf8")).toBe("changed");
    expect(readdirSync(join(root, "rounds"))).toEqual(["2026-10-15.html"]);
  });

  it("rejects a date that isn't YYYY-MM-DD", () => {
    root = mkdtempSync(join(tmpdir(), "round-store-"));
    writeRoundPage(root, "2026-10-15", current);
    expect(() => writeRoundPage(root, "../2026-10-15", current)).toThrow(
      /YYYY-MM-DD/,
    );
  });
});
