import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FreeTag } from "./free-tag";
import { Ticket } from "./ticket";

describe("Ticket", () => {
  it("names the button by its title and meta, and hides the stub", () => {
    const html = renderToStaticMarkup(
      <Ticket
        variant="ink"
        stub="FOUNDING"
        title="Claim my free report →"
        sub="63 of 100 founding places left · issued in seconds"
        metaText="63 of 100 founding places left"
      />,
    );
    expect(html).toContain(
      'aria-label="Claim my free report, 63 of 100 founding places left"',
    );
    expect(html).toMatch(/aria-hidden="true"><span>FOUNDING<\/span>/);
    expect(html).toContain('type="button"');
    expect(html).not.toContain("aria-busy");
  });

  it("uses a string meta as it is", () => {
    const html = renderToStaticMarkup(
      <Ticket
        variant="pass"
        stub="PR REPORT"
        title="Get my full PR report →"
        sub="Your queue, your wait, your best state"
        meta="one-off · 7-day no-questions refund"
      />,
    );
    expect(html).toContain(
      'aria-label="Get my full PR report, one-off · 7-day no-questions refund"',
    );
  });

  it("marks a busy ticket busy and disabled", () => {
    const html = renderToStaticMarkup(
      <Ticket variant="ink" stub="ADMIT ONE" title="Pay →" sub="" busy />,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
  });
});

describe("FreeTag", () => {
  it("reads FREE", () => {
    expect(renderToStaticMarkup(<FreeTag />)).toContain(">FREE</span>");
  });
});
