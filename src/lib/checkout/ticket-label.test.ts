import { describe, expect, it } from "vitest";
import { ticketLabel } from "./ticket-label";

describe("ticketLabel", () => {
  it("joins the title and the meta, dropping the arrow", () => {
    expect(
      ticketLabel("Claim my free report →", "63 of 100 founding places left"),
    ).toBe("Claim my free report, 63 of 100 founding places left");
  });

  it("is the title alone when there is no meta", () => {
    expect(ticketLabel("Get my full PR report →", "")).toBe(
      "Get my full PR report",
    );
  });

  it("drops a non-breaking space before the arrow too", () => {
    expect(ticketLabel("Pay securely →", " UPI ")).toBe("Pay securely, UPI");
  });
});
