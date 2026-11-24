import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RectStamp } from "./rect-stamp";
import { RoundStamp } from "./round-stamp";

// The Instagram card templates render these stamps to static markup under
// tsx and vitest, which have no `@/` alias and run no effects (ruling R9).
describe("recap stamps", () => {
  it("render to static markup with their text as the image's name", () => {
    const round = renderToStaticMarkup(
      <RoundStamp
        top="SUBCLASS 189 ROUND"
        word="20,000 INVITED"
        bottom="15 OCT 2026"
      />,
    );
    expect(round).toContain(
      'aria-label="SUBCLASS 189 ROUND: 20,000 INVITED, 15 OCT 2026"',
    );
    expect(round).toContain(">20,000</text>");
    expect(round).toContain(">INVITED</text>");
    const rect = renderToStaticMarkup(
      <RectStamp top="SUBCLASS" word="190" bottom="NOMINATED" />,
    );
    expect(rect).toContain('aria-label="SUBCLASS: 190, NOMINATED"');
  });

  it("give two stamps on one page their own filter ids", () => {
    const html = renderToStaticMarkup(
      <>
        <RectStamp top="SUBCLASS" word="190" bottom="NOMINATED" />
        <RectStamp top="SUBCLASS" word="491" bottom="REGIONAL" />
      </>,
    );
    const ids = [...html.matchAll(/<filter id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(2);
  });

  it.each(["round-stamp.tsx", "rect-stamp.tsx"])(
    "%s uses relative imports, no CSS module and no client code",
    (file) => {
      const source = readFileSync(`src/components/updates/${file}`, "utf8");
      expect(source).not.toMatch(/from "@\//);
      expect(source).not.toMatch(/\.module\.css/);
      expect(source).not.toMatch(/"use client"|useEffect|useState/);
    },
  );
});
