import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ImportReport } from "./import-report";
import type { SetManifest } from "./set-manifest";
import type { Manifest } from "../data/types";
import { BANNED_COPY } from "../report/copy";
import { loadRecap } from "./load-server";
import {
  appendSection,
  buildSummary,
  replaceSwapParts,
  previewOrigin,
  sectionHeading,
  type SummaryInput,
} from "./summary-view";

const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(file, "utf8")) as T;

// The opening line states the snapshot and check date, so those are pinned
// to 2026-10: a new month (or a re-import) must not fail this test.
const manifest: Manifest = {
  ...readJson<Manifest>("src/data/manifest.json"),
  snapshotId: "skillselect-2026-10-31",
  asAt: "2026-10",
  checkedAt: "2026-11-17",
};
const facts = loadRecap("2026-10");
const monthSet = readJson<SetManifest>("public/social/2026-10/month/set.json");
const roundSet = readJson<SetManifest>(
  "public/social/2026-10/round-2026-10-15/set.json",
);

const report: ImportReport = {
  mode: "monthly",
  asAt: "2026-10",
  newestAsAt: "2026-10",
  pageReads: 120,
  budget: 250,
  revisions: [],
  unmatched: [],
  newRounds: [],
  durationSeconds: 900,
};

const base: SummaryInput = {
  kind: "data",
  month: "2026-10",
  round: null,
  facts,
  manifest,
  previousManifest: null,
  report,
  buildWarnings: [],
  publishedDataMonths: [],
  coverage: {
    current: { min: 22280, max: 22299 },
    previous: { min: 21400, max: 21420 },
  },
  sets: [monthSet],
  branch: "data/2026-10",
  blobBase: "https://github.com/owner/repo/blob",
  previewBase: "https://data-2026-10.migratelens.pages.dev",
  today: "2026-11-17",
};

const withRevision = (path: string, before: number, after: number) => ({
  ...report,
  revisions: [{ path, rowsBefore: before, rowsAfter: after }],
});

