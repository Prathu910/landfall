import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { headersFor, parseHeadersFile } from "./headers";

describe("parseHeadersFile", () => {
  const rules = parseHeadersFile(
    [
      "# hashed build output",
      "/_next/static/*",
      "  Cache-Control: public, max-age=31536000, immutable",
      "",
      "/home/*",
      "  Cache-Control: public, max-age=86400",
    ].join("\n"),
  );

  it("reads each path rule and its headers", () => {
    expect(rules).toEqual([
      {
        pattern: "/_next/static/*",
        headers: { "cache-control": "public, max-age=31536000, immutable" },
      },
      {
        pattern: "/home/*",
        headers: { "cache-control": "public, max-age=86400" },
      },
    ]);
  });

  it("matches a splat and leaves unmatched paths alone", () => {
    expect(headersFor(rules, "/_next/static/chunks/app.js")).toEqual({
      "cache-control": "public, max-age=31536000, immutable",
    });
    expect(headersFor(rules, "/guide/")).toEqual({});
  });

  it("rejects a header line before any rule", () => {
    expect(() => parseHeadersFile("  Cache-Control: no-store")).toThrow();
  });
});

describe("public/_headers", () => {
  const rules = parseHeadersFile(
    readFileSync(resolve(__dirname, "../../public/_headers"), "utf8"),
  );

  it("caches hashed build output for a year and never caches pages", () => {
    expect(headersFor(rules, "/_next/static/media/archivo.woff2")).toEqual({
      "cache-control": "public, max-age=31536000, immutable",
    });
    expect(headersFor(rules, "/")["cache-control"]).toBeUndefined();
    expect(
      headersFor(rules, "/data/occupations/261313.json")["cache-control"],
    ).toBeUndefined();
  });
});
