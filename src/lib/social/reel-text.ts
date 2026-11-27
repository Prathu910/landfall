import { captionText } from "./captions";
import { EXIT_MS } from "./reel-motion";
import type { Reel, ReelScene } from "./reel-types";

/** A reel's text outside the video: caption.md and each scene's words. */

const seconds = (ms: number | null) =>
  ms === null ? "the end" : `${(ms / 1000).toFixed(1)} s`;

/** caption.md: the caption ready to paste, the cover and what each scene shows. */
export function reelCaptionMarkdown(reel: Reel): string {
  const scenes = reel.scenes.map((scene) => {
    const from = seconds(scene.inMs ?? 0);
    const to = seconds(
      scene.outMs === null ? reel.durationMs : scene.outMs + EXIT_MS,
    );
    return `- ${from} to ${to}: ${sceneText(scene)}`;
  });
  return [
    `# ${reel.title}`,
    "",
    `\`${reel.slug}.mp4\`: ${reel.width}x${reel.height}, ${reel.fps} fps, ${reel.durationMs / 1000} s, silent (add a trending sound in the Instagram app). Cover: \`cover.png\`, the frame at ${seconds(reel.coverMs)}.`,
    "",
    "## Caption",
    "",
    "```text",
    captionText(reel.caption),
    "```",
    "",
    "## Scenes",
    "",
    ...scenes,
    "",
  ].join("\n");
}

/** Every text a scene shows, in reading order. */
export function sceneText(scene: ReelScene): string {
  switch (scene.kind) {
    case "hook":
      return [scene.title.lines.join(" "), scene.sub.text].join(" ");
    case "chart":
      return [
        `${scene.eyebrow.text}.`,
        `${scene.title.text}.`,
        `${scene.heading.text}:`,
        scene.bars.map((b) => `${b.label}: ${b.value}`).join("; "),
      ].join(" ");
    case "reading":
      return [
        `${scene.title.text}.`,
        scene.lead.text,
        scene.emphasis.text,
      ].join(" ");
    case "link":
      return `${scene.title.text}: ${scene.url}`;
    case "end":
      return `${scene.title} · ${scene.url} · ${scene.handle}. ${scene.disclaimer}`;
  }
}
