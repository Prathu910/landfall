import { altText } from "../updates/social-copy";
import { NOT_ADVICE, sentence } from "./launch-common";
import type {
  CaptionParts,
  Chart,
  LaunchCard,
  LaunchPack,
  LaunchStamp,
} from "./launch-types";

const stampText = (s: LaunchStamp) => `Stamp: ${s.top}, ${s.word}, ${s.bottom}`;

function chartText(chart: Chart): string {
  const bars = chart.bars
    .map((b) => `${b.label}${b.sub ? ` ${b.sub}` : ""}: ${b.value}`)
    .join("; ");
  return `${chart.heading}: ${bars}`;
}

/** Every visible text of a launch card in reading order, for its alt text. */
function altParts(card: LaunchCard): (string | null)[] {
  switch (card.id) {
    case "launch-cover":
      return [
        `${card.eyebrow}: ${card.titleLines.join(" ")}`,
        card.sub,
        ...card.stamps.map(stampText),
      ];
    case "launch-list":
      return [
        card.eyebrow,
        card.title,
        card.lead,
        ...card.groups.map((g) =>
          [
            g.heading,
            g.rows
              .map(
                (r) =>
                  `${r.label}: ${r.value.replace(/\.$/, "")}${r.note ? ` (${r.note})` : ""}`,
              )
              .join("; "),
          ]
            .filter(Boolean)
            .join(": "),
        ),
        card.note,
      ];
    case "launch-text":
      return [
        card.eyebrow,
        card.title,
        ...card.paragraphs,
        ...card.facts.map((f) => `${f.label}: ${f.value}`),
        card.emphasis,
      ];
    case "launch-chart":
      return [
        card.eyebrow,
        card.title,
        card.lead,
        ...card.charts.map(chartText),
        card.key && `Solid: ${card.key.solid}; hatched: ${card.key.hatched}`,
        card.note,
      ];
    case "launch-compare":
      return [
        card.eyebrow,
        card.title,
        ...card.rows.map(
          (r) =>
            `${r.label}: ${r.values.map((v, i) => `${card.columns[i]} ${v}`).join("; ")}`,
        ),
        card.note,
      ];
    case "launch-link":
      return [card.eyebrow, card.title, card.sub, card.url, ...card.points];
    case "launch-story":
      return [
        card.eyebrow,
        card.title,
        card.sub,
        `Space for ${card.sticker.label}`,
        card.foot,
      ];
    case "profile-avatar":
      return [`The ${card.name} logo: an open lens on passport paper`];
    case "highlight":
      return [`Highlight cover: ${card.name}`];
    case "closing":
      return [];
  }
}

/** The image's alt text: "Card 2 of 9.", then every figure the card shows, and its source. */
export function launchAltText(card: LaunchCard): string {
  if (card.id === "closing") return altText(card);
  const where = card.position
    ? `Card ${card.position.index} of ${card.position.of}. `
    : "";
  const parts = altParts(card)
    .filter((p): p is string => p !== null && p !== "")
    .map(sentence);
  if (card.source) parts.push(sentence(card.source));
  return where + parts.join(" ");
}

/** The caption as posted: hook, body, call to action, link, the not-advice line, hashtags. */
export function captionText(parts: CaptionParts): string {
  return [
    parts.hook,
    "",
    parts.body.map(sentence).join(" "),
    "",
    parts.cta,
    parts.link,
    NOT_ADVICE,
    "",
    parts.hashtags.join(" "),
  ].join("\n");
}

/** The file name of slide `index` (0-based) in a post's folder: "01.png". */
export const slideFile = (index: number) =>
  `${String(index + 1).padStart(2, "0")}.png`;

/** captions.md: every post's caption, ready to paste, and each slide's alt text. */
export function captionsMarkdown(pack: LaunchPack): string {
  const posts = pack.posts.flatMap((post, i) => [
    `## Post ${i + 1}: ${post.title}${post.pinned ? " (pinned)" : ""}`,
    "",
    `Folder \`${post.slug}/\`, ${post.slides.length} slides.`,
    "",
    "```text",
    captionText(post.caption),
    "```",
    "",
    "Alt text (Advanced settings, Write alt text):",
    "",
    ...post.slides.map((slide, j) => `- \`${slideFile(j)}\`: ${slide.alt}`),
    "",
  ]);
  const stories = pack.stories.map(
    (story) => `- \`stories/${story.slug}.png\`: ${story.alt}`,
  );
  return [
    "# Launch captions",
    "",
    "Each caption is also in its post folder as `caption.json`.",
    "",
    ...posts,
    "## Stories",
    "",
    ...stories,
    "",
  ].join("\n");
}
