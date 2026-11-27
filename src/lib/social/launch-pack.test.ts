import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { FEES } from "../../data/guide/fees";
import { PASS_MARK, POINTS_TABLE } from "../../data/guide/points-table";
import { GUIDE_CHECKED_AT } from "../../data/guide/sources";
import { VISA_GUIDES } from "../../data/guide/visas";
import {
  frozenCore,
  frozenManifest,
} from "../data/__fixtures__/frozen-2026-10";
import type { OccupationCore } from "../data/types";
import { glossaryTerms } from "../guide/glossary";
import { stateRows } from "../occupation-page/states";
import { frozenView } from "../state-page/__fixtures__/frozen-views";
import { latestRound } from "../updates/latest-round";
import { loadRecap } from "../updates/load-server";
import { captionText } from "./captions";
import { buildLaunchPack, type LaunchInput } from "./launch-pack";
import type {
  LaunchCard,
  LaunchChartCard,
  LaunchListCard,
  LaunchPost,
} from "./launch-types";
import { occupationCards, type OccupationInput } from "./occupation-post";
import { POINTS_GROUPS } from "./points-post";
import { monthPostSlides, roundPostSlides } from "./reused-posts";

/** The pack on the frozen 2026-10 snapshot: NSW and Registered Nurses nec. */
const recap = loadRecap("2026-10");
const round = latestRound([recap]);
const nurse = frozenCore("254499") as OccupationCore;

function occupation(core: OccupationCore): OccupationInput {
  return {
    core,
    rows: stateRows(core.code, core, stateRuleData),
    tieBreak: "2025-11-19",
    federal: stateRuleData.federal,
  };
}

const input: LaunchInput = {
  asAt: "2026-10",
  recap,
  round: round as NonNullable<typeof round>,
  pointsTable: POINTS_TABLE,
  passMark: PASS_MARK,
  guides: VISA_GUIDES,
  fees: FEES,
  guideCheckedAt: GUIDE_CHECKED_AT,
  glossary: glossaryTerms(frozenManifest().sources),
  state: frozenView("NSW"),
  occupation: occupation(nurse),
};
const pack = buildLaunchPack(input);

const cardsOf = (post: LaunchPost): LaunchCard[] =>
  post.slides.flatMap((s) => (s.kind === "card" ? [s.card] : []));
const post = (prefix: string) =>
  pack.posts.find((p) => p.slug.startsWith(prefix)) as LaunchPost;

describe("buildLaunchPack", () => {
  it("makes nine posts in their folders, with posts 1, 4 and 7 pinned", () => {
    expect(pack.posts.map((p) => p.slug)).toEqual([
      "01-welcome",
      "02-round-oct",
      "03-update-oct",
      "04-points-table",
      "05-189-190-491",
      "06-jargon",
      "07-is-65-enough",
      "08-state-nsw",
      "09-occupation-254499",
    ]);
    expect(pack.posts.filter((p) => p.pinned).map((p) => p.slug)).toEqual([
      "01-welcome",
      "04-points-table",
      "07-is-65-enough",
    ]);
  });

  it("numbers each rendered post's cards and ends it on the closing card", () => {
    for (const p of pack.posts.filter((p) => p.slides[0].kind === "card")) {
      const cards = cardsOf(p);
      expect(cards[0].id, p.slug).toBe("launch-cover");
      expect(cards.at(-1)?.id, p.slug).toBe("closing");
      cards.forEach((card, i) =>
        expect(card.position).toEqual({ index: i + 1, of: cards.length }),
      );
      p.slides.forEach((slide, i) =>
        expect(slide.alt).toMatch(
          new RegExp(`^Card ${i + 1} of ${cards.length}\\.`),
        ),
      );
    }
  });

  it("reuses the monthly sets' files for posts 2 and 3, card 2 from the round set", () => {
    const round = roundPostSlides(recap);
    const month = monthPostSlides(recap);
    expect(round.map((s) => s.kind === "reused" && s.files.light)).toEqual([
      "public/social/2026-10/round-2026-10-15/cover-light.png",
      "public/social/2026-10/round-2026-10-15/round-light.png",
      "public/social/2026-10/round-2026-10-15/closing-light.png",
    ]);
    expect(month[1].kind === "reused" && month[1].files.dark).toBe(
      "public/social/2026-10/round-2026-10-15/round-dark.png",
    );
    expect(month[1].alt).toMatch(/^Card 2 of 6\./);
  });
});

