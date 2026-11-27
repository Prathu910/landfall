import { describe, expect, it } from "vitest";
import type { LaunchPack, LaunchPost } from "../../src/lib/social/launch-types";
import { PROFILE_OPTIONS } from "../../src/lib/social/profile";
import { avatarCard, highlightCards } from "../../src/lib/social/stories";
import { gridOrder, previewHtml } from "./launch-preview";

const caption = {
  hook: "Hook <b>",
  body: ["One.", "Two."],
  cta: "Save this.",
  link: "migratelens.com",
  hashtags: ["#SkillSelect"],
};
const posts: LaunchPost[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
  slug: `0${n}-post`,
  title: `Post ${n}`,
  pinned: [1, 4, 7].includes(n),
  slides: [
    {
      kind: "reused",
      files: { light: "a.png", dark: "b.png" },
      alt: `Alt "${n}"`,
    },
  ],
  caption,
}));
const pack: LaunchPack = {
  posts,
  stories: [],
  avatar: avatarCard(),
  highlights: highlightCards(),
};

describe("the launch preview", () => {
  it("puts the pinned posts first, then the rest newest first", () => {
    expect(gridOrder(posts).map((p) => p.slug.slice(0, 2))).toEqual([
      "01",
      "04",
      "07",
      "09",
      "08",
      "06",
      "05",
      "03",
      "02",
    ]);
  });

  it("is one page with relative image paths, copy buttons and escaped text", () => {
    const html = previewHtml(pack, PROFILE_OPTIONS[0]);
    expect(html).toContain('src="01-post/01.png"');
    expect(html).toContain('src="profile/avatar.png"');
    expect(html).toContain('src="profile/highlight-guide.png"');
    expect(html).not.toMatch(/(src|href)="(https?:|\/|file:)/);
    expect(html.match(/data-copy=/g)).toHaveLength(9);
    expect(html).toContain("Hook &lt;b&gt;");
    expect(html).toContain('alt="Alt &quot;1&quot;"');
    expect(html).toContain('name="viewport"');
  });
});