describe("buildSummary, a data update", () => {
  const md = buildSummary(base);

  it("opens with the one-line result", () => {
    expect(md.split("\n")[0]).toBe(
      "SkillSelect data as at 31 October 2026 (snapshot skillselect-2026-10-31), checked 17 November 2026. Validation passed; `npm run check` and `npm run build` passed.",
    );
  });

  it("states pools as ranges and invitations as minimums", () => {
    expect(md).toContain("189 pool: 181,076–182,311 → 166,555–167,904");
    expect(md).toContain(
      "189 holding an invitation (a minimum): under 286 → at least 14,876",
    );
    expect(md).not.toMatch(/(?<![\d,.])0–/);
  });

  it("names the spotlight and how to swap it", () => {
    expect(md).toContain("Spotlight: Registered Nurses nec (254499)");
    expect(md).toContain("To swap it, run the monthly workflow");
  });

  it("lists state floors and the round", () => {
    expect(md).toContain("| NSW | at least 790 |");
    expect(md).toContain("**189 round of 15 October 2026**");
    expect(md).toContain("EOIs invited: 20,000");
  });

  it("reports the coverage window, new unmatched names and no decision gaps", () => {
    expect(md).toContain(
      "Software Engineer (261313), 189, all statuses: 22,280–22,299 this month, 21,400–21,420 last month, a difference of +860 to +899",
    );
    expect(md).toContain(
      "New round names with no dashboard match: Patho; Rheumatologist.",
    );
    expect(md).not.toContain("Nothing needs a decision.");
  });

  it("embeds each image light and dark, then the caption", () => {
    expect(md).toContain("![Card 1 of 6. SkillSelect update: October 2026.");
    expect(md).toContain(
      "(https://github.com/owner/repo/blob/data/2026-10/public/social/2026-10/month/cover-light.png?raw=true)",
    );
    expect(md).toContain("```text\nSkillSelect update for October 2026.");
  });

  it("links the preview, and the publish line closes it", () => {
    expect(md).toContain(
      "https://data-2026-10.migratelens.pages.dev/updates/2026-10/",
    );
    expect(md).toContain("/occupations/registered-nurses-nec-254499/");
    expect(md.trimEnd().split("\n").pop()).toBe(
      "**To publish:** merge this pull request. Cloudflare deploys it in a few minutes. Closing it does not hold this update: the next scheduled run imports it again.",
    );
  });

  it("says closing the month's own pull request holds it until its branch goes", () => {
    const own = buildSummary({ ...base, branch: "data/skillselect-2026-10" });
    expect(own.trimEnd().split("\n").pop()).toBe(
      "**To publish:** merge this pull request. Cloudflare deploys it in a few minutes. To hold this update, close it and keep its branch: the monthly job skips October 2026 while `data/skillselect-2026-10` exists. Delete that branch and the job imports October 2026 again.",
    );
  });

  it("leaves the preview out without a project", () => {
    expect(buildSummary({ ...base, previewBase: null })).not.toMatch(
      /pages\.dev/,
    );
  });

  it("warns above 90% of the page-read budget only", () => {
    expect(
      buildSummary({ ...base, report: { ...report, pageReads: 231 } }),
    ).toMatch(/Page reads: 231 of 250/);
    expect(
      buildSummary({ ...base, report: { ...report, pageReads: 225 } }),
    ).not.toMatch(/Page reads/);
  });

  it("lists build warnings", () => {
    const warned = buildSummary({
      ...base,
      buildWarnings: ["fees are older than 12 months"],
    });
    expect(warned).toContain("- Build warning: fees are older than 12 months");
  });

  it("shows a revision of a published month with row counts", () => {
    const path = "data/raw/2026-10/status-history.rev-2026-12-14.json";
    const published = buildSummary({
      ...base,
      report: withRevision(path, 1200, 1203),
      publishedDataMonths: ["2026-10"],
    });
    expect(published).toContain("1,200 rows before, 1,203 after");
    expect(published).toMatch(/published recap affected/);
    const open = buildSummary({
      ...base,
      report: withRevision(path, 1200, 1203),
    });
    expect(open).toMatch(/no published recap affected/);
  });

  it("does not repeat unmatched names the previous month already had", () => {
    const md2 = buildSummary({ ...base, previousManifest: manifest });
    expect(md2).not.toContain("no dashboard match");
  });

  it("passes the banned-copy sweep outside quoted occupation names", () => {
    const names = [
      ...manifest.occupations.map((o) => o.name),
      ...monthSet.images.map((i) => i.alt),
      monthSet.caption,
    ];
    // The spec fixes this phrase in the publish line.
    const own = md.replace("in a few minutes", "soon");
    const prose = names.reduce((text, n) => text.split(n).join(""), own);
    expect(BANNED_COPY.exec(prose)?.[0] ?? null).toBeNull();
  });
});

describe("buildSummary, a round update", () => {
  const md = buildSummary({
    ...base,
    kind: "round",
    round: "2026-10-15",
    sets: [roundSet],
  });

  it("covers the round only", () => {
    expect(md.split("\n")[0]).toMatch(
      /^189 round of 15 October 2026, checked /,
    );
    expect(md).toContain("**189 round of 15 October 2026**");
    expect(md).not.toContain("Pool changes");
    expect(md).not.toContain("Coverage-window");
    expect(md).toContain("Round set, 15 October 2026");
  });
});

describe("previewOrigin", () => {
  it("builds the branch alias", () => {
    expect(previewOrigin("migratelens", "data/2026-10")).toBe(
      "https://data-2026-10.migratelens.pages.dev",
    );
    expect(
      previewOrigin("p", "data/round-2026-12-10-and-a-very-long-name"),
    ).toBe("https://data-round-2026-12-10-and-a.p.pages.dev");
  });
});