describe("the points table post", () => {
  it("shows every row of the table exactly once, on its group's slide", () => {
    const lists = cardsOf(post("04")).filter(
      (c): c is LaunchListCard => c.id === "launch-list",
    );
    expect(lists).toHaveLength(POINTS_GROUPS.length);
    const shown = lists.flatMap((c) =>
      c.groups.flatMap((g) => g.rows.map((r) => r.value)),
    );
    const rows = POINTS_TABLE.flatMap((f) => f.rows);
    expect(shown).toHaveLength(rows.length);
    expect(lists[0].groups[0].rows.map((r) => r.value)).toEqual([
      "+25",
      "+30",
      "+25",
      "+15",
    ]);
  });

  it("dates every slide by the table's checked day", () => {
    for (const card of cardsOf(post("04"))) {
      if (card.id !== "closing")
        expect(card.source).toMatch(/checked 23 Nov 2026$/);
    }
  });
});

describe("the visas post", () => {
  it("compares the visas without their charges", () => {
    const compare = cardsOf(post("05")).find((c) => c.id === "launch-compare");
    expect(
      compare?.id === "launch-compare" && compare.rows.map((r) => r.label),
    ).toEqual([
      "Kind of visa",
      "Who nominates you",
      "Points for nomination",
      "Where you live",
      "Permanent residence",
    ]);
    expect(captionText(post("05").caption)).not.toMatch(/\$/);
  });
});

describe("the state spotlight", () => {
  const charts = cardsOf(post("08")).filter(
    (c): c is LaunchChartCard => c.id === "launch-chart",
  );

  it("names the count on every chart as EOIs holding an invitation (R3)", () => {
    for (const chart of charts.flatMap((c) => c.charts)) {
      expect(chart.heading).toMatch(/holding an invitation/);
    }
  });

  it("keeps a hidden month as a range, never zero", () => {
    const [months] = charts;
    const jan = months.charts[0].bars.find((b) => b.label === "Jan");
    expect(jan?.value).toBe("<20 each");
    expect(jan?.solid).toBe(0);
    expect(jan?.hatched).toBeGreaterThan(0);
    const oct = months.charts[0].bars.at(-1);
    expect(oct?.value).toBe("790+");
  });
});

describe("the occupation spotlight", () => {
  it("leads with the latest listed round, dated by that round", () => {
    const [, rounds] = cardsOf(post("09"));
    expect(rounds.id === "launch-chart" && rounds.title).toBe(
      "70 points on 15 Oct 2026",
    );
  });

  it("shows a round that skipped the occupation as Not listed, never 0", () => {
    const skipped = {
      ...nurse,
      rounds189: [
        { date: "2026-10-15", cutoff: null },
        ...nurse.rounds189.slice(1),
      ],
    };
    const [cover, rounds] = occupationCards(occupation(skipped));
    expect(cover.id === "launch-cover" && cover.stamps[0].word).toBe(
      "NOT LISTED",
    );
    const latest =
      rounds.id === "launch-chart" ? rounds.charts[0].bars.at(-1) : null;
    expect(latest).toMatchObject({ value: "Not listed", empty: true });
  });

  it("draws a masked pool count as a hatched range with no published part", () => {
    const pool = cardsOf(post("09")).find(
      (c): c is LaunchChartCard =>
        c.id === "launch-chart" && c.title.includes("189 pool"),
    );
    const masked = pool?.charts[0].bars.find((b) => b.value === "under 20");
    expect(masked).toMatchObject({ solid: 0 });
    expect(masked?.hatched).toBeGreaterThan(0);
  });
});
