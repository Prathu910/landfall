import { describe, expect, it } from "vitest";
import index from "../../data/occupation-index.json";
import { codeFromSlug, occupationPath, occupationSlug } from "./slug";

describe("occupationSlug", () => {
  it("builds lower-case hyphenated slugs ending in the code", () => {
    expect(occupationSlug({ code: "261313", name: "Software Engineer" })).toBe(
      "software-engineer-261313",
    );
    expect(
      occupationSlug({ code: "254499", name: "Registered Nurses nec" }),
    ).toBe("registered-nurses-nec-254499");
    expect(occupationSlug({ code: "231213", name: "Ship's Master" })).toBe(
      "ship-s-master-231213",
    );
  });

  it("never leaves leading, trailing or doubled hyphens", () => {
    const slug = occupationSlug({ code: "1", name: "  A, B / C  " });
    expect(slug).not.toMatch(/^-|-$|--/);
  });
});

describe("codeFromSlug", () => {
  it("returns the trailing 6-digit code or null", () => {
    expect(codeFromSlug("software-engineer-261313")).toBe("261313");
    expect(codeFromSlug("software-engineer")).toBeNull();
    expect(codeFromSlug("")).toBeNull();
  });

  it("round-trips every indexed occupation with unique slugs", () => {
    const slugs = new Set<string>();
    for (const e of index) {
      const slug = occupationSlug(e);
      expect(codeFromSlug(slug)).toBe(e.code);
      slugs.add(slug);
    }
    expect(slugs.size).toBe(index.length);
  });
});

describe("occupationPath", () => {
  it("is under /occupations/ with a trailing slash", () => {
    expect(occupationPath({ code: "261313", name: "Software Engineer" })).toBe(
      "/occupations/software-engineer-261313/",
    );
  });
});
