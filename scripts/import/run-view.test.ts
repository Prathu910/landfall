import { describe, expect, it } from "vitest";
import type { QlikSession } from "./qlik-client";
import { asAtSerial } from "./qlik-client";
import { runView } from "./run-view";
import { VIEWS } from "./views";

function recorder() {
  const calls: string[] = [];
  const session: QlikSession = {
    applyBookmark: async (id) => void calls.push(`bookmark ${id}`),
    setToggle: async (name, on) => void calls.push(`toggle ${name}=${on}`),
    select: async (field, values) =>
      void calls.push(
        `select ${field}=${values.map((v) => v.text ?? v.number).join("|")}`,
      ),
    clear: async (field) => void calls.push(`clear ${field}`),
    readTable: async () => {
      calls.push("read");
      return { header: ["Occupation", "Count"], rows: [["Nurse", "5"]] };
    },
    listAsAtMonths: async () => [],
    pageReads: () => 0,
    close: () => {},
  };
  return { calls, session };
}

const view = (id: string) => VIEWS.find((v) => v.id === id)!;

describe("runView", () => {
  it("clears filters, selects free fields, sets only shown toggles, then reads", async () => {
    const { calls, session } = recorder();
    const file = await runView(session, view("pool-by-score"), "2026-10", {});
    const firstSelect = calls.findIndex((c) => c.startsWith("select"));
    const clears = calls.filter((c) => c.startsWith("clear"));
    expect(clears).toHaveLength(12);
    expect(calls.lastIndexOf(clears[11])).toBeLessThan(firstSelect);
    const toggles = calls.filter((c) => c.startsWith("toggle"));
    expect(toggles).toHaveLength(12);
    expect(toggles.filter((t) => t.endsWith("=true")).sort()).toEqual([
      "toggle vShowOccupations=true",
      "toggle vShowPoints=true",
    ]);
    expect(calls.filter((c) => c.startsWith("select"))).toEqual([
      "select Visa Type=189PTS Points-Tested Stream|190SAS Skilled Australian Sponsored|491SNR State or Territory Nominated - Regional",
      "select EOI Status=SUBMITTED",
      `select As At Month=${asAtSerial("2026-10")}`,
    ]);
    expect(calls.at(-1)).toBe("read");
    expect(file.parts).toHaveLength(1);
    expect(file.parts[0].partition).toEqual({});
    expect(file.viewId).toBe("pool-by-score");
    expect(file.selections["EOI Status"]).toEqual(["SUBMITTED"]);
  });

  it("runs once per partition value", async () => {
    const { calls, session } = recorder();
    const file = await runView(session, view("state-pool"), "2026-10", {
      state: ["VIC", "ANY"],
    });
    expect(file.parts.map((p) => p.partition)).toEqual([
      { state: "VIC" },
      { state: "ANY" },
    ]);
    expect(calls).toContain("select Nominated State=VIC");
    expect(calls).toContain("select Nominated State=ANY");
    expect(calls.filter((c) => c === "read")).toHaveLength(2);
  });

  it("selects a score partition by number, since a text match on Score is ignored", async () => {
    const { session } = recorder();
    const selected: { text?: string; number?: number }[][] = [];
    session.select = async (field, values) => {
      if (field === "Score") selected.push(values);
    };
    const file = await runView(session, view("cohorts-by-score"), "2026-10", {
      score: ["65", "100"],
    });
    expect(selected).toEqual([[{ number: 65 }], [{ number: 100 }]]);
    expect(file.parts.map((p) => p.partition)).toEqual([
      { score: "65" },
      { score: "100" },
    ]);
  });

  it("runs every attribute variant, showing that attribute", async () => {
    const { calls, session } = recorder();
    const file = await runView(
      session,
      view("invited-profile-state"),
      "2026-10",
      {
        state: ["VIC"],
      },
    );
    expect(file.parts.map((p) => p.partition)).toEqual([
      { state: "VIC", attribute: "english" },
      { state: "VIC", attribute: "australianStudy" },
      { state: "VIC", attribute: "professionalYear" },
      { state: "VIC", attribute: "partnerSkills" },
    ]);
    expect(calls).toContain("toggle vShowEnglishLanguageScore=true");
    expect(calls).toContain("toggle vShowPartnerSkillsScore=true");
  });
});
