import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../../../lib/report/copy";
import {
  isImportedList,
  isStateRules,
} from "../../../lib/state-outlook/rules-guards";
import type {
  ImportedList,
  Sourced,
  StateVisaRules,
  Stream,
} from "../../../lib/state-outlook/rules-types";
import { stateRules } from "./index";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const LIST_IDS = ["wa", "sa", "qld", "nsw"];
// The research could not open these sites (HTTP 403): research "How to read this".
const UNREAD_STATES = ["ACT", "VIC", "TAS", "NT"];
const UNREAD_DOMAINS = [
  "act.gov.au",
  "vic.gov.au",
  "tas.gov.au",
  "nt.gov.au",
  "theterritory.com.au",
  "australiasnorthernterritory.com.au",
];
// Sites the research read directly ([D]).
const READ_HOSTS = [
  "migration.wa.gov.au",
  "www.nsw.gov.au",
  "www.migration.qld.gov.au",
  "migration.sa.gov.au",
  "immi.homeaffairs.gov.au",
];

function loadList(id: string): ImportedList {
  const file = path.resolve(
    process.cwd(),
    `src/data/state-rules/lists/${id}.json`,
  );
  const json: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!isImportedList(json)) throw new Error(`list ${id} is invalid`);
  return json;
}

const lists = Object.fromEntries(LIST_IDS.map((id) => [id, loadList(id)]));

function rule(state: string, visa: string): StateVisaRules {
  const found = stateRules.rules.find(
    (r) => r.state === state && r.visa === visa,
  );
  if (!found) throw new Error(`no rule for ${state} ${visa}`);
  return found;
}

function streamsOf(state: string): Stream[] {
  return stateRules.rules
    .filter((r) => r.state === state)
    .flatMap((r) => r.streams);
}

function sourcedOf(r: StateVisaRules): Sourced<unknown>[] {
  const out: Sourced<unknown>[] = [r.selectionSystem];
  if (r.ownScoreSystem) out.push(r.ownScoreSystem);
  for (const s of r.streams) {
    out.push(s.cohorts, s.status, s.occupations, ...s.requirements);
    out.push(...(s.restrictions ?? []));
  }
  return out;
}

const allSourced = stateRules.rules.flatMap(sourcedOf);

function host(url: string): string {
  return new URL(url).hostname;
}

function onDomain(url: string, domain: string): boolean {
  const h = host(url);
  return h === domain || h.endsWith(`.${domain}`);
}

function textsOf(r: StateVisaRules): string[] {
  const out = [r.selectionSystem.value];
  if (r.ownScoreSystem) out.push(r.ownScoreSystem.value.name);
  for (const s of r.streams) {
    out.push(s.name);
    out.push(...(s.restrictions ?? []).map((x) => x.value));
  }
  for (const s of sourcedOf(r)) if (s.note) out.push(s.note);
  return out;
}