describe("appendSection", () => {
  const body = "first\n";
  const roundMd = "round words";
  const heading = "Added 12 Dec: 189 round of 10 Dec 2026";

  it("adds a dated section", () => {
    const out = appendSection(body, roundMd, heading);
    expect(out).toMatch(
      /## Added 12 Dec: 189 round of 10 Dec 2026\n\nround words/,
    );
    expect(out.startsWith("first")).toBe(true);
  });

  it("replaces the same section on a re-run and keeps later ones", () => {
    const once = appendSection(body, roundMd, heading);
    const later = appendSection(
      once,
      "month words",
      "Added 12 Dec: SkillSelect data as at 30 Nov 2026",
    );
    const again = appendSection(later, "round words v2", heading);
    expect(again.match(/## Added 12 Dec: 189 round/g)).toHaveLength(1);
    expect(again).toContain("round words v2");
    expect(again).not.toContain("round words\n");
    expect(again).toContain(
      "## Added 12 Dec: SkillSelect data as at 30 Nov 2026\n\nmonth words",
    );
  });

  it("names a round and a same-day data section with their own dates", () => {
    expect(
      sectionHeading({
        ...base,
        kind: "round",
        round: "2026-12-10",
        today: "2026-12-12",
      }),
    ).toBe("Added 12 Dec: 189 round of 10 Dec 2026");
    expect(
      sectionHeading({ ...base, month: "2026-11", today: "2026-12-12" }),
    ).toBe("Added 12 Dec: SkillSelect data as at 30 Nov 2026");
  });
});

describe("replaceSwapParts", () => {
  const md = buildSummary(base);
  // A swap's summary: a new spotlight and caption, and no import report.
  const swapped = md
    .replace("Spotlight: Registered Nurses nec", "Spotlight: Chef")
    .replace("SkillSelect update for October 2026.", "Swapped caption.")
    .replace(
      /### Needs your decision\n\n[^#]*/,
      "### Needs your decision\n\nNothing needs a decision.\n\n",
    );
  const roundSection =
    "## Added 20 Nov: 189 round of 19 Nov 2026\n\nround words\n";

  it("replaces the spotlight, images and publish line at the top of the body", () => {
    const body = `${md.trimEnd()}\n\n${roundSection}`;
    const out = replaceSwapParts(body, swapped, "2026-10");
    expect(out).toContain("Spotlight: Chef");
    expect(out).toContain("Swapped caption.");
    expect(out).not.toContain("Spotlight: Registered Nurses nec");
    // The import's decisions and the later round section stay.
    expect(out).toContain("- Coverage-window check:");
    expect(out.endsWith(roundSection)).toBe(true);
    expect(out.startsWith("SkillSelect data as at 31 October 2026")).toBe(true);
  });

  it("replaces them inside the month's appended section", () => {
    const body = appendSection(
      "189 round of 15 October 2026, checked 17 November 2026.\n",
      md,
      "Added 18 Nov: SkillSelect data as at 31 Oct 2026",
    );
    const out = replaceSwapParts(body, swapped, "2026-10");
    expect(out.startsWith("189 round of 15 October 2026")).toBe(true);
    expect(out).toContain(
      "## Added 18 Nov: SkillSelect data as at 31 Oct 2026\n\nSkillSelect data as at 31 October 2026",
    );
    expect(out).toContain("Spotlight: Chef");
    expect(out).toContain("- Coverage-window check:");
  });

  it("reads a body that GitHub's web editor saved with CRLF", () => {
    const body = `${md.trimEnd()}\n\n${roundSection}`.replace(/\n/g, "\r\n");
    const out = replaceSwapParts(body, swapped, "2026-10");
    expect(out).toContain("Spotlight: Chef");
    expect(out).not.toContain("\r");
    expect(out.endsWith(roundSection)).toBe(true);
    const appended = appendSection(
      "first\r\n\r\n## Added 12 Dec: x\r\n\r\nold\r\n",
      "new",
      "Added 12 Dec: x",
    );
    expect(appended).toBe("first\n\n## Added 12 Dec: x\n\nnew\n");
  });

  it("refuses a body with no data section for the month", () => {
    expect(() => replaceSwapParts("round words\n", swapped, "2026-10")).toThrow(
      /no data section for 2026-10/,
    );
  });
});
