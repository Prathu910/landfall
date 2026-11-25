import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isLoginPage, normalisePage, normaliseResponse } from "./normalise";

const url = "https://www.example.gov.au/visas/skilled";
const fixture = (name: string) =>
  readFileSync(join(__dirname, "__fixtures__", name), "utf8");

function page(mainContent: string, extra = ""): string {
  return `<!doctype html><html><head><title>Skilled visas | Example Government</title>
    <style>.a { color: red }</style><script>var cookieConsent = true;</script></head>
    <body><a href="#main">Skip to content</a>
    <header><nav><a href="/">Home</a><a href="/visas">Visas</a></nav></header>
    ${extra}
    <main><h1>Skilled visas</h1><p>Nominations   are
      open.</p>${mainContent}</main>
    <footer>Copyright 2026</footer></body></html>`;
}

const withNavAndCookie = page(
  "<ul><li>Points: 65</li><li>Age: under 45</li></ul>",
  `<div id="cookie-banner"><div><p>We use cookies.</p></div><button>Accept</button></div>
   <div class="site-cookie-notice">Cookie settings</div>`,
);

describe("normalisePage", () => {
  it("keeps the main content, one line per block, and drops the chrome", () => {
    const { title, text } = normalisePage(withNavAndCookie, url);
    expect(title).toBe("Skilled visas");
    expect(text).toBe(
      [
        "Skilled visas",
        "Nominations are open.",
        "Points: 65",
        "Age: under 45",
      ].join("\n"),
    );
    expect(text).not.toMatch(/cookie|Skip to content/i);
  });

  it("drops cookie notices and chrome even without a main element", () => {
    const bare = withNavAndCookie.replace(/<\/?main>/g, "");
    const { text } = normalisePage(bare, url);
    expect(text).not.toMatch(/cookie|Copyright|^Home$/im);
    expect(text).toContain("Nominations are open.");
  });

  it("uses a role=main region", () => {
    const html = `<body><div>Promo banner</div><div role="main"><div><p>Rules</p></div></div></body>`;
    expect(normalisePage(html, url).text).toBe("Rules");
  });

  it("ignores volatile lines such as the last-updated date", () => {
    expect(
      normalisePage(page("<p>Page last updated: 3 Dec 2026</p>"), url).hash,
    ).toBe(
      normalisePage(page("<p>Page last updated: 4 Dec 2026</p>"), url).hash,
    );
    expect(normalisePage(page("<p>1234 views</p>"), url).text).not.toMatch(
      /views/,
    );
    expect(normalisePage(page("<p>Points: 70</p>"), url).hash).not.toBe(
      normalisePage(page("<p>Points: 65</p>"), url).hash,
    );
  });

  it("drops zero-width spaces and the empty lines they leave", () => {
    const { text } = normalisePage(
      page("<p>\u200b\u200b</p><p>Fees\u200b apply</p>"),
      url,
    );
    expect(text).toBe("Skilled visas\nNominations are open.\nFees apply");
  });

  it("decodes entities after removing tags", () => {
    const { text } = normalisePage(
      page("<p>A &amp; B &lt;script&gt; &#8211; C&nbsp;D</p>"),
      url,
    );
    expect(text).toContain("A & B <script> – C D");
  });

  it("falls back to the <title> and then the host for the title", () => {
    const noHeading =
      "<html><head><title>Fees – Example Body</title></head><body><p>x</p></body></html>";
    expect(normalisePage(noHeading, url).title).toBe("Fees");
    expect(normalisePage("<p>x</p>", url).title).toBe("");
  });

  it("reads a saved state page", () => {
    const html = fixture("nsw-190.html");
    const result = normalisePage(html, url);
    expect(result.title).toBe("Skilled Nominated visa (subclass 190)");
    expect(result.text.split("\n").length).toBeGreaterThan(20);
    expect(result.text).not.toMatch(
      /Skip to (content|navigation)|function\(|cookies_enabled/,
    );
    expect(result.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(normalisePage(html, url).hash).toBe(result.hash);
  });

  it("reads the content Home Affairs keeps in its page schema field", () => {
    const { text } = normalisePage(fixture("homeaffairs-rounds.html"), url);
    expect(text).toContain(
      "Invitation rounds will be run by the Department of Home Affairs periodically during the program year for:",
    );
    expect(text).toContain("Skilled Independent visa (subclass 189)");
    expect(text).not.toMatch(/<\/?(p|li|ul)>|\\u003c/);
  });
});

describe("isLoginPage", () => {
  it("finds a password field in the page's content", () => {
    expect(
      isLoginPage(page('<form><input type="password" name="pw"></form>')),
    ).toBe(true);
    expect(isLoginPage(page("<p>Sign in to apply</p>"))).toBe(false);
    expect(isLoginPage(fixture("nsw-190.html"))).toBe(false);
  });
});

describe("normaliseResponse", () => {
  it("reads HTML, keeps the lines of plain text and fingerprints other files", () => {
    const html = normaliseResponse(
      Buffer.from(page("")),
      "text/html; charset=utf-8",
      url,
    );
    expect(html.title).toBe("Skilled visas");
    const csv = normaliseResponse(
      Buffer.from("code,name\n 261313 , Software engineer \n\n"),
      "text/csv",
      url,
    );
    expect(csv.text).toBe("code,name\n261313 , Software engineer");
    const pdf = normaliseResponse(
      Buffer.from("%PDF-1.7 binary"),
      "application/pdf",
      `${url}/guide.pdf`,
    );
    expect(pdf.title).toBe("guide.pdf");
    expect(pdf.text).toMatch(
      /^application\/pdf file, 15 bytes, SHA-256 [0-9a-f]{64}$/,
    );
  });
});