describe("2026–27 state rules", () => {
  it("has exactly one rule for every state and visa pair", () => {
    const pairs = stateRules.rules.map((r) => `${r.state}-${r.visa}`);
    const expected = STATES.flatMap((s) => [`${s}-190`, `${s}-491`]);
    expect([...pairs].sort()).toEqual([...expected].sort());
  });

  it("passes the rules guard, and every rule records the research date", () => {
    expect(isStateRules(stateRules)).toBe(true);
    for (const s of allSourced) expect(s.checkedAt).toBe("2026-11-17");
  });

  it("gives every rule at least one stream, with ids unique within the rule", () => {
    for (const r of stateRules.rules) {
      const ids = r.streams.map((s) => s.id);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("marks every ACT, VIC, TAS and NT rule as secondary", () => {
    const rules = stateRules.rules.filter((r) =>
      UNREAD_STATES.includes(r.state),
    );
    expect(rules).toHaveLength(8);
    for (const s of rules.flatMap(sourcedOf)) {
      expect(s.verification).toBe("secondary");
    }
  });

  it("never cites an ACT, VIC, TAS or NT page for a verified rule", () => {
    const verified = allSourced.filter((s) => s.verification === "verified");
    expect(verified.length).toBeGreaterThan(0);
    for (const s of verified) {
      expect(UNREAD_DOMAINS.some((d) => onDomain(s.source, d))).toBe(false);
      expect(READ_HOSTS).toContain(host(s.source));
    }
  });

  it("records NSW 491 as closed in every stream, on a verified source", () => {
    for (const s of rule("NSW", "491").streams) {
      expect(s.status.value).toBe("closed");
      expect(s.status.verification).toBe("verified");
    }
  });

  it("records the other programs the research shows as closed", () => {
    const closed = (state: string, visa: string, id?: string) =>
      rule(state, visa)
        .streams.filter((s) => id === undefined || s.id === id)
        .map((s) => s.status.value);
    expect(new Set(closed("NT", "190"))).toEqual(new Set(["closed"]));
    expect(closed("NT", "491", "nt-491-offshore")).toEqual(["closed"]);
    expect(new Set(closed("VIC", "491"))).toEqual(new Set(["closed"]));
    expect(closed("TAS", "491", "tas-491-osop")).toEqual(["closed"]);
  });

  it("points WA, SA, QLD and NSW at their own imported lists", () => {
    for (const state of ["WA", "SA", "QLD", "NSW"]) {
      const refs = streamsOf(state).map((s) => s.occupations.value);
      const listIds = refs.flatMap((r) =>
        r.kind === "list" ? [r.listId] : [],
      );
      expect(listIds.length).toBeGreaterThan(0);
      expect(new Set(listIds)).toEqual(new Set([state.toLowerCase()]));
    }
  });

  it("resolves every listId and, per visa, every stream tag", () => {
    for (const r of stateRules.rules) {
      for (const s of r.streams) {
        const ref = s.occupations.value;
        if (ref.kind !== "list") continue;
        const list = lists[ref.listId];
        expect(list, `${s.id} → ${ref.listId}`).toBeDefined();
        const tags = new Set(
          Object.values(list.entries).flatMap((e) => e.streams?.[r.visa] ?? []),
        );
        for (const tag of ref.streams ?? []) {
          expect(tags.has(tag), `${s.id} (${r.visa}) → ${tag}`).toBe(true);
        }
      }
    }
  });

  it("documents every none-published and not-imported list, and keeps not-imported secondary", () => {
    for (const s of stateRules.rules.flatMap((r) => r.streams)) {
      const { value, note, verification } = s.occupations;
      if (value.kind === "none-published" || value.kind === "not-imported") {
        expect(note, s.id).toBeTruthy();
      }
      if (value.kind === "not-imported") expect(verification).toBe("secondary");
    }
  });

  it("treats Victoria as all federally eligible occupations, unverified", () => {
    for (const s of streamsOf("VIC")) {
      expect(s.occupations.value.kind).toBe("all-federally-eligible");
      expect(s.occupations.verification).toBe("secondary");
    }
  });

  it("keeps contradictory official pages secondary", () => {
    expect(rule("WA", "190").selectionSystem.verification).toBe("secondary");
    expect(rule("WA", "491").selectionSystem.verification).toBe("secondary");
    expect(rule("SA", "190").selectionSystem.verification).toBe("secondary");
    expect(rule("SA", "491").selectionSystem.verification).toBe("secondary");
    expect(rule("NSW", "190").selectionSystem.verification).toBe("secondary");
    const actMonths = ["190", "491"].flatMap((v) =>
      rule("ACT", v)
        .streams.flatMap((s) => s.requirements)
        .filter((q) => q.value.kind === "min-months-living-in-state"),
    );
    expect(actMonths).toHaveLength(2);
    for (const q of actMonths) expect(q.note).toMatch(/3 months.*6 months/);
  });

  it("keeps the NSW 1-month working approximation secondary, and the residence options verified", () => {
    const byId = (id: string) => {
      const s = rule("NSW", "190").streams.find((x) => x.id === id);
      if (!s) throw new Error(`no stream ${id}`);
      return s.requirements;
    };
    const [working] = byId("nsw-190-working");
    expect(working.value).toEqual({
      kind: "min-months-working-in-state",
      months: 1,
      related: "same-occupation",
    });
    expect(working.verification).toBe("secondary");
    expect(working.note).toMatch(
      /currently working in NSW \(20\+ hours a week\)/,
    );
    expect(working.note).toMatch(/approximation/);
    for (const id of ["nsw-190-living", "nsw-190-offshore"]) {
      for (const q of byId(id)) expect(q.verification).toBe("verified");
    }
  });

  it("records each state's related-work definition on every working requirement", () => {
    const expected: Record<string, string> = {
      SA: "anzsco-2-digit",
      QLD: "anzsco-3-digit",
    };
    for (const r of stateRules.rules) {
      for (const s of r.streams) {
        for (const q of s.requirements) {
          if (q.value.kind !== "min-months-working-in-state") continue;
          // Research §TAS item 2: 190 TSE priority roles need a job in the
          // same 3-digit ANZSCO group.
          const want =
            s.id === "tas-190-tse-priority"
              ? "anzsco-3-digit"
              : (expected[r.state] ?? "same-occupation");
          expect(q.value.related, s.id).toBe(want);
        }
      }
    }
  });

  it("records which work counts on every experience requirement (ruling P31)", () => {
    // Research §WA item 4 (Schedule 1: same first four ANZSCO digits); §QLD
    // item 4 (all pathways: "closely related" means the same first 3); §SA
    // item 4 (offshore: "skilled experience", no occupation named).
    const expected: Record<string, string> = {
      "wa-general-schedule-1": "anzsco-4-digit",
      "qld-offshore": "anzsco-3-digit",
      "sa-offshore": "any-skilled",
    };
    const seen = new Set<string>();
    for (const r of stateRules.rules) {
      for (const s of r.streams) {
        for (const q of s.requirements) {
          if (q.value.kind !== "min-years-experience") continue;
          seen.add(s.id);
          expect(q.value.related, s.id).toBe(
            expected[s.id] ?? "same-occupation",
          );
        }
      }
    }
    for (const id of Object.keys(expected)) expect(seen).toContain(id);
  });

  it("accepts those living in another state where no residence condition is stated", () => {
    // Research §NSW item 4 and §QLD item 4.
    for (const [state, id] of [
      ["NSW", "nsw-190-working"],
      ["QLD", "qld-building"],
    ]) {
      for (const s of streamsOf(state).filter((x) => x.id === id)) {
        expect(s.cohorts.value).toContain("living-in-other-state");
        expect(s.cohorts.value).toContain("living-in-state");
        expect(s.cohorts.verification).toBe("verified");
      }
    }
  });

  it("windows QLD's 'N of the last M months' rules, and only those", () => {
    const want: Record<string, [number, number]> = {
      "190": [9, 12],
      "491": [6, 9],
    };
    for (const visa of ["190", "491"]) {
      for (const id of ["qld-onshore", "qld-graduate"]) {
        const s = rule("QLD", visa).streams.find((x) => x.id === id);
        const months = (s?.requirements ?? [])
          .map((q) => q.value)
          .filter(
            (v) =>
              v.kind === "min-months-living-in-state" ||
              v.kind === "min-months-working-in-state",
          );
        expect(months, `${visa} ${id}`).toHaveLength(2);
        for (const v of months) {
          expect([v.months, v.ofLastMonths]).toEqual(want[visa]);
        }
      }
    }
    const windowed = stateRules.rules
      .flatMap((r) => r.streams)
      .flatMap((s) => s.requirements)
      .filter((q) => "ofLastMonths" in q.value);
    expect(windowed).toHaveLength(8);
  });

  it("keeps QLD 491's regional months unverified, since living regionally now can't prove them", () => {
    for (const id of ["qld-onshore", "qld-graduate"]) {
      const s = rule("QLD", "491").streams.find((x) => x.id === id);
      const regional = s?.requirements.filter(
        (q) => q.value.kind === "lives-regional",
      );
      expect(regional, id).toHaveLength(1);
      expect(regional?.[0].verification).toBe("secondary");
      expect(regional?.[0].note).toMatch(/regional Queensland/);
    }
  });

  it("keeps the WA and SA graduate study rules secondary, since the study question can't test them (ruling P28)", () => {
    const streamOf = (state: string, visa: string, id: string) => {
      const s = rule(state, visa).streams.find((x) => x.id === id);
      if (!s) throw new Error(`no stream ${id}`);
      return s;
    };
    for (const visa of ["190", "491"]) {
      const [waStudy] = streamOf("WA", visa, "wa-graduate").requirements;
      expect(waStudy.value.kind).toBe("studied-in-state");
      expect(waStudy.verification).toBe("secondary");
      expect(waStudy.note).toMatch(/87 weeks/);
      expect(waStudy.note).toMatch(/not applied as verified/);
      // Every SA Graduates rule but the visa-expiry gate is about the course.
      const [gate, ...graduate] = streamOf(
        "SA",
        visa,
        "sa-graduates",
      ).requirements;
      expect(gate.value.kind).toBe("visa-expiry-before");
      expect(graduate.map((q) => q.value.kind)).toEqual([
        "studied-in-state",
        "min-months-living-in-state",
        "min-months-working-in-state",
      ]);
      for (const q of graduate) {
        expect(q.verification, q.value.kind).toBe("secondary");
        expect(q.note).toMatch(/not applied as verified/);
      }
      expect(graduate[0].note).toMatch(/46 weeks.*75%/);
      for (const q of graduate.slice(1)) {
        expect(q.note).toMatch(/after completing the course/);
      }
    }
  });

  it("lists every cohort for Victoria, unverified", () => {
    for (const s of streamsOf("VIC")) {
      expect([...s.cohorts.value].sort()).toEqual([
        "living-in-other-state",
        "living-in-state",
        "offshore",
      ]);
    }
  });

  it("records that the imported NSW list has 78 unit groups where the research counted 80", () => {
    const note = rule("NSW", "190").streams[0].occupations.note ?? "";
    expect(note).toMatch(/78/);
    expect(note).toMatch(/80/);
  });

  it("gates every SA onshore stream on visa expiry by 31 January 2027", () => {
    const onshore = ["190", "491"].flatMap((v) =>
      rule("SA", v).streams.filter((s) =>
        s.cohorts.value.includes("living-in-state"),
      ),
    );
    expect(onshore).toHaveLength(6);
    for (const s of onshore) {
      expect(s.status.value).toBe("restricted");
      expect(s.restrictions?.map((x) => x.value).join(" ")).toMatch(
        /31 January 2027/,
      );
      expect(s.requirements.map((q) => q.value)).toContainEqual({
        kind: "visa-expiry-before",
        date: "2027-01-31",
      });
    }
  });

  it("names the state's own score system and published results where the research does", () => {
    for (const state of ["VIC", "ACT", "TAS"]) {
      for (const visa of ["190", "491"]) {
        expect(rule(state, visa).ownScoreSystem?.value.url).toMatch(/^https:/);
      }
    }
    for (const state of ["WA", "ACT", "TAS", "SA"]) {
      for (const visa of ["190", "491"]) {
        expect(rule(state, visa).resultsUrl).toMatch(/^https:/);
      }
    }
  });

  it("uses no banned copy in any name, restriction, description or note", () => {
    for (const r of stateRules.rules) {
      for (const text of textsOf(r)) {
        expect(text, `${r.state} ${r.visa}: ${text}`).not.toMatch(BANNED_COPY);
      }
    }
  });
});
