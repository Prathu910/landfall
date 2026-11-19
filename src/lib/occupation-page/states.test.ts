import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { loadOccupationCore } from "../data/load-server";
import { BANNED_COPY } from "../report/copy";
import { stateRows } from "./states";

const core254499 = loadOccupationCore("254499")!;
const core261313 = loadOccupationCore("261313")!;
const rows254499 = stateRows("254499", core254499, stateRuleData);
const rows261313 = stateRows("261313", core261313, stateRuleData);
const by = (rows: typeof rows254499, s: string) =>
  rows.find((r) => r.state === s)!;

describe("stateRows", () => {
  it("lists the eight jurisdictions in order", () => {
    expect(rows254499.map((r) => r.state)).toEqual([
      "NSW",
      "VIC",
      "QLD",
      "WA",
      "SA",
      "ACT",
      "TAS",
      "NT",
    ]);
  });
  it("reads list membership and who it is open to", () => {
    expect(by(rows254499, "NSW").onList).toBe("190");
    expect(by(rows254499, "NSW").openTo).toBe(
      "Living in NSW, elsewhere in Australia or offshore",
    );
    expect(by(rows254499, "QLD").onList).toBe("190 and 491");
    expect(by(rows254499, "QLD").openTo).toBe("Living in QLD or offshore");
    expect(by(rows254499, "VIC").onList).toBe("Rules being checked");
    expect(by(rows261313, "QLD").openTo).toBe("Living in QLD only");
  });
  it("sums 190 invitations as intervals", () => {
    expect(by(rows254499, "VIC").invited190).toBe("337–375");
    expect(by(rows254499, "NSW").invited190).toBe("327–346");
    expect(by(rows261313, "NSW").invited190).toBe("0–38");
  });
  it("says Not published when the month was not fetched", () => {
    const core = structuredClone(core254499);
    delete core.stateInvited["190"]!.NSW![core.asAt];
    expect(by(stateRows("254499", core, stateRuleData), "NSW").invited190).toBe(
      "Not published",
    );
  });
  it("says so when a code is missing from an imported list", () => {
    expect(
      by(stateRows("000000", core254499, stateRuleData), "QLD").onList,
    ).toBe("Not on its 2026–27 list");
  });
  it("links to each state's 190 source over https", () => {
    for (const r of rows254499) expect(r.href).toMatch(/^https:\/\//);
  });
  it("passes the copy rules", () => {
    for (const r of [...rows254499, ...rows261313]) {
      expect(Object.values(r).join(" ")).not.toMatch(BANNED_COPY);
    }
  });
  it("makes no negative claim when a non-list stream could admit the code", () => {
    const nsw = stateRuleData.rules.rules.find(
      (r) => r.state === "NSW" && r.visa === "190",
    )!;
    const listStream = nsw.streams[0];
    const other = {
      ...listStream,
      id: "nsw-other",
      occupations: {
        ...listStream.occupations,
        value: { kind: "not-imported" as const },
      },
    };
    const mixed = {
      ...stateRuleData,
      rules: {
        ...stateRuleData.rules,
        rules: stateRuleData.rules.rules.map((r) =>
          r === nsw ? { ...r, streams: [listStream, other] } : r,
        ),
      },
    };
    const row = by(stateRows("000000", core254499, mixed), "NSW");
    expect(row.onList).toBe("Not on its imported list");
    expect(row.openTo).toBe("See the official page");
  });
});
