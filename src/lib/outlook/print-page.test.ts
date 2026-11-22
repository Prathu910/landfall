import { describe, expect, it } from "vitest";
import { printBrandLine, printFooterText, printPageStyle } from "./print-page";

describe("printFooterText", () => {
  it("names the reader and the data month, and says it isn't a guarantee", () => {
    expect(printFooterText("Priya", "October 2026")).toBe(
      "MigrateLens report for Priya. Our best reading of SkillSelect data to October 2026, not a guarantee.",
    );
  });

  it("drops the name when the reader gave none", () => {
    expect(printFooterText("  ", "October 2026")).toBe(
      "MigrateLens report. Our best reading of SkillSelect data to October 2026, not a guarantee.",
    );
  });
});

describe("printPageStyle", () => {
  it("puts the footer bottom left and the page count bottom right", () => {
    const css = printPageStyle("Priya", "October 2026");
    expect(css).toMatch(/^@page \{/);
    expect(css).toContain(
      '@bottom-left { content: "MigrateLens report for Priya. Our best reading of SkillSelect data to October 2026, not a guarantee.";',
    );
    expect(css).toContain(
      '@bottom-right { content: "Page " counter(page) " of " counter(pages);',
    );
    // The report's own type token, which Chrome resolves in margin boxes.
    expect(css).toContain("font: 12px var(--font-report);");
  });

  it("escapes a name that could end the string or the style element", () => {
    const css = printPageStyle('A"}</style><b>', "October 2026");
    expect(css).not.toContain("</style>");
    expect(css).toContain("report for A\\22 \\7d \\3c /style\\3e \\3c b\\3e .");
  });

  it("escapes backslashes and line breaks", () => {
    const css = printPageStyle("a\\b\nc", "October 2026");
    expect(css).toContain("report for a\\5c b\\a c.");
  });
});

describe("printBrandLine", () => {
  it("names the reader, the day it was calculated and the snapshot", () => {
    expect(printBrandLine("Priya", "2026-11-21", "2026-10-31")).toBe(
      "Report for Priya, calculated 21 Nov 2026. SkillSelect data to 31 Oct 2026.",
    );
  });

  it("says Your report when there is no name", () => {
    expect(printBrandLine("", "2026-11-21", "2026-10-31")).toBe(
      "Your report, calculated 21 Nov 2026. SkillSelect data to 31 Oct 2026.",
    );
  });
});
