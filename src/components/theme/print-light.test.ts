import { describe, expect, it } from "vitest";
import { printLight } from "./print-light";

function fakeRoot(scheme: string | null) {
  const attributes = new Map<string, string>();
  if (scheme) attributes.set("data-mantine-color-scheme", scheme);
  return {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => {
      attributes.set(name, value);
    },
    scheme: () => attributes.get("data-mantine-color-scheme") ?? null,
  };
}

describe("printLight", () => {
  it("prints a dark page as light and restores dark afterwards", () => {
    const root = fakeRoot("dark");
    const print = printLight(root);
    print.enter();
    expect(root.scheme()).toBe("light");
    print.leave();
    expect(root.scheme()).toBe("dark");
  });
  it("survives beforeprint and the print query both firing", () => {
    const root = fakeRoot("dark");
    const print = printLight(root);
    print.enter();
    print.enter();
    print.leave();
    print.leave();
    expect(root.scheme()).toBe("dark");
  });
  it("leaves a light page, or one with no scheme yet, untouched", () => {
    for (const scheme of ["light", null]) {
      const root = fakeRoot(scheme);
      const print = printLight(root);
      print.enter();
      print.leave();
      expect(root.scheme()).toBe(scheme);
    }
  });
});
